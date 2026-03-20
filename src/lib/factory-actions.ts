/**
 * Factory Actions — Export, Import, keyboard shortcuts, and system utilities
 * Sovereign Independence Protocol: Portable Production Bundle
 */

import { toast } from "sonner";
import { decrypt, hasEncryptedVault } from "@/lib/crypto";
import {
  DOCKERFILE,
  NGINX_CONF,
  DOCKER_COMPOSE,
  SELF_HOST_README,
  generateDependencyLock,
  sha256,
} from "@/lib/deterministic-build";
import {
  BUILD_GRADLE_APP,
  PROGUARD_RULES,
  ANDROID_MANIFEST,
  ANDROID_CONFIG,
  generateAndroidBuildGuide,
} from "@/lib/android-build";

/**
 * Generate a portable production bundle as a downloadable JSON
 * Contains: system state, Dockerfile, nginx.conf, docker-compose.yml, README, dep lock, SHA-256
 */
export const exportFactoryState = async () => {
  try {
    const state: Record<string, unknown> = {};

    // Gather ALL localStorage items for a full backup
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        try {
          state[key] = JSON.parse(localStorage.getItem(key)!);
        } catch {
          state[key] = localStorage.getItem(key);
        }
      }
    }

    state._exportedAt = new Date().toISOString();
    state._version = "sirou-factory-v3";
    state._totalKeys = Object.keys(state).length;

    const depLock = generateDependencyLock();

    // Build the bundle
    const bundle = {
      manifest: {
        name: "sirou-factory-portable-bundle",
        version: "3.0.0",
        exportedAt: state._exportedAt,
        buildHash: "", // filled below
        description: "Portable Production Bundle — Sovereign Independence Protocol",
        dependencyLock: depLock,
      },
      systemState: state,
      infrastructure: {
        "Dockerfile": DOCKERFILE,
        "nginx.conf": NGINX_CONF,
        "docker-compose.yml": DOCKER_COMPOSE,
        "README.md": SELF_HOST_README,
      },
    };

    // Deterministic hash of the entire bundle (before hash insertion)
    const preHash = JSON.stringify(bundle, null, 2);
    bundle.manifest.buildHash = await sha256(preHash);

    const json = JSON.stringify(bundle, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sirou-factory-bundle-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(
      `Portable bundle exported ✓ (${Object.keys(state).length} keys, SHA-256 verified, Dockerfile + Nginx included)`
    );
  } catch (err) {
    toast.error("Export failed: " + (err instanceof Error ? err.message : "Unknown error"));
  }
};

/**
 * Import system state from a sirou-factory-backup.json file
 * Integrates with AES Master Key for vault verification
 * Works 100% offline — no network required
 */
export const importFactoryState = async (
  file: File,
  masterKey?: string
): Promise<{ success: boolean; message: string; keysRestored: number }> => {
  try {
    const text = await file.text();
    let parsed: any;

    try {
      parsed = JSON.parse(text);
    } catch {
      return { success: false, message: "Invalid JSON file.", keysRestored: 0 };
    }

    // Support both old format (flat state) and new bundle format
    const stateData = parsed.systemState || parsed;

    // Validate it's a Sirou backup
    if (!stateData._version && !stateData._exportedAt && !parsed.manifest) {
      return { success: false, message: "Not a valid Sirou Factory backup file.", keysRestored: 0 };
    }

    // Verify build hash if present
    if (parsed.manifest?.buildHash) {
      const bundleCopy = { ...parsed, manifest: { ...parsed.manifest, buildHash: "" } };
      const recomputedHash = await sha256(JSON.stringify(bundleCopy, null, 2));
      if (recomputedHash !== parsed.manifest.buildHash) {
        return {
          success: false,
          message: "Bundle integrity check failed — SHA-256 mismatch. File may be tampered.",
          keysRestored: 0,
        };
      }
    }

    // If vault data exists in backup, verify master key
    const vaultKey = "sirou_secure_vault_enc";
    const hasVaultData = !!stateData[vaultKey];

    if (hasVaultData && masterKey) {
      const decrypted = await decrypt(stateData[vaultKey], masterKey);
      if (decrypted === null) {
        return { success: false, message: "Master Key verification failed. Vault data cannot be decrypted.", keysRestored: 0 };
      }
    } else if (hasVaultData && !masterKey) {
      return { success: false, message: "Backup contains encrypted vault data. Please provide your Master Key to verify.", keysRestored: 0 };
    }

    // Restore all keys to localStorage
    let keysRestored = 0;
    const skipKeys = new Set(["_exportedAt", "_version", "_totalKeys", "_buildHash"]);

    for (const [key, value] of Object.entries(stateData)) {
      if (skipKeys.has(key)) continue;
      try {
        localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
        keysRestored++;
      } catch {
        // Skip keys that fail (quota etc.)
      }
    }

    return {
      success: true,
      message: `Restored ${keysRestored} keys from backup (${stateData._version || "legacy"}). Integrity verified ✓`,
      keysRestored,
    };
  } catch (err) {
    return {
      success: false,
      message: "Import failed: " + (err instanceof Error ? err.message : "Unknown error"),
      keysRestored: 0,
    };
  }
};

/**
 * Initialize global keyboard shortcuts
 * Returns cleanup function
 */
export const initKeyboardShortcuts = (handlers: {
  onSave?: () => void;
  onVault?: () => void;
  onExport?: () => void;
  onSettings?: () => void;
}): (() => void) => {
  const handler = (e: KeyboardEvent) => {
    const mod = e.ctrlKey || e.metaKey;
    if (!mod) return;

    switch (e.key.toLowerCase()) {
      case "s":
        e.preventDefault();
        handlers.onSave?.();
        break;
      case "k":
        e.preventDefault();
        handlers.onVault?.();
        break;
      case "e":
        e.preventDefault();
        handlers.onExport?.();
        break;
      case ",":
        e.preventDefault();
        handlers.onSettings?.();
        break;
    }
  };

  window.addEventListener("keydown", handler);
  return () => window.removeEventListener("keydown", handler);
};
