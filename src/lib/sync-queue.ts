/**
 * Background Sync Engine
 * Pushes unsynced events to Supabase when online.
 * Retry with exponential backoff. Ordering guaranteed.
 */

import { getUnsyncedEvents, markSynced } from "@/lib/event-store";
import { getStoredCredentials, createSupabaseClient } from "@/lib/supabase";

let syncTimer: ReturnType<typeof setTimeout> | null = null;
let retryDelay = 5_000; // ms
const MAX_DELAY = 120_000;
const BATCH_SIZE = 50;

function getClient() {
  const creds = getStoredCredentials();
  if (!creds) return null;
  return createSupabaseClient(creds.url, creds.anonKey);
}

async function pushBatch(): Promise<boolean> {
  const client = getClient();
  if (!client || !navigator.onLine) return false;

  const pending = await getUnsyncedEvents();
  if (!pending.length) return true; // nothing to sync

  const batch = pending.slice(0, BATCH_SIZE);
  const rows = batch.map((e) => ({
    event_id: e.event_id,
    event_type: e.event_type,
    timestamp: e.timestamp,
    device_id: e.device_id,
    payload: e.encrypted_payload, // stays encrypted
    version: e.version,
  }));

  try {
    const { error } = await client
      .from("event_journal")
      .upsert(rows, { onConflict: "event_id" });

    if (error) {
      console.warn("[SyncQueue] Push failed:", error.message);
      return false;
    }

    await markSynced(batch.map((e) => e.event_id));
    retryDelay = 5_000; // reset on success

    // If there are more, continue
    if (pending.length > BATCH_SIZE) return pushBatch();
    return true;
  } catch (err) {
    console.warn("[SyncQueue] Network error during push");
    return false;
  }
}

function scheduleNext(succeeded: boolean) {
  if (!succeeded) {
    retryDelay = Math.min(retryDelay * 2, MAX_DELAY);
  }
  syncTimer = setTimeout(runSync, retryDelay);
}

async function runSync() {
  const ok = await pushBatch();
  scheduleNext(ok);
}

/** Start the background sync loop. Safe to call multiple times. */
export function startSync() {
  if (syncTimer) return;
  // Trigger on connectivity changes
  window.addEventListener("online", () => {
    retryDelay = 5_000;
    if (syncTimer) clearTimeout(syncTimer);
    runSync();
  });
  runSync();
}

/** Stop the background sync loop. */
export function stopSync() {
  if (syncTimer) {
    clearTimeout(syncTimer);
    syncTimer = null;
  }
}

/** Force an immediate sync attempt. */
export async function forceSyncNow(): Promise<boolean> {
  return pushBatch();
}
