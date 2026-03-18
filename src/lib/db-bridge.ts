/**
 * Universal Database Bridge — Offline-First with Optional Sync
 * 
 * Modular interface: swap Supabase URL/Key in settings to point
 * to a local PostgreSQL instance without rewriting core logic.
 * Falls back to localStorage when no backend is connected.
 */

import { getStoredCredentials, createSupabaseClient } from "@/lib/supabase";

export interface DBRecord {
  id: string;
  [key: string]: unknown;
}

export interface QueryResult<T = DBRecord> {
  data: T[] | null;
  error: string | null;
  source: "remote" | "local";
}

export interface InsertResult<T = DBRecord> {
  data: T | null;
  error: string | null;
  source: "remote" | "local";
}

const LOCAL_PREFIX = "sirou_db_";

/**
 * Get the local cache key for a table
 */
function localKey(table: string): string {
  return `${LOCAL_PREFIX}${table}`;
}

/**
 * Read from local cache
 */
function readLocal<T = DBRecord>(table: string): T[] {
  try {
    const raw = localStorage.getItem(localKey(table));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Write to local cache
 */
function writeLocal<T = DBRecord>(table: string, data: T[]): void {
  try {
    localStorage.setItem(localKey(table), JSON.stringify(data));
  } catch {
    // Quota exceeded — silently fail
  }
}

/**
 * Check if remote backend is available
 */
function getRemoteClient() {
  const creds = getStoredCredentials();
  if (!creds) return null;
  return createSupabaseClient(creds.url, creds.anonKey);
}

/**
 * SELECT — Query records from a table
 * Tries remote first, falls back to local cache
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
  const client = getRemoteClient();

  if (client) {
    try {
      let query = client.from(table).select("*");
      if (options?.column && options?.value !== undefined) {
        query = query.eq(options.column, options.value);
      }
      if (options?.orderBy) {
        query = query.order(options.orderBy, { ascending: options?.ascending ?? false });
      }
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (!error && data) {
        // Sync to local cache for offline access
        writeLocal(table, data);
        return { data: data as T[], error: null, source: "remote" };
      }

      // Remote failed — fall through to local
      if (error) {
        console.warn(`[DB Bridge] Remote query failed for ${table}:`, error.message);
      }
    } catch (err) {
      console.warn(`[DB Bridge] Remote unreachable for ${table}, using local cache`);
    }
  }

  // Offline fallback
  let localData = readLocal<T>(table);

  if (options?.column && options?.value !== undefined) {
    localData = localData.filter(
      (r: any) => r[options.column!] === options.value
    );
  }

  if (options?.limit) {
    localData = localData.slice(0, options.limit);
  }

  return { data: localData, error: null, source: "local" };
}

/**
 * INSERT — Add a record to a table
 * Writes to remote if available, always writes to local cache
 */
export async function dbInsert<T = DBRecord>(
  table: string,
  record: Partial<T> & { id?: string }
): Promise<InsertResult<T>> {
  const withId = {
    ...record,
    id: record.id || crypto.randomUUID(),
    created_at: (record as any).created_at || new Date().toISOString(),
  } as T;

  // Always write to local first (offline-first)
  const local = readLocal<T>(table);
  local.unshift(withId);
  writeLocal(table, local);

  // Attempt remote sync
  const client = getRemoteClient();
  if (client) {
    try {
      const { data, error } = await client
        .from(table)
        .insert(withId as any)
        .select()
        .single();

      if (!error && data) {
        return { data: data as T, error: null, source: "remote" };
      }

      if (error) {
        console.warn(`[DB Bridge] Remote insert failed for ${table}:`, error.message);
        // Data is safe in local cache
      }
    } catch {
      console.warn(`[DB Bridge] Remote unreachable for insert to ${table}`);
    }
  }

  return { data: withId, error: null, source: "local" };
}

/**
 * DELETE — Remove a record by ID
 */
export async function dbDelete(
  table: string,
  id: string
): Promise<{ error: string | null; source: "remote" | "local" }> {
  // Remove from local
  const local = readLocal(table);
  const filtered = local.filter((r: any) => r.id !== id);
  writeLocal(table, filtered);

  // Attempt remote
  const client = getRemoteClient();
  if (client) {
    try {
      const { error } = await client.from(table).delete().eq("id", id);
      if (!error) return { error: null, source: "remote" };
      console.warn(`[DB Bridge] Remote delete failed:`, error.message);
    } catch {
      // Offline — local delete is sufficient
    }
  }

  return { error: null, source: "local" };
}

/**
 * Get sync status — useful for UI indicators
 */
export function getDbSyncStatus(): {
  isRemoteAvailable: boolean;
  localTables: string[];
} {
  const isRemoteAvailable = !!getStoredCredentials();
  const localTables: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(LOCAL_PREFIX)) {
      localTables.push(key.replace(LOCAL_PREFIX, ""));
    }
  }

  return { isRemoteAvailable, localTables };
}
