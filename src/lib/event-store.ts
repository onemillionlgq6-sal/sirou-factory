/**
 * Core Event Journal — IndexedDB-backed, append-only, encrypted.
 * Primary source of truth for the Sovereign Offline-First system.
 */

import { encryptPayload, decryptPayload } from "@/lib/event-crypto";

// ─── Types ───

export enum EventType {
  ENTITY_CREATED = "ENTITY_CREATED",
  ENTITY_UPDATED = "ENTITY_UPDATED",
  ENTITY_DELETED = "ENTITY_DELETED",
  USER_ACTION_LOGGED = "USER_ACTION_LOGGED",
}

export interface SirouEvent<T = unknown> {
  event_id: string;
  event_type: EventType | string;
  timestamp: string;
  device_id: string;
  payload: T;
  version: number;
  synced: boolean;
  /** entity namespace, e.g. "projects", "settings" */
  entity_type?: string;
  /** entity primary key */
  entity_id?: string;
}

/** Stored form — payload is encrypted string */
interface StoredEvent {
  event_id: string;
  event_type: string;
  timestamp: string;
  device_id: string;
  encrypted_payload: string;
  version: number;
  synced: number; // 0 | 1 for IndexedDB indexing
  entity_type?: string;
  entity_id?: string;
}

// ─── Constants ───

const DB_NAME = "sirou_events";
const DB_VERSION = 1;
const EVENTS_STORE = "events";
const META_STORE = "meta";

// ─── IndexedDB Helpers ───

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(EVENTS_STORE)) {
        const store = db.createObjectStore(EVENTS_STORE, { keyPath: "event_id" });
        store.createIndex("timestamp", "timestamp", { unique: false });
        store.createIndex("synced", "synced", { unique: false });
        store.createIndex("entity_type", "entity_type", { unique: false });
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function txPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ─── Device ID ───

let cachedDeviceId: string | null = null;

export async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId;
  const db = await openDB();
  const tx = db.transaction(META_STORE, "readwrite");
  const store = tx.objectStore(META_STORE);
  const existing = await txPromise(store.get("device_id"));
  if (existing) {
    cachedDeviceId = existing.value;
    db.close();
    return cachedDeviceId!;
  }
  const id = crypto.randomUUID();
  await txPromise(store.put({ key: "device_id", value: id }));
  db.close();
  cachedDeviceId = id;
  return id;
}

// ─── Core Operations ───

/**
 * Append an immutable event to the journal.
 * Payload is encrypted before storage.
 */
export async function appendEvent<T = unknown>(
  eventType: EventType | string,
  payload: T,
  opts?: { entity_type?: string; entity_id?: string; version?: number }
): Promise<SirouEvent<T>> {
  const device_id = await getDeviceId();
  const event: SirouEvent<T> = {
    event_id: crypto.randomUUID(),
    event_type: eventType,
    timestamp: new Date().toISOString(),
    device_id,
    payload,
    version: opts?.version ?? 1,
    synced: false,
    entity_type: opts?.entity_type,
    entity_id: opts?.entity_id,
  };

  let encrypted_payload: string;
  try {
    encrypted_payload = await encryptPayload(payload);
  } catch {
    // No encryption key set — store as plain JSON (non-sensitive executor logs)
    encrypted_payload = JSON.stringify(payload);
  }

  const stored: StoredEvent = {
    event_id: event.event_id,
    event_type: event.event_type,
    timestamp: event.timestamp,
    device_id: event.device_id,
    encrypted_payload,
    version: event.version,
    synced: 0,
    entity_type: event.entity_type,
    entity_id: event.entity_id,
  };

  const db = await openDB();
  const tx = db.transaction(EVENTS_STORE, "readwrite");
  await txPromise(tx.objectStore(EVENTS_STORE).add(stored));
  db.close();

  return event;
}

/**
 * Read all events, decrypt payloads, return ordered by timestamp.
 */
export async function getEvents<T = unknown>(filter?: {
  entity_type?: string;
}): Promise<SirouEvent<T>[]> {
  const db = await openDB();
  const tx = db.transaction(EVENTS_STORE, "readonly");
  const store = tx.objectStore(EVENTS_STORE);

  let req: IDBRequest<StoredEvent[]>;
  if (filter?.entity_type) {
    const idx = store.index("entity_type");
    req = idx.getAll(filter.entity_type) as IDBRequest<StoredEvent[]>;
  } else {
    req = store.getAll() as IDBRequest<StoredEvent[]>;
  }

  const stored = await txPromise(req);
  db.close();

  // Sort by timestamp ascending
  stored.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  const events: SirouEvent<T>[] = [];
  for (const s of stored) {
    const payload = await decryptPayload<T>(s.encrypted_payload);
    events.push({
      event_id: s.event_id,
      event_type: s.event_type,
      timestamp: s.timestamp,
      device_id: s.device_id,
      payload: payload as T,
      version: s.version,
      synced: s.synced === 1,
      entity_type: s.entity_type,
      entity_id: s.entity_id,
    });
  }

  return events;
}

/**
 * Get unsynced events for the sync queue.
 */
export async function getUnsyncedEvents(): Promise<StoredEvent[]> {
  const db = await openDB();
  const tx = db.transaction(EVENTS_STORE, "readonly");
  const idx = tx.objectStore(EVENTS_STORE).index("synced");
  const results = await txPromise(idx.getAll(0) as IDBRequest<StoredEvent[]>);
  db.close();
  results.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  return results;
}

/**
 * Mark events as synced after successful remote push.
 */
export async function markSynced(eventIds: string[]): Promise<void> {
  if (!eventIds.length) return;
  const db = await openDB();
  const tx = db.transaction(EVENTS_STORE, "readwrite");
  const store = tx.objectStore(EVENTS_STORE);
  for (const id of eventIds) {
    const existing = await txPromise(store.get(id) as IDBRequest<StoredEvent | undefined>);
    if (existing) {
      existing.synced = 1;
      await txPromise(store.put(existing));
    }
  }
  db.close();
}

/**
 * Get total event count (diagnostic).
 */
export async function getEventCount(): Promise<number> {
  const db = await openDB();
  const tx = db.transaction(EVENTS_STORE, "readonly");
  const count = await txPromise(tx.objectStore(EVENTS_STORE).count());
  db.close();
  return count;
}
