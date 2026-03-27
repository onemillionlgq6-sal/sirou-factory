/**
 * Action Validator — Strict JSON-only gate between AI responses and executor.
 * Rejects any non-JSON AI output. Validates every action against action-schema.
 * Nothing passes to executor without validation.
 */

import { ActionSchema, validateAndClassify, type ValidatedAction } from "./action-schema";

export interface ValidationResult {
  valid: boolean;
  actions: ValidatedAction[];
  errors: string[];
  rawCount: number;
}

/**
 * Strictly extract JSON from AI response.
 * ONLY accepts:
 *   1. A ```json code block containing a JSON array or object
 *   2. Raw text that is itself valid JSON
 * Does NOT attempt fuzzy/regex parsing of inline JSON fragments.
 */
function extractStrictJSON(text: string): { parsed: unknown | null; error: string | null } {
  // 1. Try ```json code block (single block only)
  const codeBlockMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return { parsed: JSON.parse(codeBlockMatch[1].trim()), error: null };
    } catch (e) {
      return { parsed: null, error: `JSON غير صالح داخل كتلة الكود: ${(e as Error).message}` };
    }
  }

  // 2. Try parsing the entire trimmed text as JSON
  const trimmed = text.trim();
  // Must start with [ or { to be JSON
  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      return { parsed: JSON.parse(trimmed), error: null };
    } catch (e) {
      return { parsed: null, error: `JSON غير صالح: ${(e as Error).message}` };
    }
  }

  // 3. Not JSON at all
  return { parsed: null, error: "الرد لا يحتوي على JSON صالح. يجب أن يكون الرد كتلة ```json أو JSON خام فقط." };
}

/**
 * Normalize parsed JSON into an array of raw action objects.
 */
function normalizeToArray(parsed: unknown): unknown[] {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === "object") {
    const obj = parsed as Record<string, unknown>;
    // Support { "actions": [...] } wrapper
    if ("actions" in obj && Array.isArray(obj.actions)) return obj.actions;
    // Single action object
    if ("action" in obj) return [obj];
  }
  return [];
}

/**
 * Pre-process raw action objects before schema validation.
 * - Auto-stringifies object `content` fields (e.g. JSON files where content is an object).
 * - Maps `update_file` to `create_file` (common AI alias).
 */
function preProcessAction(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const obj = { ...(raw as Record<string, unknown>) };

  // Map update_file → create_file (update_file is not in schema but AIs use it)
  if (obj.action === "update_file") {
    obj.action = "create_file";
  }

  // Auto-stringify object content for JSON files
  if ("content" in obj && obj.content !== null && typeof obj.content === "object") {
    obj.content = JSON.stringify(obj.content, null, 2);
  }

  return obj;
}

/**
 * Validate AI response strictly:
 * 1. Extract JSON (reject if not valid JSON)
 * 2. Normalize to action array
 * 3. Validate each action against ActionSchema
 * 4. Return only validated actions + all errors
 */
export function validateAIResponse(aiText: string): ValidationResult {
  const { parsed, error } = extractStrictJSON(aiText);

  if (error || parsed === null) {
    return {
      valid: false,
      actions: [],
      errors: [error || "فشل استخراج JSON"],
      rawCount: 0,
    };
  }

  const rawItems = normalizeToArray(parsed);

  if (rawItems.length === 0) {
    return {
      valid: false,
      actions: [],
      errors: ["لم يتم العثور على أوامر action في JSON"],
      rawCount: 0,
    };
  }

  const actions: ValidatedAction[] = [];
  const errors: string[] = [];

  for (let i = 0; i < rawItems.length; i++) {
    const processed = preProcessAction(rawItems[i]);
    const result = validateAndClassify(processed);
    if ("error" in result) {
      errors.push(`أمر #${i + 1}: ${result.error}`);
    } else {
      actions.push(result);
    }
  }

  return {
    valid: actions.length > 0,
    actions,
    errors,
    rawCount: rawItems.length,
  };
}
