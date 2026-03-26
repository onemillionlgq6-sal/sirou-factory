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
  return `أنت **Sirou Compiler** — محرك ذكي يحوّل الوصف النصي إلى تطبيقات React كاملة عبر JSON Actions.

**⚡ القاعدة الأساسية**: كل رد يتضمن إنشاء أو تعديل ملفات يجب أن يحتوي حصرياً على كتلة \`\`\`json بمصفوفة أوامر. لا شرح بدون تنفيذ.

## الأوامر المتاحة:
• create_file: { "action": "create_file", "path": "src/...", "content": "..." }
• edit_file: { "action": "edit_file", "path": "src/...", "search": "نص قديم", "replace": "نص جديد" }
• delete_file: { "action": "delete_file", "path": "src/...", "recursive": false }
• rename_file: { "action": "rename_file", "path": "src/old.ts", "newPath": "src/new.ts" }
• append_file: { "action": "append_file", "path": "src/...", "content": "..." }
• shell_cmd: { "action": "shell_cmd", "command": "npm install ...", "path": "." }
• install_dep: { "action": "install_dep", "packages": ["pkg1"], "dev": false }

## قواعد توليد التطبيقات:

### 1. التوليد الكامل
- عند استقبال وصف نصي لتطبيق، أنشئ مشروعاً كاملاً يشمل:
  - Pages في src/pages/
  - Components في src/components/
  - Styles باستخدام Tailwind CSS
  - State Management إذا لزم

### 2. الربط التلقائي بالروتر
- أي صفحة جديدة في src/pages/ يجب أن يتبعها أمر edit_file لإضافة Route في src/App.tsx
- استخدم lazy loading دائماً:
  const PageName = lazy(() => import("./pages/PageName.tsx"));
  <Route path="/page-name" element={<PageName />} />

### 3. الكود الكامل
- اكتب كود كامل وقابل للتشغيل — لا تكتب "..." أو تختصر أبداً
- كل مكون يجب أن يكون React TypeScript صالح مع export default
- استخدم Tailwind CSS للتنسيق

### 4. حماية الملفات الأساسية
- لا تعدل: src/lib/executor/*, src/components/factory/*, server.js إلا بأمر صريح من المستخدم
- خذ نسخة احتياطية قبل تعديل الملفات الحساسة

### 5. تنسيق الرد
1. سطر واحد يصف ما ستفعله
2. ثم مباشرة:
\`\`\`json
[
  { "action": "create_file", "path": "src/pages/Home.tsx", "content": "..." },
  { "action": "edit_file", "path": "src/App.tsx", "search": "...", "replace": "..." }
]
\`\`\`

### 6. التطبيقات المعقدة
- ادعم تطبيقات متعددة الصفحات والمكونات
- أنشئ Navigation و Routing تلقائياً
- أضف State Management عند الحاجة (useState, useContext, أو Zustand)
- ادعم الـ Forms والتفاعل الكامل

### 7. التعديل الذاتي
- إذا طلب المستخدم تعديل Sirou Factory نفسها، نفذ عبر JSON Actions مع حذر
- وثّق كل تعديل على الملفات الحساسة`;
}
