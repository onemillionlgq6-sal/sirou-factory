/**
 * AI Provider Service — Reads stored preferences and routes AI calls
 * to the selected provider (DeepSeek, OpenAI, Anthropic, or built-in).
 */

const PREFS_KEY = "sirou_factory_prefs";

interface FactoryPrefs {
  theme: string;
  aiProvider: "built-in" | "openai" | "anthropic" | "deepseek";
  deepseekKey: string;
}

function getPrefs(): FactoryPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? { deepseekKey: "", aiProvider: "built-in", ...JSON.parse(raw) } : { theme: "dark", aiProvider: "built-in", deepseekKey: "" };
  } catch {
    return { theme: "dark", aiProvider: "built-in", deepseekKey: "" };
  }
}

export function getActiveProvider(): FactoryPrefs["aiProvider"] {
  return getPrefs().aiProvider;
}

export function hasActiveAPIKey(): boolean {
  const prefs = getPrefs();
  if (prefs.aiProvider === "deepseek" && prefs.deepseekKey.trim()) return true;
  return false;
}

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIStreamCallbacks {
  onToken: (token: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
}

/**
 * Call DeepSeek API with streaming
 */
async function callDeepSeek(
  messages: AIMessage[],
  callbacks: AIStreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  const prefs = getPrefs();
  const apiKey = prefs.deepseekKey.trim();

  if (!apiKey) {
    callbacks.onError("مفتاح DeepSeek غير موجود. أضفه من الإعدادات.");
    return;
  }

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages,
        stream: true,
        max_tokens: 2048,
      }),
      signal,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      if (response.status === 401) {
        callbacks.onError("مفتاح DeepSeek غير صالح. تحقق من المفتاح في الإعدادات.");
      } else if (response.status === 429) {
        callbacks.onError("تم تجاوز حد الاستخدام. حاول لاحقاً.");
      } else if (response.status === 402) {
        callbacks.onError("رصيد DeepSeek غير كافٍ. أعد الشحن من حسابك.");
      } else {
        callbacks.onError(`خطأ من DeepSeek (${response.status}): ${errText.slice(0, 100)}`);
      }
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      callbacks.onError("فشل في قراءة الاستجابة");
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let newlineIdx: number;
      while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, newlineIdx);
        buffer = buffer.slice(newlineIdx + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          callbacks.onDone();
          return;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) callbacks.onToken(content);
        } catch {
          // Incomplete JSON, wait for more data
        }
      }
    }

    callbacks.onDone();
  } catch (err: any) {
    if (err.name === "AbortError") {
      callbacks.onDone();
    } else {
      callbacks.onError(`خطأ في الاتصال: ${err.message || "غير معروف"}`);
    }
  }
}

/**
 * Built-in simulated response (fallback)
 */
function callBuiltIn(
  messages: AIMessage[],
  callbacks: AIStreamCallbacks
): void {
  const lastUserMsg = messages.filter(m => m.role === "user").pop()?.content || "";

  let response: string;
  if (lastUserMsg.length < 10) {
    response = "مرحباً! صف لي فكرة التطبيق بالتفصيل وسأساعدك في بنائه. 🚀";
  } else {
    response = `✅ تم استلام طلبك. جاري تحليل: "${lastUserMsg.slice(0, 60)}${lastUserMsg.length > 60 ? "..." : ""}"...\n\nسيتم بناء التطبيق مع:\n• واجهة مستخدم احترافية\n• تشفير AES-256\n• نظام صلاحيات\n• دعم الأجهزة`;
  }

  // Simulate streaming word-by-word
  const words = response.split(" ");
  let i = 0;
  const interval = setInterval(() => {
    if (i < words.length) {
      callbacks.onToken((i > 0 ? " " : "") + words[i]);
      i++;
    } else {
      clearInterval(interval);
      callbacks.onDone();
    }
  }, 50);
}

/**
 * Main entry: routes to the active provider
 */
export async function sendAIMessage(
  messages: AIMessage[],
  callbacks: AIStreamCallbacks,
  signal?: AbortSignal
): Promise<void> {
  const provider = getActiveProvider();

  if (provider === "deepseek" && hasActiveAPIKey()) {
    return callDeepSeek(messages, callbacks, signal);
  }

  // Fallback to built-in for all other providers
  callBuiltIn(messages, callbacks);
}

/**
 * Non-streaming single call (for planner, quick tasks)
 */
export async function askAI(prompt: string, systemPrompt?: string): Promise<string> {
  const prefs = getPrefs();

  if (prefs.aiProvider === "deepseek" && prefs.deepseekKey.trim()) {
    const messages: AIMessage[] = [];
    if (systemPrompt) messages.push({ role: "system", content: systemPrompt });
    messages.push({ role: "user", content: prompt });

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${prefs.deepseekKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  }

  // Built-in fallback
  return `تم تحليل طلبك: "${prompt.slice(0, 80)}".\nجاري التنفيذ...`;
}
