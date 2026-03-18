/**
 * Biometric Authentication Module — Modular Interface
 * Hardware Sovereignty: Uses Web Authentication API (WebAuthn/FIDO2)
 * backed by Secure Keystore (TPM/Secure Enclave/TEE).
 * 
 * The physical fingerprint/face is the Root of Trust for vault access.
 * Falls back gracefully to Master Key when biometrics unavailable.
 */

const CREDENTIAL_STORAGE_KEY = "sirou_biometric_credential";
const RP_NAME = "Sirou Factory";
const RP_ID = typeof window !== "undefined" ? window.location.hostname : "localhost";

export interface BiometricCapability {
  available: boolean;
  platformAuthenticator: boolean;
  reason?: string;
}

export interface StoredCredential {
  credentialId: string;
  publicKey: string;
  createdAt: string;
  authenticatorType: string;
}

/**
 * Check if biometric authentication is available on this device
 */
export async function checkBiometricCapability(): Promise<BiometricCapability> {
  if (!window.PublicKeyCredential) {
    return { available: false, platformAuthenticator: false, reason: "WebAuthn not supported" };
  }

  try {
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return {
      available: true,
      platformAuthenticator: available,
      reason: available
        ? "Platform authenticator available (fingerprint/face)"
        : "Only roaming authenticators available (USB key)",
    };
  } catch {
    return { available: false, platformAuthenticator: false, reason: "WebAuthn check failed" };
  }
}

/**
 * Register a biometric credential (enroll fingerprint/face as Root of Trust)
 */
export async function registerBiometric(
  userId: string = "sirou-owner"
): Promise<{ success: boolean; credential?: StoredCredential; error?: string }> {
  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const userIdBytes = new TextEncoder().encode(userId);

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: RP_NAME, id: RP_ID },
        user: {
          id: userIdBytes,
          name: userId,
          displayName: "Sirou Factory Owner",
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" },   // ES256
          { alg: -257, type: "public-key" },  // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
          residentKey: "preferred",
        },
        timeout: 60000,
        attestation: "none",
      },
    })) as PublicKeyCredential | null;

    if (!credential) {
      return { success: false, error: "Registration cancelled" };
    }

    const response = credential.response as AuthenticatorAttestationResponse;
    const stored: StoredCredential = {
      credentialId: bufferToBase64(credential.rawId),
      publicKey: bufferToBase64(response.getPublicKey?.() || new ArrayBuffer(0)),
      createdAt: new Date().toISOString(),
      authenticatorType: "platform",
    };

    // Save credential reference (NOT the private key — that stays in Secure Enclave)
    localStorage.setItem(CREDENTIAL_STORAGE_KEY, JSON.stringify(stored));

    return { success: true, credential: stored };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Biometric registration failed",
    };
  }
}

/**
 * Authenticate using biometric (verify fingerprint/face)
 * Returns true if the physical biometric matches the enrolled credential
 */
export async function authenticateBiometric(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const storedRaw = localStorage.getItem(CREDENTIAL_STORAGE_KEY);
    if (!storedRaw) {
      return { success: false, error: "No biometric enrolled. Register first." };
    }

    const stored: StoredCredential = JSON.parse(storedRaw);
    const challenge = crypto.getRandomValues(new Uint8Array(32));

    const assertion = (await navigator.credentials.get({
      publicKey: {
        challenge,
        rpId: RP_ID,
        allowCredentials: [
          {
            id: base64ToBuffer(stored.credentialId),
            type: "public-key",
            transports: ["internal"],
          },
        ],
        userVerification: "required",
        timeout: 60000,
      },
    })) as PublicKeyCredential | null;

    if (!assertion) {
      return { success: false, error: "Authentication cancelled" };
    }

    // If we got here, the platform authenticator verified the user's biometric
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Biometric authentication failed",
    };
  }
}

/**
 * Check if biometrics are enrolled
 */
export function isBiometricEnrolled(): boolean {
  return !!localStorage.getItem(CREDENTIAL_STORAGE_KEY);
}

/**
 * Remove enrolled biometric
 */
export function removeBiometricEnrollment(): void {
  localStorage.removeItem(CREDENTIAL_STORAGE_KEY);
}

// ─── Helpers ───

function bufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
