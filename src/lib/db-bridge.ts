/**
 * Universal Database Bridge — Event-Sourced, Offline-First
 *
 * Public API is unchanged (dbSelect, dbInsert, dbDelete) so existing
 * consumers keep working. Under the hood all mutations are now
 * append-only events in IndexedDB, with optional Supabase sync.
 */

import { appendEvent, getEvents, EventType } from "@/lib/event-store";
import { reconstructState, getEntities } from "@/lib/state-reconstructor";

export interface DBRecord {
  id: string;
  [key: string]: unknown;
}

export interface QueryResult<T = DBRecord> {
  data: T[] | null;
  error: string | null;
  source: "local";
}

export interface InsertResult<T = DBRecord> {
  data: T | null;
  error: string | null;
  source: "local";
}

/**
 * SELECT — Reconstruct state from event journal then filter.
 */
export async function dbSelect<T = DBRecord>(
  table: string,
  options?: {
    column?: string;
    value?: unknown;
    orderBy?: string;
    ascending?: boolean;
    limit?: number;
  }
): Promise<QueryResult<T>> {
  try {
    const events = await getEvents({ entity_type: table });
    const allEvents = await getEvents(); // full stream for cross-entity integrity
    const state = reconstructState(allEvents);
    let rows = getEntities<T>(state, table);

    if (options?.column && options?.value !== undefined) {
      rows = rows.filter((r: any) => r[options.column!] === options.value);
    }

    if (options?.orderBy) {
      const asc = options.ascending ?? false;
      rows.sort((a: any, b: any) => {
        const av = a[options.orderBy!];
        const bv = b[options.orderBy!];
        if (av < bv) return asc ? -1 : 1;
        if (av > bv) return asc ? 1 : -1;
        return 0;
      });
    }

    if (options?.limit) {
      rows = rows.slice(0, options.limit);
    }

    return { data: rows, error: null, source: "local" };
  } catch (err) {
    return { data: [], error: (err as Error).message, source: "local" };
  }
}

/**
 * INSERT — Append an ENTITY_CREATED event.
 */
export async function dbInsert<T = DBRecord>(
  table: string,
  record: Partial<T> & { id?: string }
): Promise<InsertResult<T>> {
  const id = record.id || crypto.randomUUID();
  const payload = {
    ...record,
    id,
    created_at: (record as any).created_at || new Date().toISOString(),
  };

  try {
    await appendEvent(EventType.ENTITY_CREATED, payload, {
      entity_type: table,
      entity_id: id,
    });
    return { data: payload as T, error: null, source: "local" };
  } catch (err) {
    return { data: null, error: (err as Error).message, source: "local" };
  }
}

/**
 * DELETE — Append an ENTITY_DELETED event.
 */
export async function dbDelete(
  table: string,
  id: string
): Promise<{ error: string | null; source: "local" }> {
  try {
    await appendEvent(EventType.ENTITY_DELETED, { id }, {
      entity_type: table,
      entity_id: id,
    });
    return { error: null, source: "local" };
  } catch (err) {
    return { error: (err as Error).message, source: "local" };
  }
}

/**
 * Get sync status — diagnostic info.
 */
export async function getDbSyncStatus(): Promise<{
  isEventSourced: true;
  totalEvents: number;
}> {
  const events = await getEvents();
  return { isEventSourced: true, totalEvents: events.length };
}
