/**
 * Action Validator — Strict JSON-only gate between AI responses and executor.
 * Rejects any non-JSON AI output. Validates every action against action-schema.
 * Nothing passes to executor without validation.
 */

import { validateAndClassify, type ValidatedAction } from "./action-schema";

export interface ValidationResult {
  valid: boolean;
  actions: ValidatedAction[];
  errors: string[];
  rawCount: number;
}

const CODE_BLOCK_REGEX = /```(?:json)?\s*\n?([\s\S]*?)```/gi;
const TRUNCATION_PATTERNS = [/\.\.\.\s*$/, /…\s*$/, /\[truncated\]/i, /\[continued\]/i];

function sanitizeJSONInput(input: string): string {
  return input
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/,\s*}/g, "}")
    .replace(/,\s*]/g, "]")
    .trim();
}

function tryParseJSON(candidate: string): unknown | null {
  const trimmed = candidate.trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed);
  } catch {
    try {
      return JSON.parse(sanitizeJSONInput(trimmed));
    } catch {
      return null;
    }
  }
}

/**
 * Extract a balanced JSON object/array from mixed text while respecting strings/escapes.
 */
function extractBalancedJSONSlice(text: string): string | null {
  const start = text.search(/[\[{]/);
  if (start === -1) return null;

  let inString = false;
  let escaped = false;
  let braces = 0;
  let brackets = 0;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === "{") braces++;
    if (ch === "}") braces--;
    if (ch === "[") brackets++;
    if (ch === "]") brackets--;

    if (braces === 0 && brackets === 0) {
      return text.slice(start, i + 1);
    }
  }

  return null;
}

function detectLikelyTruncation(text: string): boolean {
  const trimmed = text.trim();
  const openBraces = (trimmed.match(/{/g) || []).length;
  const closeBraces = (trimmed.match(/}/g) || []).length;
  const openBrackets = (trimmed.match(/\[/g) || []).length;
  const closeBrackets = (trimmed.match(/]/g) || []).length;

  if (openBraces !== closeBraces || openBrackets !== closeBrackets) {
    return true;
  }

  return TRUNCATION_PATTERNS.some((pattern) => pattern.test(trimmed));
}

/**
 * Robustly extract JSON from AI response:
 * 1) direct JSON parse
 * 2) parse all markdown code blocks
 * 3) extract balanced JSON from mixed text
 */
function extractStrictJSON(text: string): { parsed: unknown | null; error: string | null } {
  const raw = text.trim();
  if (!raw) {
    return { parsed: null, error: "الرد فارغ من AI" };
  }

  const direct = tryParseJSON(raw);
  if (direct !== null) {
    return { parsed: direct, error: null };
  }

  let blockMatch: RegExpExecArray | null;
  while ((blockMatch = CODE_BLOCK_REGEX.exec(raw)) !== null) {
    const parsedBlock = tryParseJSON(blockMatch[1]);
    if (parsedBlock !== null) {
      return { parsed: parsedBlock, error: null };
    }
  }

  const withoutCodeFences = raw
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  const balanced = extractBalancedJSONSlice(withoutCodeFences) ?? extractBalancedJSONSlice(raw);
  if (balanced) {
    const parsedBalanced = tryParseJSON(balanced);
    if (parsedBalanced !== null) {
      return { parsed: parsedBalanced, error: null };
    }
  }

  if (detectLikelyTruncation(raw)) {
    return {
      parsed: null,
      error: "الرد يبدو مقطوعاً أو غير مكتمل JSON. أعد المحاولة أو اطلب من النموذج رد أقصر.",
    };
  }

  return {
    parsed: null,
    error: "الرد لا يحتوي على JSON صالح. يجب أن يكون الرد JSON Actions فقط.",
  };
}

/**
 * Normalize parsed JSON into an array of raw action objects.
 */
function normalizeToArray(parsed: unknown): unknown[] {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === "object") {
    const obj = parsed as Record<string, unknown>;
    if ("actions" in obj && Array.isArray(obj.actions)) return obj.actions;
    if ("action" in obj) return [obj];
  }
  return [];
}

/**
 * Pre-process raw action objects before schema validation.
 */
function preProcessAction(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const obj = { ...(raw as Record<string, unknown>) };

  // Common aliases used by LLMs
  if (obj.action === "update_file" || obj.action === "write_file") {
    obj.action = "create_file";
  }

  // Auto-stringify structured content (JSON objects, arrays, etc.)
  if ("content" in obj && obj.content !== null && typeof obj.content !== "string") {
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
