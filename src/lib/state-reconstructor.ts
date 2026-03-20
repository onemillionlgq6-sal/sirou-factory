/**
 * Deterministic State Reconstruction
 * Pure function: same events → same state, always.
 * Supports undo/redo via replaying event subsets.
 */

import { SirouEvent, EventType } from "@/lib/event-store";

export interface EntityState {
  [entityId: string]: Record<string, unknown>;
}

export interface ReconstructedState {
  [entityType: string]: EntityState;
}

/**
 * Reconstruct current state from an ordered event stream.
 * - Idempotent: duplicate event_ids are skipped.
 * - Priority rules: DELETE overrides UPDATE; CREATE must precede UPDATE.
 */
export function reconstructState(events: SirouEvent[]): ReconstructedState {
  const state: ReconstructedState = {};
  const seen = new Set<string>();
  const created = new Set<string>(); // "entityType:entityId"
  const deleted = new Set<string>();

  for (const evt of events) {
    // Skip duplicates
    if (seen.has(evt.event_id)) continue;
    seen.add(evt.event_id);

    const eType = evt.entity_type;
    const eId = evt.entity_id;
    if (!eType || !eId) continue;

    const compositeKey = `${eType}:${eId}`;

    switch (evt.event_type) {
      case EventType.ENTITY_CREATED: {
        if (deleted.has(compositeKey)) break; // re-create after delete is allowed
        if (!state[eType]) state[eType] = {};
        state[eType][eId] = { ...(evt.payload as Record<string, unknown>), id: eId };
        created.add(compositeKey);
        deleted.delete(compositeKey); // un-delete if re-created
        break;
      }

      case EventType.ENTITY_UPDATED: {
        // CREATE must exist before UPDATE
        if (!created.has(compositeKey)) break;
        // DELETE overrides UPDATE
        if (deleted.has(compositeKey)) break;
        if (state[eType]?.[eId]) {
          state[eType][eId] = {
            ...state[eType][eId],
            ...(evt.payload as Record<string, unknown>),
          };
        }
        break;
      }

      case EventType.ENTITY_DELETED: {
        deleted.add(compositeKey);
        if (state[eType]) {
          delete state[eType][eId];
        }
        break;
      }

      // USER_ACTION_LOGGED and unknown types don't affect entity state
      default:
        break;
    }
  }

  return state;
}

/**
 * Get a flat array of entities for a given type from reconstructed state.
 */
export function getEntities<T = Record<string, unknown>>(
  state: ReconstructedState,
  entityType: string
): T[] {
  const bucket = state[entityType];
  if (!bucket) return [];
  return Object.values(bucket) as T[];
}

/**
 * Replay events up to a specific index (for time-travel / undo).
 */
export function reconstructStateAt(events: SirouEvent[], upToIndex: number): ReconstructedState {
  return reconstructState(events.slice(0, upToIndex + 1));
}
