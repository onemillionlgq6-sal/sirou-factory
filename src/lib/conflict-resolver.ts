/**
 * Multi-Device Conflict Resolver
 * Deterministic merge of local + remote event streams.
 */

import { SirouEvent, EventType } from "@/lib/event-store";

/**
 * Merge two event streams deterministically.
 * - Deduplicate by event_id
 * - DELETE overrides UPDATE for same entity
 * - CREATE must exist before UPDATE (orphaned UPDATEs dropped)
 * - Ties broken by timestamp, then device_id lexicographic order
 */
export function resolveConflicts(
  localEvents: SirouEvent[],
  remoteEvents: SirouEvent[]
): SirouEvent[] {
  // 1. Deduplicate
  const map = new Map<string, SirouEvent>();
  for (const e of localEvents) map.set(e.event_id, e);
  for (const e of remoteEvents) {
    if (!map.has(e.event_id)) map.set(e.event_id, e);
  }

  // 2. Sort deterministically: timestamp ASC, then device_id ASC
  const merged = Array.from(map.values()).sort((a, b) => {
    const tc = a.timestamp.localeCompare(b.timestamp);
    if (tc !== 0) return tc;
    return a.device_id.localeCompare(b.device_id);
  });

  // 3. Apply priority rules — filter invalid sequences
  const created = new Set<string>();
  const deleted = new Set<string>();
  const valid: SirouEvent[] = [];

  for (const evt of merged) {
    const key = evt.entity_type && evt.entity_id
      ? `${evt.entity_type}:${evt.entity_id}`
      : null;

    switch (evt.event_type) {
      case EventType.ENTITY_CREATED:
        if (key) {
          created.add(key);
          deleted.delete(key);
        }
        valid.push(evt);
        break;

      case EventType.ENTITY_UPDATED:
        if (!key || !created.has(key) || deleted.has(key)) break; // orphaned or post-delete
        valid.push(evt);
        break;

      case EventType.ENTITY_DELETED:
        if (key) deleted.add(key);
        valid.push(evt);
        break;

      default:
        valid.push(evt); // USER_ACTION_LOGGED etc.
        break;
    }
  }

  return valid;
}
