/**
 * kimi-store.ts — localStorage persistence for Kimi consultant conversations.
 */

const STORE_KEY = "sf_kimi_conversations";
const MAX_CONVERSATIONS = 100;

export interface KimiMessage {
  sender: "kimi" | "user";
  text: string;
  timestamp: string;
}

export interface KimiConversation {
  id: string;
  title: string;
  date: string;
  time: string;
  messageCount: number;
  messages: KimiMessage[];
  relatedCode?: string;
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function loadConversations(): KimiConversation[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveConversations(convos: KimiConversation[]): void {
  // Keep only the latest MAX_CONVERSATIONS
  const trimmed = convos.slice(0, MAX_CONVERSATIONS);
  localStorage.setItem(STORE_KEY, JSON.stringify(trimmed));
}

export function createConversation(): KimiConversation {
  const now = new Date();
  return {
    id: genId(),
    title: "محادثة جديدة",
    date: now.toISOString().split("T")[0],
    time: now.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
    messageCount: 0,
    messages: [],
  };
}

export function saveConversation(convo: KimiConversation): void {
  const all = loadConversations();
  const idx = all.findIndex((c) => c.id === convo.id);
  if (idx >= 0) {
    all[idx] = convo;
  } else {
    all.unshift(convo);
  }
  saveConversations(all);
}

export function deleteConversation(id: string): void {
  const all = loadConversations().filter((c) => c.id !== id);
  saveConversations(all);
}

export function generateTitle(firstQuestion: string): string {
  const q = firstQuestion.trim().slice(0, 60);
  if (q.startsWith("ما ")) return "فهمت " + q.slice(3);
  if (q.startsWith("كيف ")) return "تعلمت " + q.slice(4);
  if (q.startsWith("لماذا ")) return "حل مشكلة: " + q.slice(6);
  return q || "محادثة جديدة";
}
