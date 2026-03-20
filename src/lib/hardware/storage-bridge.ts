/**
 * High-Performance Storage Bridge
 * Unified API over IndexedDB (web) with Capacitor SQLite/Preferences fallback.
 * Designed for large datasets with fast key-value access.
 */

import { isNativeApp } from "@/lib/native-bridge";

const DB_NAME = "sirou_kv_store";
const DB_VERSION = 1;
const STORE_NAME = "kv";

// ─── IndexedDB KV Store (Web) ───────────────────────────────────────

function openKVDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbRequest<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ─── Public API ─────────────────────────────────────────────────────

/**
 * Set a value (supports any serializable data)
 */
export async function kvSet(key: string, value: unknown): Promise<void> {
  if (isNativeApp()) {
    // Try Capacitor Preferences plugin (fast KV store)
    try {
      const cap = (window as any).Capacitor?.Plugins?.Preferences;
      if (cap?.set) {
        await cap.set({ key, value: JSON.stringify(value) });
        return;
      }
    } catch { /* fallback to IndexedDB */ }
  }

  const db = await openKVDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  await idbRequest(tx.objectStore(STORE_NAME).put({ key, value, updated: Date.now() }));
  db.close();
}

/**
 * Get a value by key
 */
export async function kvGet<T = unknown>(key: string): Promise<T | null> {
  if (isNativeApp()) {
    try {
      const cap = (window as any).Capacitor?.Plugins?.Preferences;
      if (cap?.get) {
        const result = await cap.get({ key });
        return result?.value ? JSON.parse(result.value) : null;
      }
    } catch { /* fallback */ }
  }

  const db = await openKVDB();
  const tx = db.transaction(STORE_NAME, "readonly");
  const record = await idbRequest(tx.objectStore(STORE_NAME).get(key));
  db.close();
  return record?.value ?? null;
}

/**
 * Remove a key
 */
export async function kvRemove(key: string): Promise<void> {
  if (isNativeApp()) {
    try {
      const cap = (window as any).Capacitor?.Plugins?.Preferences;
      if (cap?.remove) {
        await cap.remove({ key });
        return;
      }
    } catch { /* fallback */ }
  }

  const db = await openKVDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  await idbRequest(tx.objectStore(STORE_NAME).delete(key));
  db.close();
}

/**
 * Get all keys
 */
export async function kvKeys(): Promise<string[]> {
  if (isNativeApp()) {
    try {
      const cap = (window as any).Capacitor?.Plugins?.Preferences;
      if (cap?.keys) {
        const result = await cap.keys();
        return result?.keys || [];
      }
    } catch { /* fallback */ }
  }

  const db = await openKVDB();
  const tx = db.transaction(STORE_NAME, "readonly");
  const all = await idbRequest(tx.objectStore(STORE_NAME).getAllKeys());
  db.close();
  return all.map(String);
}

/**
 * Clear all data
 */
export async function kvClear(): Promise<void> {
  if (isNativeApp()) {
    try {
      const cap = (window as any).Capacitor?.Plugins?.Preferences;
      if (cap?.clear) {
        await cap.clear();
        return;
      }
    } catch { /* fallback */ }
  }

  const db = await openKVDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  await idbRequest(tx.objectStore(STORE_NAME).clear());
  db.close();
}

/**
 * Batch set multiple key-value pairs (transactional)
 */
export async function kvBatchSet(entries: Array<{ key: string; value: unknown }>): Promise<void> {
  if (isNativeApp()) {
    // Capacitor Preferences doesn't support batch, do sequentially
    for (const entry of entries) {
      await kvSet(entry.key, entry.value);
    }
    return;
  }

  const db = await openKVDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  for (const entry of entries) {
    await idbRequest(store.put({ key: entry.key, value: entry.value, updated: Date.now() }));
  }
  db.close();
}

/**
 * Get storage size estimate
 */
export async function getStorageEstimate(): Promise<{
  usage: number;
  quota: number;
  percentage: number;
}> {
  if ("storage" in navigator && "estimate" in navigator.storage) {
    const est = await navigator.storage.estimate();
    const usage = est.usage || 0;
    const quota = est.quota || 0;
    return {
      usage,
      quota,
      percentage: quota > 0 ? Math.round((usage / quota) * 100) : 0,
    };
  }
  return { usage: 0, quota: 0, percentage: 0 };
}
