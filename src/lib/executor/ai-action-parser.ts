/**
 * AI Action Parser — LLM-agnostic
 * Converts raw AI responses into validated JSON Actions.
 * Supports DeepSeek, Claude, GPT, and any future model.
 */

import { ActionSchema, validateAndClassify, type ValidatedAction, type FactoryAction } from "./action-schema";

// ─── Types ───

export interface ParseResult {
  actions: ValidatedAction[];
  errors: string[];
  rawCount: number;
}

// ─── Extract JSON blocks from AI text ───

function extractJSONBlocks(text: string): unknown[] {
  const blocks: unknown[] = [];

  // Try JSON code blocks
  const codeBlockRegex = /```(?:json)?\s*\n?([\s\S]*?)```/g;
  let match;
  while ((match = codeBlockRegex.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      if (Array.isArray(parsed)) {
        blocks.push(...parsed);
      } else {
        blocks.push(parsed);
      }
    } catch { /* not valid JSON */ }
  }

  // Try inline JSON objects
  if (blocks.length === 0) {
    const objRegex = /\{[^{}]*"action"\s*:\s*"[^"]+?"[^{}]*\}/g;
    while ((match = objRegex.exec(text)) !== null) {
      try {
        blocks.push(JSON.parse(match[0]));
      } catch { /* skip */ }
    }
  }

  // Try parsing the entire text as JSON
  if (blocks.length === 0) {
    try {
      const parsed = JSON.parse(text.trim());
      if (Array.isArray(parsed)) {
        blocks.push(...parsed);
      } else if (parsed && typeof parsed === "object") {
        if ("actions" in parsed && Array.isArray(parsed.actions)) {
          blocks.push(...parsed.actions);
        } else {
          blocks.push(parsed);
        }
      }
    } catch { /* not JSON at all */ }
  }

  return blocks;
}

// ─── Parse AI Response ───

export function parseAIResponse(aiText: string): ParseResult {
  const rawBlocks = extractJSONBlocks(aiText);
  const actions: ValidatedAction[] = [];
  const errors: string[] = [];

  for (const block of rawBlocks) {
    const result = validateAndClassify(block);
    if ("error" in result) {
      errors.push(result.error);
    } else {
      actions.push(result);
    }
  }

  return {
    actions,
    errors,
    rawCount: rawBlocks.length,
  };
}

// ─── Build System Prompt for Action Generation ───

export function getActionSystemPrompt(): string {
  return `أنت محرك تنفيذي ذكي. عند طلب تنفيذ مهمة، أعد الاستجابة كمصفوفة JSON actions.

الأوامر المتاحة:
- create_file: { "action": "create_file", "path": "...", "content": "..." }
- edit_file: { "action": "edit_file", "path": "...", "search": "...", "replace": "..." }
- delete_file: { "action": "delete_file", "path": "...", "recursive": false }
- rename_file: { "action": "rename_file", "path": "...", "newPath": "..." }
- append_file: { "action": "append_file", "path": "...", "content": "..." }
- shell_cmd: { "action": "shell_cmd", "command": "..." }
- install_dep: { "action": "install_dep", "packages": ["..."], "dev": false }

قواعد:
1. أعد JSON فقط داخل \`\`\`json ... \`\`\`
2. لا تعدل ملفات المصنع الأساسية إلا بأمر صريح
3. اختر أبسط الأوامر لتحقيق المطلوب
4. أرفق وصفاً مختصراً قبل كل مجموعة أوامر`;
}
