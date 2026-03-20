

# Step 1 — Sovereign Offline-First Event-Driven Data Architecture

## Overview

Replace the current localStorage-based `db-bridge.ts` with a complete event-sourced system using IndexedDB as the primary store. All state changes become immutable, encrypted, append-only events. Supabase becomes a sync/backup layer only.

## Architecture

```text
User Action
    ↓
Event Created (UUID, type, timestamp, device_id, payload, version)
    ↓
Encrypted with AES-256 → Stored in IndexedDB (append-only journal)
    ↓
State Reconstruction (deterministic reducer over events)
    ↓
Background Sync Queue → Supabase (when online, retry on failure)
```

## Files to Create/Modify

### 1. `src/lib/event-store.ts` — Core Event Journal (NEW)

- **Event interface**: `event_id`, `event_type`, `timestamp`, `device_id`, `payload`, `version`, `synced` flag
- **IndexedDB wrapper**: Open/create `sirou_events` database with `events` and `sync_queue` object stores
- **`appendEvent()`**: Creates event, encrypts payload with AES (reusing `src/lib/crypto.ts`), stores in IndexedDB. Never edits or deletes existing events.
- **`getEvents()`**: Read all events, decrypt payloads, return ordered list
- **`getDeviceId()`**: Generate and persist a stable device identifier in IndexedDB
- **Event types enum**: `ENTITY_CREATED`, `ENTITY_UPDATED`, `ENTITY_DELETED`, `USER_ACTION_LOGGED`

### 2. `src/lib/state-reconstructor.ts` — Deterministic State Builder (NEW)

- **`reconstructState(events)`**: Pure function — takes ordered events array, returns current state object
- **Event priority rules**: DELETE overrides UPDATE; CREATE must precede UPDATE; invalid sequences silently skipped
- **Idempotent processing**: Tracks seen `event_id`s, skips duplicates
- **Returns** a typed state map keyed by entity type and entity ID
- Enables undo (replay N-1 events), redo, and time-travel debugging by replaying subsets

### 3. `src/lib/sync-queue.ts` — Background Sync Engine (NEW)

- **Queue management**: Pending events stored in IndexedDB `sync_queue` store
- **`startSync()`**: Periodically checks `navigator.onLine`, batches unsynced events, pushes to Supabase `event_journal` table via existing `createSupabaseClient`
- **Retry with backoff**: Failed events stay in queue, retried with exponential backoff
- **Ordering guarantees**: Events sent in timestamp order
- **`onSyncComplete` callback**: Marks events as `synced: true` in local store
- **Listens** to `online`/`offline` browser events for automatic trigger

### 4. `src/lib/conflict-resolver.ts` — Multi-Device Reconciler (NEW)

- **`resolveConflicts(localEvents, remoteEvents)`**: Merges two event streams deterministically
- **Resolution rules**:
  - Deduplicate by `event_id`
  - DELETE overrides UPDATE for same entity
  - CREATE must exist before UPDATE (orphaned UPDATEs dropped)
  - Ties broken by timestamp, then device_id lexicographic order
- **Returns** merged, ordered, deduplicated event stream

### 5. `src/lib/event-crypto.ts` — Event Encryption Layer (NEW)

- Wraps `src/lib/crypto.ts` encrypt/decrypt for event payloads specifically
- **`encryptPayload(payload, masterKey)`** / **`decryptPayload(encrypted, masterKey)`**
- Key derivation abstraction prepared for future Android Keystore integration (interface-based, swappable provider)
- Falls back to in-memory key if no master key set (for non-vault data)

### 6. `src/lib/db-bridge.ts` — Refactor to Event-Sourced (MODIFY)

- `dbInsert` → creates `ENTITY_CREATED` event via `appendEvent`
- `dbSelect` → calls `reconstructState` then filters
- `dbDelete` → creates `ENTITY_DELETED` event
- Maintains the same public API so existing consumers (`health-monitor.ts`, etc.) don't break
- Local fallback logic replaced by IndexedDB event journal (localStorage no longer primary)

### 7. `src/lib/health-monitor.ts` — Use Event Store (MODIFY)

- `persistToSupabase` replaced with `appendEvent` of type `USER_ACTION_LOGGED`
- Error entries become events in the journal, synced to Supabase when online

## Technical Constraints

- **Zero network dependency**: All operations write to IndexedDB first. Sync is background-only.
- **Determinism**: `reconstructState` is a pure function — same events always produce same state.
- **Crash resilience**: IndexedDB transactions are atomic. Incomplete writes don't corrupt the journal.
- **No mutable state stored**: Only the event journal exists. State is always derived.
- **Encryption**: All event payloads encrypted at rest using existing AES-256-GCM from `crypto.ts`.
- **No new npm dependencies**: Uses native IndexedDB API, existing Web Crypto, existing Supabase client.

## Supabase Schema (for sync target)

```sql
CREATE TABLE public.event_journal (
  event_id UUID PRIMARY KEY,
  event_type TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  device_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  user_id UUID REFERENCES auth.users(id) NOT NULL DEFAULT auth.uid()
);

ALTER TABLE public.event_journal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their events"
  ON public.event_journal FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_event_journal_timestamp ON public.event_journal(timestamp);
CREATE INDEX idx_event_journal_device ON public.event_journal(device_id);
```

