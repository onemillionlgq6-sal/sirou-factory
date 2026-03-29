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
const MAX_JSON_SIZE = 500_000;

/** String-aware sanitizer — never touches content inside quotes */
function sanitizeJSONInput(input: string): string {
  let result = "";
  let inString = false;
  let escaped = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (inString) {
      if (escaped) {
        escaped = false;
        result += ch;
      } else if (ch === "\\") {
        escaped = true;
        result += ch;
      } else if (ch === '"') {
        inString = false;
        result += ch;
      } else {
        result += ch;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      result += ch;
      continue;
    }

    result += ch;
  }

  return result
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/,\s*}/g, "}")
    .replace(/,\s*]/g, "]")
    .trim();
}

function tryParseJSON(candidate: string): unknown | null {
  const trimmed = candidate.trim();
  if (!trimmed) return null;

  if (trimmed.length > MAX_JSON_SIZE) {
    console.warn(`[Validator] JSON too large: ${trimmed.length} chars`);
    return null;
  }

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

/** Attempt to repair truncated JSON by closing open brackets/braces */
function attemptRepairJSON(text: string): unknown | null {
  let repaired = text.trim();

  // Remove trailing truncation markers
  repaired = repaired.replace(/\.\.\.\s*$/, "").replace(/…\s*$/, "");

  // Close unmatched braces
  const openBraces = (repaired.match(/{/g) || []).length;
  const closeBraces = (repaired.match(/}/g) || []).length;
  for (let i = 0; i < openBraces - closeBraces; i++) repaired += "}";

  // Close unmatched brackets
  const openBrackets = (repaired.match(/\[/g) || []).length;
  const closeBrackets = (repaired.match(/]/g) || []).length;
  for (let i = 0; i < openBrackets - closeBrackets; i++) repaired += "]";

  // Close unmatched quotes
  const quotes = (repaired.match(/"/g) || []).length;
  if (quotes % 2 !== 0) repaired += '"';

  // Handle dangling key with no value
  if (repaired.match(/"[^"]*"\s*:\s*$/)) repaired += "null";

  try {
    return JSON.parse(repaired);
  } catch {
    return null;
  }
}

/**
 * Robustly extract JSON from AI response:
 * 1) direct JSON parse
 * 2) parse all markdown code blocks
 * 3) extract balanced JSON from mixed text
 * 4) attempt repair if truncated
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
    const repaired = attemptRepairJSON(raw);
    if (repaired !== null) {
      console.warn("[Validator] Repaired truncated JSON successfully");
      return { parsed: repaired, error: null };
    }

    return {
      parsed: null,
      error: "الرد مقطوع ولم يُصلح تلقائياً. قسّم الطلب لملفات أصغر.",
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

  if (obj.action === "update_file" || obj.action === "write_file") {
    console.warn(`⚠️ تحويل '${obj.action}' → 'create_file': ${obj.path}`);
    obj.action = "create_file";
  }

  if ("content" in obj && obj.content !== null && typeof obj.content !== "string") {
    obj.content = JSON.stringify(obj.content, null, 2);
  }

  return obj;
}

/**
 * Validate AI response strictly with logging.
 */
export function validateAIResponse(aiText: string): ValidationResult {
  console.log(`[Validator] Input length: ${aiText.length}`);

  const { parsed, error } = extractStrictJSON(aiText);

  if (error || parsed === null) {
    console.error(`[Validator] Extraction failed: ${error}`);
    return {
      valid: false,
      actions: [],
      errors: [error || "فشل استخراج JSON"],
      rawCount: 0,
    };
  }

  const rawItems = normalizeToArray(parsed);
  console.log(`[Validator] Found ${rawItems.length} action(s)`);

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
      console.error(`[Validator] Action #${i + 1} rejected: ${result.error}`);
      errors.push(`أمر #${i + 1}: ${result.error}`);
    } else {
      actions.push(result);
    }
  }

  console.log(`[Validator] Result: ${actions.length} valid, ${errors.length} errors`);

  return {
    valid: actions.length > 0,
    actions,
    errors,
    rawCount: rawItems.length,
  };
}
