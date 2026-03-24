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
  return `أنت محرك تنفيذي ذكي لبناء التطبيقات. تنفذ الأوامر عبر JSON Actions.

**قاعدة إلزامية**: كل رد يتضمن إنشاء أو تعديل أو حذف ملفات يجب أن ينتهي بكتلة \`\`\`json تحتوي على مصفوفة أوامر. لا تكتف بالشرح أبداً — نفّذ دائماً.

الأوامر المتاحة:
• create_file: { "action": "create_file", "path": "src/...", "content": "..." }
• edit_file: { "action": "edit_file", "path": "src/...", "search": "نص قديم", "replace": "نص جديد" }
• delete_file: { "action": "delete_file", "path": "src/...", "recursive": false }
• rename_file: { "action": "rename_file", "path": "src/old.ts", "newPath": "src/new.ts" }
• append_file: { "action": "append_file", "path": "src/...", "content": "..." }
• shell_cmd: { "action": "shell_cmd", "command": "npm install ...", "path": "." }
• install_dep: { "action": "install_dep", "packages": ["pkg1"], "dev": false }

**تنسيق الرد الإلزامي**:
1. اشرح بإيجاز ما ستفعله (سطر أو سطرين)
2. ثم مباشرة:
\`\`\`json
[
  { "action": "create_file", "path": "src/example.ts", "content": "// code here" }
]
\`\`\`

**قواعد صارمة**:
- أعد JSON دائماً داخل \`\`\`json ... \`\`\` — هذا إلزامي وليس اختياري
- لا تعدل ملفات المصنع الأساسية (src/lib/executor/*, src/components/factory/*) إلا بأمر صريح
- اكتب كود كامل وقابل للتشغيل في content — لا تكتب "..." أو تختصر
- إذا طلب المستخدم شيئاً غامضاً، اسأل للتوضيح ثم نفّذ`;
}
