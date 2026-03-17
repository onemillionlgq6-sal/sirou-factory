/**
 * AES-256-GCM Encryption/Decryption using Web Crypto API
 * Used by SecureVault to encrypt sensitive data at rest.
 */

const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const ITERATIONS = 100_000;

/** Derive an AES-256-GCM key from a master password */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password) as BufferSource,
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations: ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/** Encrypt plaintext with a master password. Returns base64 string (salt + iv + ciphertext). */
export async function encrypt(plaintext: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(password, salt);
  const enc = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(plaintext)
  );
  // Concatenate salt + iv + ciphertext
  const result = new Uint8Array(salt.length + iv.length + new Uint8Array(ciphertext).length);
  result.set(salt, 0);
  result.set(iv, salt.length);
  result.set(new Uint8Array(ciphertext), salt.length + iv.length);
  return btoa(String.fromCharCode(...result));
}

/** Decrypt a base64 encrypted string with the master password. Returns plaintext or null on failure. */
export async function decrypt(encryptedBase64: string, password: string): Promise<string | null> {
  try {
    const raw = Uint8Array.from(atob(encryptedBase64), (c) => c.charCodeAt(0));
    const salt = raw.slice(0, SALT_LENGTH);
    const iv = raw.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const ciphertext = raw.slice(SALT_LENGTH + IV_LENGTH);
    const key = await deriveKey(password, salt);
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    return null;
  }
}

/** Quick check if there's encrypted vault data stored */
export function hasEncryptedVault(): boolean {
  return !!localStorage.getItem("sirou_secure_vault_enc");
}
