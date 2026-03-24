/**
 * Local Executor Bridge — Connects Frontend to Local Execution Server
 * يرسل أوامر JSON Actions إلى خادم التنفيذ المحلي (server.js)
 */

const LOCAL_SERVER_URL = "http://localhost:3001";

export interface LocalExecutionResult {
  success: boolean;
  message?: string;
  error?: string;
  requiresManual?: boolean;
}

/**
 * Check if the local execution server is running
 */
export async function isLocalServerRunning(): Promise<boolean> {
  try {
    const res = await fetch(`${LOCAL_SERVER_URL}/health`, {
      signal: AbortSignal.timeout(2000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Execute a single action on the local server
 */
export async function executeLocal(action: Record<string, unknown>): Promise<LocalExecutionResult> {
  try {
    const res = await fetch(`${LOCAL_SERVER_URL}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(action),
    });
    return await res.json();
  } catch (err) {
    return {
      success: false,
      error: `فشل الاتصال بالخادم المحلي: ${(err as Error).message}`,
    };
  }
}

/**
 * Execute a batch of actions on the local server
 */
export async function executeLocalBatch(
  actions: Record<string, unknown>[]
): Promise<{ success: boolean; results: LocalExecutionResult[] }> {
  try {
    const res = await fetch(`${LOCAL_SERVER_URL}/execute-batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actions }),
    });
    return await res.json();
  } catch (err) {
    return {
      success: false,
      results: actions.map(() => ({
        success: false,
        error: `فشل الاتصال بالخادم المحلي: ${(err as Error).message}`,
      })),
    };
  }
}

/**
 * Extract all JSON action objects from AI response text.
 * Supports: ```json blocks, inline JSON, nested arrays, and { "actions": [...] } wrappers.
 */
function extractActions(text: string): Record<string, unknown>[] {
  const actions: Record<string, unknown>[] = [];

  // 1. Try ```json code blocks first
  const codeBlockRegex = /```(?:json)?\s*\n?([\s\S]*?)```/g;
  let match;
  while ((match = codeBlockRegex.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim());
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (item && typeof item === "object" && "action" in item) actions.push(item);
        }
      } else if (parsed && typeof parsed === "object") {
        if ("actions" in parsed && Array.isArray(parsed.actions)) {
          for (const item of parsed.actions) {
            if (item && typeof item === "object" && "action" in item) actions.push(item);
          }
        } else if ("action" in parsed) {
          actions.push(parsed);
        }
      }
    } catch { /* skip invalid JSON */ }
  }

  if (actions.length > 0) return actions;

  // 2. Try inline JSON objects with "action" field
  const objRegex = /\{[^{}]*"action"\s*:\s*"[^"]+?"[^{}]*\}/g;
  while ((match = objRegex.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(match[0]);
      if (parsed && "action" in parsed) actions.push(parsed);
    } catch { /* skip */ }
  }

  if (actions.length > 0) return actions;

  // 3. Try parsing the entire text
  try {
    const parsed = JSON.parse(text.trim());
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        if (item && typeof item === "object" && "action" in item) actions.push(item);
      }
    } else if (parsed && typeof parsed === "object" && "action" in parsed) {
      actions.push(parsed);
    }
  } catch { /* not JSON */ }

  return actions;
}

/**
 * Parse AI response text and auto-execute any JSON actions found on the local server.
 */
export async function handleAIExecution(textResponse: string): Promise<LocalExecutionResult[]> {
  const actions = extractActions(textResponse);
  if (actions.length === 0) return [];

  // Check server availability first
  const serverUp = await isLocalServerRunning();
  if (!serverUp) {
    return [{
      success: false,
      error: "الخادم المحلي غير متاح. شغّل: node server.js",
    }];
  }

  // Use batch endpoint for multiple actions
  if (actions.length > 1) {
    const batchResult = await executeLocalBatch(actions);
    return batchResult.results;
  }

  // Single action
  const result = await executeLocal(actions[0]);
  return [result];
}
