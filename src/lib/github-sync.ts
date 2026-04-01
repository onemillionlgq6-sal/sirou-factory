/**
 * github-sync.ts — GitHub integration for Sirou Factory.
 * Stores PAT + repo info in localStorage, provides push/sync via GitHub API.
 */

const STORAGE_KEY = "sf_github_credentials";

export interface GitHubCredentials {
  token: string;       // Personal Access Token
  owner: string;       // GitHub username or org
  repo: string;        // Repository name
  branch: string;      // Default branch
}

export interface GitHubSyncStatus {
  connected: boolean;
  lastPush?: string;    // ISO timestamp
  lastCommit?: string;  // SHA
  error?: string;
}

// ── Storage ──────────────────────────────────────────────

export function storeGitHubCredentials(creds: GitHubCredentials): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(creds));
}

export function getGitHubCredentials(): GitHubCredentials | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearGitHubCredentials(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem("sf_github_sync_status");
}

export function isGitHubConnected(): boolean {
  return !!getGitHubCredentials();
}

// ── Sync Status ──────────────────────────────────────────

function getSyncStatus(): GitHubSyncStatus {
  try {
    const raw = localStorage.getItem("sf_github_sync_status");
    return raw ? JSON.parse(raw) : { connected: false };
  } catch {
    return { connected: false };
  }
}

function saveSyncStatus(status: GitHubSyncStatus): void {
  localStorage.setItem("sf_github_sync_status", JSON.stringify(status));
}

export function getLastSyncStatus(): GitHubSyncStatus {
  return getSyncStatus();
}

// ── GitHub API helpers ───────────────────────────────────

const API_BASE = "https://api.github.com";

async function githubFetch(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
}

// ── Test Connection ──────────────────────────────────────

export async function testGitHubConnection(
  creds: GitHubCredentials
): Promise<{ ok: boolean; message: string }> {
  try {
    // Test token validity
    const userRes = await githubFetch("/user", creds.token);
    if (!userRes.ok) {
      return { ok: false, message: "Token غير صالح أو منتهي الصلاحية" };
    }

    // Test repo access
    const repoRes = await githubFetch(
      `/repos/${creds.owner}/${creds.repo}`,
      creds.token
    );
    if (repoRes.ok) {
      return { ok: true, message: `متصل بـ ${creds.owner}/${creds.repo} ✅` };
    }

    // Repo doesn't exist — try to create it
    const createRes = await githubFetch("/user/repos", creds.token, {
      method: "POST",
      body: JSON.stringify({
        name: creds.repo,
        private: true,
        auto_init: true,
        description: "Sirou Factory — auto-synced project",
      }),
    });

    if (createRes.ok) {
      return {
        ok: true,
        message: `تم إنشاء ${creds.owner}/${creds.repo} تلقائياً ✅`,
      };
    }

    return { ok: false, message: "لا يمكن الوصول إلى الـ Repository" };
  } catch (err) {
    return { ok: false, message: `خطأ في الاتصال: ${String(err)}` };
  }
}

// ── Push Files ───────────────────────────────────────────

export async function pushFiles(
  files: Record<string, string>,
  commitMessage: string = "Sirou Factory: auto-sync"
): Promise<{ ok: boolean; sha?: string; error?: string }> {
  const creds = getGitHubCredentials();
  if (!creds) return { ok: false, error: "غير متصل بـ GitHub" };

  try {
    const { token, owner, repo, branch } = creds;

    // 1. Get latest commit SHA on branch
    const refRes = await githubFetch(
      `/repos/${owner}/${repo}/git/ref/heads/${branch}`,
      token
    );
    if (!refRes.ok) {
      return { ok: false, error: "لا يمكن الوصول إلى الفرع" };
    }
    const refData = await refRes.json();
    const latestCommitSha: string = refData.object.sha;

    // 2. Get the tree of the latest commit
    const commitRes = await githubFetch(
      `/repos/${owner}/${repo}/git/commits/${latestCommitSha}`,
      token
    );
    const commitData = await commitRes.json();
    const baseTreeSha: string = commitData.tree.sha;

    // 3. Create blobs for each file
    const treeItems = await Promise.all(
      Object.entries(files).map(async ([path, content]) => {
        const blobRes = await githubFetch(
          `/repos/${owner}/${repo}/git/blobs`,
          token,
          {
            method: "POST",
            body: JSON.stringify({
              content: btoa(unescape(encodeURIComponent(content))),
              encoding: "base64",
            }),
          }
        );
        const blobData = await blobRes.json();
        return {
          path,
          mode: "100644" as const,
          type: "blob" as const,
          sha: blobData.sha,
        };
      })
    );

    // 4. Create new tree
    const treeRes = await githubFetch(
      `/repos/${owner}/${repo}/git/trees`,
      token,
      {
        method: "POST",
        body: JSON.stringify({ base_tree: baseTreeSha, tree: treeItems }),
      }
    );
    const treeData = await treeRes.json();

    // 5. Create commit
    const newCommitRes = await githubFetch(
      `/repos/${owner}/${repo}/git/commits`,
      token,
      {
        method: "POST",
        body: JSON.stringify({
          message: commitMessage,
          tree: treeData.sha,
          parents: [latestCommitSha],
        }),
      }
    );
    const newCommitData = await newCommitRes.json();

    // 6. Update branch ref
    await githubFetch(
      `/repos/${owner}/${repo}/git/refs/heads/${branch}`,
      token,
      {
        method: "PATCH",
        body: JSON.stringify({ sha: newCommitData.sha }),
      }
    );

    // Save sync status
    saveSyncStatus({
      connected: true,
      lastPush: new Date().toISOString(),
      lastCommit: newCommitData.sha,
    });

    return { ok: true, sha: newCommitData.sha };
  } catch (err) {
    const error = String(err);
    saveSyncStatus({ connected: true, error });
    return { ok: false, error };
  }
}

// ── Get Repo URL ─────────────────────────────────────────

export function getRepoUrl(): string | null {
  const creds = getGitHubCredentials();
  if (!creds) return null;
  return `https://github.com/${creds.owner}/${creds.repo}`;
}
