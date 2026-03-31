/**
 * Supabase Sync Layer — حفظ واستعادة تلقائية للمحادثات والمشاريع والإعدادات.
 * يعمل مع مشروع Supabase شخصي عبر URL + Anon Key.
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseClient, getStoredCredentials } from "./supabase";

// ─── أنواع البيانات ───

export interface ConversationRecord {
  id?: string;
  title: string;
  messages: Array<{
    role: "user" | "ai";
    text: string;
    images?: string[];
    timestamp: string;
  }>;
  mode: "app" | "factory";
  created_at?: string;
  updated_at?: string;
}

export interface ProjectRecord {
  id?: string;
  name: string;
  description?: string;
  files: Record<string, string>;
  created_at?: string;
  updated_at?: string;
}

export interface SettingsRecord {
  id?: string;
  key: string;
  value: string;
  updated_at?: string;
}

// ─── إدارة الاتصال ───

let _client: SupabaseClient | null = null;

export function getClient(): SupabaseClient | null {
  if (_client) return _client;
  const creds = getStoredCredentials();
  if (!creds) return null;
  _client = createSupabaseClient(creds.url, creds.anonKey);
  return _client;
}

export function resetClient(): void {
  _client = null;
}

export function isConnected(): boolean {
  return getClient() !== null;
}

// ─── اختبار الاتصال ───

export async function testConnection(): Promise<{ ok: boolean; message: string }> {
  const client = getClient();
  if (!client) return { ok: false, message: "لا توجد بيانات اتصال محفوظة" };

  try {
    const { error } = await client.from("conversations").select("id").limit(1);
    if (error?.code === "42P01") {
      return { ok: false, message: "الجداول غير موجودة. أنشئها من SQL Editor في Supabase." };
    }
    if (error) return { ok: false, message: error.message };
    return { ok: true, message: "متصل بنجاح ✅" };
  } catch (err: any) {
    return { ok: false, message: err?.message || "فشل الاتصال" };
  }
}

// ─── SQL لإنشاء الجداول ───

export const SETUP_SQL = `
-- جدول المحادثات
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT 'محادثة جديدة',
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  mode TEXT NOT NULL DEFAULT 'app',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول المشاريع
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  files JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول الإعدادات
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- جدول التاريخ (Undo/History)
CREATE TABLE IF NOT EXISTS history (
  id TEXT PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  description TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'manual',
  snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- تحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_conversations_updated') THEN
    CREATE TRIGGER trg_conversations_updated BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_projects_updated') THEN
    CREATE TRIGGER trg_projects_updated BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_settings_updated') THEN
    CREATE TRIGGER trg_settings_updated BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;
`;

// ─── عمليات المحادثات ───

export async function saveConversation(conv: ConversationRecord): Promise<string | null> {
  const client = getClient();
  if (!client) return null;

  try {
    if (conv.id) {
      const { error } = await client
        .from("conversations")
        .update({ title: conv.title, messages: conv.messages, mode: conv.mode })
        .eq("id", conv.id);
      if (error) { console.error("[Sync] saveConversation update:", error); return null; }
      return conv.id;
    } else {
      const { data, error } = await client
        .from("conversations")
        .insert({ title: conv.title, messages: conv.messages, mode: conv.mode })
        .select("id")
        .single();
      if (error) { console.error("[Sync] saveConversation insert:", error); return null; }
      return data?.id ?? null;
    }
  } catch (err) {
    console.error("[Sync] saveConversation:", err);
    return null;
  }
}

export async function loadConversations(): Promise<ConversationRecord[]> {
  const client = getClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from("conversations")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(50);
    if (error) { console.error("[Sync] loadConversations:", error); return []; }
    return data ?? [];
  } catch { return []; }
}

export async function deleteConversation(id: string): Promise<boolean> {
  const client = getClient();
  if (!client) return false;
  const { error } = await client.from("conversations").delete().eq("id", id);
  return !error;
}

// ─── عمليات المشاريع ───

export async function saveProject(project: ProjectRecord): Promise<string | null> {
  const client = getClient();
  if (!client) return null;

  try {
    if (project.id) {
      const { error } = await client
        .from("projects")
        .update({ name: project.name, description: project.description, files: project.files })
        .eq("id", project.id);
      if (error) { console.error("[Sync] saveProject:", error); return null; }
      return project.id;
    } else {
      const { data, error } = await client
        .from("projects")
        .insert({ name: project.name, description: project.description, files: project.files })
        .select("id")
        .single();
      if (error) { console.error("[Sync] saveProject:", error); return null; }
      return data?.id ?? null;
    }
  } catch { return null; }
}

export async function loadProjects(): Promise<ProjectRecord[]> {
  const client = getClient();
  if (!client) return [];

  try {
    const { data, error } = await client
      .from("projects")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) return [];
    return data ?? [];
  } catch { return []; }
}

// ─── عمليات الإعدادات ───

export async function saveSetting(key: string, value: string): Promise<boolean> {
  const client = getClient();
  if (!client) return false;

  try {
    const { error } = await client
      .from("settings")
      .upsert({ key, value }, { onConflict: "key" });
    return !error;
  } catch { return false; }
}

export async function loadSettings(): Promise<Record<string, string>> {
  const client = getClient();
  if (!client) return {};

  try {
    const { data, error } = await client.from("settings").select("key, value");
    if (error) return {};
    const result: Record<string, string> = {};
    for (const row of data ?? []) result[row.key] = row.value;
    return result;
  } catch { return {}; }
}
