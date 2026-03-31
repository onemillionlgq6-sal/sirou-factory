/**
 * History Manager — نظام Undo/Redo كامل لـ Sirou Factory
 * يحفظ لقطات (snapshots) لكل تعديل مع دعم التراجع والإعادة والتاريخ الكامل.
 * التخزين: IndexedDB محلياً + Supabase اختياري للمزامنة.
 */

export interface HistoryEntry {
  id: string;
  timestamp: string;
  description: string;
  type: "ai_execution" | "file_create" | "file_edit" | "file_delete" | "settings_change" | "manual";
  snapshot: Record<string, string>; // نسخة كاملة من الملفات
  metadata?: Record<string, unknown>;
}

// ─── مخزن التاريخ ───

const DB_NAME = "sirou_history";
const STORE_NAME = "entries";
const DB_VERSION = 1;
const MAX_ENTRIES = 100;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("timestamp", "timestamp", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ─── CRUD للتاريخ المحلي ───

export async function saveEntry(entry: HistoryEntry): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  tx.objectStore(STORE_NAME).put(entry);
  await new Promise<void>((res, rej) => {
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  // تنظيف القديم
  await trimEntries();
}

export async function getAllEntries(): Promise<HistoryEntry[]> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);
  const idx = store.index("timestamp");
  return new Promise((resolve, reject) => {
    const req = idx.getAll();
    req.onsuccess = () => resolve((req.result as HistoryEntry[]).reverse());
    req.onerror = () => reject(req.error);
  });
}

export async function clearHistory(): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  tx.objectStore(STORE_NAME).clear();
  await new Promise<void>((res, rej) => {
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

async function trimEntries(): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  const idx = store.index("timestamp");
  const countReq = store.count();
  await new Promise<void>((res) => {
    countReq.onsuccess = () => {
      const count = countReq.result;
      if (count <= MAX_ENTRIES) { res(); return; }
      const toDelete = count - MAX_ENTRIES;
      const cursorReq = idx.openCursor();
      let deleted = 0;
      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if (cursor && deleted < toDelete) {
          store.delete(cursor.primaryKey);
          deleted++;
          cursor.continue();
        } else {
          res();
        }
      };
    };
  });
}

// ─── Undo/Redo Stack (in-memory, backed by IndexedDB) ───

let undoStack: HistoryEntry[] = [];
let redoStack: HistoryEntry[] = [];
let currentSnapshot: Record<string, string> = {};

export function getCurrentSnapshot(): Record<string, string> {
  return { ...currentSnapshot };
}

export function setCurrentSnapshot(files: Record<string, string>): void {
  currentSnapshot = { ...files };
}

export function pushSnapshot(
  description: string,
  type: HistoryEntry["type"],
  files: Record<string, string>,
  metadata?: Record<string, unknown>,
): HistoryEntry {
  // حفظ الحالة الحالية في undoStack
  const entry: HistoryEntry = {
    id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    description,
    type,
    snapshot: { ...currentSnapshot },
    metadata,
  };
  undoStack.push(entry);
  if (undoStack.length > MAX_ENTRIES) undoStack.shift();
  
  // مسح redo عند push جديد
  redoStack = [];
  
  // تحديث الحالة الحالية
  currentSnapshot = { ...files };
  
  // حفظ في IndexedDB (غير حاجب)
  saveEntry(entry).catch(console.error);
  
  return entry;
}

export function undo(): { entry: HistoryEntry; restoredFiles: Record<string, string> } | null {
  if (undoStack.length === 0) return null;
  
  const entry = undoStack.pop()!;
  
  // حفظ الحالة الحالية في redo
  redoStack.push({
    id: `redo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    description: "Redo point",
    type: "manual",
    snapshot: { ...currentSnapshot },
  });
  
  // استعادة اللقطة السابقة
  currentSnapshot = { ...entry.snapshot };
  
  return { entry, restoredFiles: { ...currentSnapshot } };
}

export function redo(): { restoredFiles: Record<string, string> } | null {
  if (redoStack.length === 0) return null;
  
  const redoEntry = redoStack.pop()!;
  
  // حفظ الحالة الحالية في undo
  undoStack.push({
    id: `undo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    description: "Undo point",
    type: "manual",
    snapshot: { ...currentSnapshot },
  });
  
  currentSnapshot = { ...redoEntry.snapshot };
  
  return { restoredFiles: { ...currentSnapshot } };
}

export function canUndo(): boolean {
  return undoStack.length > 0;
}

export function canRedo(): boolean {
  return redoStack.length > 0;
}

export function getUndoCount(): number {
  return undoStack.length;
}

export function getRedoCount(): number {
  return redoStack.length;
}

// ─── مزامنة مع Supabase (اختياري) ───

export async function syncHistoryToSupabase(): Promise<boolean> {
  try {
    const { getClient } = await import("./supabase-sync");
    const client = getClient();
    if (!client) return false;

    const entries = await getAllEntries();
    if (entries.length === 0) return true;

    // حفظ آخر 20 لقطة فقط (لتوفير المساحة)
    const recent = entries.slice(0, 20);
    for (const entry of recent) {
      await client.from("history").upsert({
        id: entry.id,
        timestamp: entry.timestamp,
        description: entry.description,
        type: entry.type,
        snapshot: entry.snapshot,
        metadata: entry.metadata || {},
      }, { onConflict: "id" });
    }
    return true;
  } catch {
    return false;
  }
}

export async function loadHistoryFromSupabase(): Promise<HistoryEntry[]> {
  try {
    const { getClient } = await import("./supabase-sync");
    const client = getClient();
    if (!client) return [];

    const { data, error } = await client
      .from("history")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(50);
    
    if (error || !data) return [];
    return data as HistoryEntry[];
  } catch {
    return [];
  }
}
