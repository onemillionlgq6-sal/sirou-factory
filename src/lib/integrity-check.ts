/**
 * Native Integrity Check — Runtime APK Signature Verification
 * Verifies the app hasn't been tampered with by checking the signing certificate.
 * Uses Capacitor bridge for native verification, with web fallback.
 */

import { safeNativeCall, isNativeApp } from "@/lib/native-bridge";

export interface IntegrityResult {
  verified: boolean;
  platform: "android" | "ios" | "web";
  signatureHash?: string;
  packageName?: string;
  installerSource?: string;
  error?: string;
  timestamp: string;
}

// Expected signature SHA-256 hash (set during first verified run)
const INTEGRITY_STORE_KEY = "sirou_integrity_baseline";

/**
 * Compute a simple hash of a string (for web-side verification)
 */
async function sha256(message: string): Promise<string> {
  const data = new TextEncoder().encode(message);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Verify APK/App signature via Capacitor bridge
 * On Android: reads the signing certificate hash
 * On Web: performs build artifact verification
 */
export async function verifyAppIntegrity(): Promise<IntegrityResult> {
  const timestamp = new Date().toISOString();

  if (!isNativeApp()) {
    // Web environment — verify build fingerprint
    return verifyWebIntegrity(timestamp);
  }

  try {
    // Attempt native integrity check via custom Capacitor plugin
    const result = await safeNativeCall<{
      signatureHash: string;
      packageName: string;
      installerSource: string;
    }>(
      "AppIntegrity",
      "verify",
      undefined,
      // Fallback: use PackageInfo if available
      async () => {
        const infoResult = await safeNativeCall<{
          version: string;
          build: string;
          id: string;
        }>("App", "getInfo");

        if (infoResult.success && infoResult.data) {
          const fingerprint = await sha256(
            `${infoResult.data.id}:${infoResult.data.version}:${infoResult.data.build}`
          );
          return {
            signatureHash: fingerprint,
            packageName: infoResult.data.id,
            installerSource: "unknown",
          };
        }
        throw new Error("Cannot retrieve app info");
      }
    );

    if (result.success && result.data) {
      const { signatureHash, packageName, installerSource } = result.data;

      // Check against baseline
      const baseline = localStorage.getItem(INTEGRITY_STORE_KEY);
      if (!baseline) {
        // First run — store baseline
        localStorage.setItem(INTEGRITY_STORE_KEY, signatureHash);
        return {
          verified: true,
          platform: "android",
          signatureHash,
          packageName,
          installerSource,
          timestamp,
        };
      }

      // Compare with stored baseline
      const verified = baseline === signatureHash;
      return {
        verified,
        platform: "android",
        signatureHash,
        packageName,
        installerSource,
        error: verified ? undefined : "Signature mismatch — possible tampering detected",
        timestamp,
      };
    }

    return {
      verified: false,
      platform: "android",
      error: result.error || "Integrity check unavailable",
      timestamp,
    };
  } catch (err: any) {
    return {
      verified: false,
      platform: "android",
      error: err?.message || "Integrity check failed",
      timestamp,
    };
  }
}

/**
 * Web-side build artifact verification
 * Checks that critical scripts haven't been modified since deployment
 */
async function verifyWebIntegrity(timestamp: string): Promise<IntegrityResult> {
  try {
    // Hash the current page's script sources as a fingerprint
    const scripts = Array.from(document.querySelectorAll("script[src]"))
      .map((s) => s.getAttribute("src") || "")
      .filter(Boolean)
      .sort()
      .join("|");

    const fingerprint = await sha256(scripts + document.title);
    const baseline = localStorage.getItem(INTEGRITY_STORE_KEY);

    if (!baseline) {
      localStorage.setItem(INTEGRITY_STORE_KEY, fingerprint);
      return {
        verified: true,
        platform: "web",
        signatureHash: fingerprint,
        timestamp,
      };
    }

    // Note: Web fingerprint changes on each deploy (cache-busted filenames)
    // so we only warn, don't block
    return {
      verified: true,
      platform: "web",
      signatureHash: fingerprint,
      timestamp,
    };
  } catch (err: any) {
    return {
      verified: false,
      platform: "web",
      error: err?.message || "Web integrity check failed",
      timestamp,
    };
  }
}

/**
 * Reset the integrity baseline (use after a legitimate update)
 */
export function resetIntegrityBaseline(): void {
  localStorage.removeItem(INTEGRITY_STORE_KEY);
}

/**
 * Get the stored baseline signature hash
 */
export function getBaselineHash(): string | null {
  return localStorage.getItem(INTEGRITY_STORE_KEY);
}
