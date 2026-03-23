/**
 * Contextual Memory + Undo/Redo
 * Tracks all file changes, supports time-travel, connects to AI context.
 */

import { appendEvent, getEvents, EventType } from "@/lib/event-store";

// ─── Types ───

export interface ChangeRecord {
  id: string;
  timestamp: string;
  action: string;
  path: string;
  before: string | null;
  after: string | null;
  metadata?: Record<string, unknown>;
}

// ─── In-Memory Undo/Redo Stack ───

let undoStack: ChangeRecord[] = [];
let redoStack: ChangeRecord[] = [];

const MAX_UNDO_HISTORY = 100;

// ─── Record a Change ───

export async function recordChange(
  action: string,
  path: string,
  before: string | null,
  after: string | null,
  metadata?: Record<string, unknown>,
): Promise<ChangeRecord> {
  const record: ChangeRecord = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    action,
    path,
    before,
    after,
    metadata,
  };

  undoStack.push(record);
  if (undoStack.length > MAX_UNDO_HISTORY) {
    undoStack.shift();
  }
  // Clear redo on new action
  redoStack = [];

  // Persist to event journal
  await appendEvent(EventType.USER_ACTION_LOGGED, record, {
    entity_type: "change_history",
    entity_id: record.id,
  });

  return record;
}

// ─── Undo ───

export function undo(): ChangeRecord | null {
  const record = undoStack.pop();
  if (!record) return null;
  redoStack.push(record);
  return record;
}

// ─── Redo ───

export function redo(): ChangeRecord | null {
  const record = redoStack.pop();
  if (!record) return null;
  undoStack.push(record);
  return record;
}

// ─── Get History ───

export function getUndoStack(): readonly ChangeRecord[] {
  return undoStack;
}

export function getRedoStack(): readonly ChangeRecord[] {
  return redoStack;
}

export function canUndo(): boolean {
  return undoStack.length > 0;
}

export function canRedo(): boolean {
  return redoStack.length > 0;
}

// ─── Build AI Context Window ───

export function buildContextForAI(maxEntries = 20): string {
  const recent = undoStack.slice(-maxEntries);
  if (recent.length === 0) return "لا توجد تعديلات حديثة.";

  return recent.map(r =>
    `[${r.timestamp}] ${r.action}: ${r.path}${r.metadata ? ` (${JSON.stringify(r.metadata)})` : ""}`
  ).join("\n");
}

// ─── Load History from Event Journal ───

export async function loadHistoryFromJournal(): Promise<ChangeRecord[]> {
  const events = await getEvents<ChangeRecord>({ entity_type: "change_history" });
  const records = events.map(e => e.payload);
  undoStack = records.slice(-MAX_UNDO_HISTORY);
  return records;
}

// ─── Clear History ───

export function clearHistory(): void {
  undoStack = [];
  redoStack = [];
}
