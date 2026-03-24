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
 * Parse AI response text and auto-execute any JSON actions found
 */
export async function handleAIExecution(textResponse: string): Promise<LocalExecutionResult[]> {
  const results: LocalExecutionResult[] = [];

  // Extract all JSON action blocks
  const jsonRegex = /\{[\s\S]*?"action"\s*:\s*"[^"]+?"[\s\S]*?\}/g;
  const matches = textResponse.match(jsonRegex);

  if (!matches || matches.length === 0) return results;

  // Check server availability first
  const serverUp = await isLocalServerRunning();
  if (!serverUp) {
    return [{
      success: false,
      error: "الخادم المحلي غير متاح. شغّل: node server.js",
    }];
  }

  for (const match of matches) {
    try {
      const actionData = JSON.parse(match);
      if (actionData.action) {
        const result = await executeLocal(actionData);
        results.push(result);
      }
    } catch {
      // Skip invalid JSON
    }
  }

  return results;
}
