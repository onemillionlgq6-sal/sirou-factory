import { createClient, SupabaseClient } from "@supabase/supabase-js";

const STORAGE_KEY = "sirou_supabase_credentials";

interface StoredCredentials {
  url: string;
  anonKey: string;
}

export const getStoredCredentials = (): StoredCredentials | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.url && parsed?.anonKey) return parsed;
    return null;
  } catch {
    return null;
  }
};

export const storeCredentials = (url: string, anonKey: string): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ url, anonKey }));
};

export const clearCredentials = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

export const createSupabaseClient = (
  url: string,
  anonKey: string
): SupabaseClient => {
  return createClient(url, anonKey);
};

/**
 * [Safe 🟢] Initialize learning_log and user_preferences tables.
 * Uses RPC to create tables if they don't exist.
 * Note: Tables must be created via Supabase SQL editor or migrations.
 * This function verifies connectivity and checks table access.
 */
export const initializeTables = async (
  client: SupabaseClient
): Promise<{ success: boolean; message: string }> => {
  try {
    // Test connectivity by querying learning_log
    const { error: logError } = await client
      .from("learning_log")
      .select("id")
      .limit(1);

    const { error: prefError } = await client
      .from("user_preferences")
      .select("id")
      .limit(1);

    // If tables don't exist, that's expected on first connect
    const logMissing =
      logError?.message?.includes("does not exist") ||
      logError?.code === "42P01";
    const prefMissing =
      prefError?.message?.includes("does not exist") ||
      prefError?.code === "42P01";

    if (logMissing || prefMissing) {
      return {
        success: true,
        message:
          "Connected successfully. Tables need to be created via Supabase SQL editor. Run the provided migration SQL.",
      };
    }

    if (logError && !logMissing) {
      return { success: false, message: `learning_log error: ${logError.message}` };
    }
    if (prefError && !prefMissing) {
      return { success: false, message: `user_preferences error: ${prefError.message}` };
    }

    return {
      success: true,
      message: "Connected and tables verified successfully.",
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || "Connection failed. Check your credentials.",
    };
  }
};
