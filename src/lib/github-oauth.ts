/**
 * github-oauth.ts — GitHub OAuth flow via local server.js proxy.
 */

const SERVER_BASE = "http://localhost:3001";
const OAUTH_SETTINGS_KEY = "sf_github_oauth_app";

export interface GitHubOAuthApp {
  clientId: string;
  clientSecret: string;
}

export function storeOAuthApp(app: GitHubOAuthApp): void {
  localStorage.setItem(OAUTH_SETTINGS_KEY, JSON.stringify(app));
}

export function getOAuthApp(): GitHubOAuthApp | null {
  try {
    const raw = localStorage.getItem(OAUTH_SETTINGS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearOAuthApp(): void {
  localStorage.removeItem(OAUTH_SETTINGS_KEY);
}

/**
 * Start GitHub OAuth flow:
 * 1. Get auth URL from server
 * 2. Open popup
 * 3. Poll for callback code
 * 4. Exchange code for token
 */
export async function startGitHubOAuth(): Promise<{
  ok: boolean;
  token?: string;
  login?: string;
  error?: string;
}> {
  const app = getOAuthApp();
  if (!app?.clientId || !app?.clientSecret) {
    return { ok: false, error: "أدخل GitHub OAuth Client ID و Secret في الإعدادات أولاً" };
  }

  try {
    // 1. Get auth URL
    const startRes = await fetch(
      `${SERVER_BASE}/github/oauth/start?client_id=${app.clientId}`
    );
    if (!startRes.ok) {
      return { ok: false, error: "تعذر بدء OAuth — تأكد أن server.js يعمل" };
    }
    const { url } = await startRes.json();

    // 2. Open popup
    const popup = window.open(url, "github-oauth", "width=600,height=700");
    if (!popup) {
      return { ok: false, error: "تم حظر النافذة المنبثقة — اسمح بالنوافذ المنبثقة" };
    }

    // 3. Poll for code (max 5 minutes)
    const code = await pollForCode(popup, 300000);
    if (!code) {
      return { ok: false, error: "انتهت مهلة التفويض أو تم إلغاؤه" };
    }

    // 4. Exchange code for token
    const tokenRes = await fetch(`${SERVER_BASE}/github/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        client_id: app.clientId,
        client_secret: app.clientSecret,
      }),
    });
    const data = await tokenRes.json();

    if (data.ok) {
      return { ok: true, token: data.token, login: data.login };
    }
    return { ok: false, error: data.error || "فشل الحصول على التوكن" };
  } catch (err) {
    return { ok: false, error: `خطأ: ${String(err)}` };
  }
}

async function pollForCode(
  popup: Window,
  timeoutMs: number
): Promise<string | null> {
  const start = Date.now();

  return new Promise((resolve) => {
    const interval = setInterval(async () => {
      // Check if popup was closed
      if (popup.closed) {
        clearInterval(interval);
        // Try one last poll
        try {
          const res = await fetch(`${SERVER_BASE}/github/oauth/poll`);
          const data = await res.json();
          resolve(data.ready ? data.code : null);
        } catch {
          resolve(null);
        }
        return;
      }

      // Timeout
      if (Date.now() - start > timeoutMs) {
        clearInterval(interval);
        popup.close();
        resolve(null);
        return;
      }

      // Poll server
      try {
        const res = await fetch(`${SERVER_BASE}/github/oauth/poll`);
        const data = await res.json();
        if (data.ready) {
          clearInterval(interval);
          popup.close();
          resolve(data.code);
        }
      } catch {
        // Server not ready, keep polling
      }
    }, 2000);
  });
}
