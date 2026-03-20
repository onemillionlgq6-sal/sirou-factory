/**
 * Plugin Sandbox & Execution Boundary
 * 
 * Every generated feature/plugin runs in a controlled runtime:
 *   - Web Worker for compute-only tasks (no DOM access)
 *   - Sandboxed Iframe for UI plugins (no parent access)
 * 
 * Central Permission Manager validates all plugin actions.
 * Zero direct access to Factory's Master Key or core state.
 */

// ─── Permission System ───

export type PermissionScope =
  | "data:read"
  | "data:write"
  | "ui:render"
  | "network:fetch"
  | "storage:local"
  | "api:invoke";

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  permissions: PermissionScope[];
  entrypoint: string; // JS code string or URL
  type: "worker" | "iframe";
  verified: boolean;
}

export interface PluginMessage {
  type: "request" | "response" | "event";
  action: string;
  payload: unknown;
  requestId: string;
  pluginId: string;
}

interface RunningPlugin {
  manifest: PluginManifest;
  runtime: Worker | HTMLIFrameElement;
  grantedPermissions: Set<PermissionScope>;
  messageHandler: (e: MessageEvent) => void;
}

// ─── Permission Manager (Central Authority) ───

class PermissionManager {
  private grants = new Map<string, Set<PermissionScope>>();

  grantPermissions(pluginId: string, scopes: PermissionScope[]): void {
    this.grants.set(pluginId, new Set(scopes));
  }

  revokeAll(pluginId: string): void {
    this.grants.delete(pluginId);
  }

  hasPermission(pluginId: string, scope: PermissionScope): boolean {
    return this.grants.get(pluginId)?.has(scope) ?? false;
  }

  getGranted(pluginId: string): PermissionScope[] {
    return Array.from(this.grants.get(pluginId) ?? []);
  }

  /** Validate a plugin action against its granted permissions */
  validateAction(pluginId: string, action: string): { allowed: boolean; reason?: string } {
    const scopeMap: Record<string, PermissionScope> = {
      "read": "data:read",
      "write": "data:write",
      "fetch": "network:fetch",
      "render": "ui:render",
      "store": "storage:local",
      "invoke": "api:invoke",
    };

    const requiredScope = scopeMap[action];
    if (!requiredScope) {
      return { allowed: false, reason: `Unknown action: ${action}` };
    }

    if (!this.hasPermission(pluginId, requiredScope)) {
      return {
        allowed: false,
        reason: `Plugin "${pluginId}" lacks permission: ${requiredScope}`,
      };
    }

    return { allowed: true };
  }
}

export const permissionManager = new PermissionManager();

// ─── Sandbox Runtime ───

const runningPlugins = new Map<string, RunningPlugin>();

/**
 * Create a sandboxed Web Worker for compute-only plugins.
 * Worker has zero DOM access and communicates via structured messages only.
 */
function createWorkerSandbox(manifest: PluginManifest): Worker {
  // Wrap plugin code in a strict sandbox
  const sandboxCode = `
    "use strict";
    // Block all global access except messaging
    const _postMessage = self.postMessage.bind(self);
    
    // Freeze dangerous globals
    const BLOCKED = ['importScripts', 'XMLHttpRequest', 'fetch', 'WebSocket', 'indexedDB'];
    for (const name of BLOCKED) {
      Object.defineProperty(self, name, { value: undefined, writable: false, configurable: false });
    }
    
    // Plugin API — only structured message passing
    const PluginAPI = {
      request(action, payload) {
        const requestId = crypto.randomUUID();
        _postMessage({ type: "request", action, payload, requestId, pluginId: "${manifest.id}" });
        return requestId;
      },
      emit(eventName, data) {
        _postMessage({ type: "event", action: eventName, payload: data, requestId: "", pluginId: "${manifest.id}" });
      }
    };
    
    self.onmessage = function(e) {
      if (e.data?.type === "response") {
        // Handle response from host
      }
    };
    
    // Execute plugin code
    try {
      ${manifest.entrypoint}
    } catch(err) {
      _postMessage({ type: "event", action: "error", payload: { message: err.message }, requestId: "", pluginId: "${manifest.id}" });
    }
  `;

  const blob = new Blob([sandboxCode], { type: "application/javascript" });
  const url = URL.createObjectURL(blob);
  const worker = new Worker(url);
  URL.revokeObjectURL(url);

  return worker;
}

/**
 * Create a sandboxed iframe for UI plugins.
 * Iframe runs in a null origin with no access to parent window.
 */
function createIframeSandbox(manifest: PluginManifest): HTMLIFrameElement {
  const iframe = document.createElement("iframe");
  // Strict sandbox: no scripts by default, no forms, no popups, no same-origin
  iframe.sandbox.add("allow-scripts");
  // No allow-same-origin — iframe gets null origin, zero parent access
  iframe.style.display = "none";
  iframe.style.border = "none";

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
    <body>
    <script>
      "use strict";
      const PluginAPI = {
        request(action, payload) {
          const requestId = crypto.randomUUID();
          parent.postMessage({ type: "request", action, payload, requestId, pluginId: "${manifest.id}" }, "*");
          return requestId;
        }
      };
      try { ${manifest.entrypoint} }
      catch(err) {
        parent.postMessage({ type: "event", action: "error", payload: { message: err.message }, requestId: "", pluginId: "${manifest.id}" }, "*");
      }
    </script>
    </body>
    </html>
  `;

  iframe.srcdoc = html;
  document.body.appendChild(iframe);

  return iframe;
}

/**
 * Load and run a plugin in its sandbox.
 * All permissions must be explicitly granted before execution.
 */
export function loadPlugin(manifest: PluginManifest): { success: boolean; error?: string } {
  if (runningPlugins.has(manifest.id)) {
    return { success: false, error: "Plugin already running" };
  }

  if (!manifest.verified) {
    return { success: false, error: "Plugin not verified — cannot load unverified code" };
  }

  // Grant only the declared permissions
  permissionManager.grantPermissions(manifest.id, manifest.permissions);

  let runtime: Worker | HTMLIFrameElement;
  if (manifest.type === "worker") {
    runtime = createWorkerSandbox(manifest);
  } else {
    runtime = createIframeSandbox(manifest);
  }

  // Message handler — validates every action from the plugin
  const messageHandler = (e: MessageEvent) => {
    const msg = e.data as PluginMessage;
    if (!msg || msg.pluginId !== manifest.id) return;

    if (msg.type === "request") {
      const validation = permissionManager.validateAction(manifest.id, msg.action);
      if (!validation.allowed) {
        console.warn(`[Sandbox] Blocked: ${validation.reason}`);
        // Send denial response
        const response: PluginMessage = {
          type: "response",
          action: msg.action,
          payload: { error: validation.reason, denied: true },
          requestId: msg.requestId,
          pluginId: manifest.id,
        };
        if (runtime instanceof Worker) {
          runtime.postMessage(response);
        } else {
          runtime.contentWindow?.postMessage(response, "*");
        }
        return;
      }

      // Process approved action (extensible handler)
      handleApprovedAction(manifest.id, msg);
    }
  };

  if (runtime instanceof Worker) {
    runtime.addEventListener("message", messageHandler);
  } else {
    window.addEventListener("message", messageHandler);
  }

  runningPlugins.set(manifest.id, {
    manifest,
    runtime,
    grantedPermissions: new Set(manifest.permissions),
    messageHandler,
  });

  return { success: true };
}

/**
 * Unload a plugin — terminate sandbox and revoke all permissions.
 */
export function unloadPlugin(pluginId: string): void {
  const plugin = runningPlugins.get(pluginId);
  if (!plugin) return;

  if (plugin.runtime instanceof Worker) {
    plugin.runtime.removeEventListener("message", plugin.messageHandler);
    plugin.runtime.terminate();
  } else {
    window.removeEventListener("message", plugin.messageHandler);
    plugin.runtime.remove();
  }

  permissionManager.revokeAll(pluginId);
  runningPlugins.delete(pluginId);
}

/**
 * Get all running plugins and their permissions.
 */
export function getRunningPlugins(): Array<{
  id: string;
  name: string;
  permissions: PermissionScope[];
  type: "worker" | "iframe";
}> {
  return Array.from(runningPlugins.values()).map((p) => ({
    id: p.manifest.id,
    name: p.manifest.name,
    permissions: Array.from(p.grantedPermissions),
    type: p.manifest.type,
  }));
}

/**
 * Unload all plugins.
 */
export function unloadAllPlugins(): void {
  for (const id of runningPlugins.keys()) {
    unloadPlugin(id);
  }
}

// ─── Action Handler (extensible) ───

function handleApprovedAction(pluginId: string, msg: PluginMessage): void {
  // Future: route to data layer, UI renderer, etc.
  // For now, log approved actions
  console.log(`[Sandbox] Approved action from "${pluginId}":`, msg.action, msg.payload);
}
