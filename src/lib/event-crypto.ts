/**
 * Event Encryption Layer
 * Wraps AES-256-GCM crypto for event payloads.
 * Abstracts key provider for future Android Keystore swap.
 */

import { encrypt, decrypt } from "@/lib/crypto";

/** Key provider interface — swappable for Android Keystore later */
export interface KeyProvider {
  getKey(): Promise<string | null>;
}

/** In-memory key provider (default) */
class MemoryKeyProvider implements KeyProvider {
  private key: string | null = null;

  setKey(k: string) { this.key = k; }
  clearKey() { this.key = null; }
  async getKey() { return this.key; }
}

const memoryProvider = new MemoryKeyProvider();
let activeProvider: KeyProvider = memoryProvider;

export const setEventKey = (key: string) => memoryProvider.setKey(key);
export const clearEventKey = () => memoryProvider.clearKey();
export const setKeyProvider = (p: KeyProvider) => { activeProvider = p; };

/** Fallback passphrase when no master key is set (for non-vault data) */
const FALLBACK_KEY = "sirou-event-default-key-v1";

async function resolveKey(): Promise<string> {
  const k = await activeProvider.getKey();
  return k || FALLBACK_KEY;
}

/** Encrypt an event payload object */
export async function encryptPayload(payload: unknown): Promise<string> {
  const key = await resolveKey();
  return encrypt(JSON.stringify(payload), key);
}

/** Decrypt an event payload string back to object */
export async function decryptPayload<T = unknown>(encrypted: string): Promise<T | null> {
  const key = await resolveKey();
  const json = await decrypt(encrypted, key);
  if (json === null) return null;
  try { return JSON.parse(json) as T; }
  catch { return null; }
}
