/**
 * Executor Engine — Executes validated JSON Actions on virtual project state.
 * Supports streaming/chunking for large files & memory cleanup.
 * Never modifies factory code without explicit user approval.
 */

import { appendEvent, EventType } from "@/lib/event-store";
import type { FactoryAction, ValidatedAction, RiskLevel } from "./action-schema";

// ─── Types ───

export interface ExecutionResult {
  actionId: string;
  action: FactoryAction;
  status: "success" | "failed" | "skipped" | "pending_approval";
  message: string;
  timestamp: string;
  duration: number;
}

export interface ProjectFileSystem {
  files: Map<string, ProjectFile>;
}

export interface ProjectFile {
  path: string;
  content: string;
  encoding: "utf-8" | "base64";
  size: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Chunk size for large file processing ───
const CHUNK_SIZE = 64 * 1024; // 64KB chunks

// ─── Virtual File System ───

let projectFS: ProjectFileSystem = { files: new Map() };

export function getProjectFS(): ProjectFileSystem {
  return projectFS;
}

export function resetProjectFS(): void {
  projectFS = { files: new Map() };
}

export function loadProjectFS(files: Record<string, string>): void {
  projectFS = { files: new Map() };
  const now = new Date().toISOString();
  for (const [path, content] of Object.entries(files)) {
    projectFS.files.set(path, {
      path,
      content,
      encoding: "utf-8",
      size: new Blob([content]).size,
      createdAt: now,
      updatedAt: now,
    });
  }
}

// ─── Core Executor ───

export async function executeAction(
  validated: ValidatedAction,
  onProgress?: (msg: string) => void
): Promise<ExecutionResult> {
  const startTime = performance.now();
  const actionId = crypto.randomUUID();

  if (validated.requiresApproval) {
    return {
      actionId,
      action: validated.action,
      status: "pending_approval",
      message: `⏳ بانتظار الموافقة: ${validated.description}`,
      timestamp: new Date().toISOString(),
      duration: 0,
    };
  }

  try {
    const result = await runAction(validated.action, onProgress);
    const duration = performance.now() - startTime;

    // Log to event journal
    await appendEvent(EventType.USER_ACTION_LOGGED, {
      actionId,
      action: validated.action.action,
      path: "path" in validated.action ? validated.action.path : undefined,
      status: "success",
      duration,
    }, {
      entity_type: "executor_log",
      entity_id: actionId,
    });

    return {
      actionId,
      action: validated.action,
      status: "success",
      message: result,
      timestamp: new Date().toISOString(),
      duration,
    };
  } catch (err) {
    const duration = performance.now() - startTime;
    return {
      actionId,
      action: validated.action,
      status: "failed",
      message: `❌ ${(err as Error).message}`,
      timestamp: new Date().toISOString(),
      duration,
    };
  }
}

// ─── Execute a batch with approval filtering ───

export async function executeBatch(
  actions: ValidatedAction[],
  approvedIds?: Set<number>,
  onProgress?: (idx: number, msg: string) => void,
): Promise<ExecutionResult[]> {
  const results: ExecutionResult[] = [];

  for (let i = 0; i < actions.length; i++) {
    const va = actions[i];

    // If approval required but not in approved set, mark pending
    if (va.requiresApproval && (!approvedIds || !approvedIds.has(i))) {
      results.push({
        actionId: crypto.randomUUID(),
        action: va.action,
        status: "pending_approval",
        message: `⏳ ${va.description}`,
        timestamp: new Date().toISOString(),
        duration: 0,
      });
      continue;
    }

    onProgress?.(i, `جاري تنفيذ: ${va.description}`);
    const result = await executeAction(
      { ...va, requiresApproval: false },
      (msg) => onProgress?.(i, msg),
    );
    results.push(result);

    // Memory cleanup after each action
    if (typeof globalThis.gc === "function") globalThis.gc();
  }

  return results;
}

// ─── Action Runners ───

async function runAction(
  action: FactoryAction,
  onProgress?: (msg: string) => void,
): Promise<string> {
  switch (action.action) {
    case "create_file":
      return createFile(action.path, action.content, action.encoding, onProgress);
    case "edit_file":
      return editFile(action.path, action.search, action.replace);
    case "delete_file":
      return deleteFile(action.path, action.recursive);
    case "rename_file":
      return renameFile(action.path, action.newPath);
    case "append_file":
      return appendFile(action.path, action.content, onProgress);
    case "shell_cmd":
      return simulateShell(action.command);
    case "install_dep":
      return simulateInstall(action.packages, action.dev);
  }
}

// ─── File Operations (with chunking for large files) ───

function createFile(
  path: string,
  content: string,
  encoding: "utf-8" | "base64",
  onProgress?: (msg: string) => void,
): string {
  const size = new Blob([content]).size;
  const now = new Date().toISOString();

  // Chunked processing for large content
  if (size > CHUNK_SIZE) {
    let processed = 0;
    const totalChunks = Math.ceil(content.length / CHUNK_SIZE);
    let assembled = "";
    
    for (let i = 0; i < totalChunks; i++) {
      const chunk = content.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      assembled += chunk;
      processed++;
      onProgress?.(`جزء ${processed}/${totalChunks} — ${path}`);
    }

    projectFS.files.set(path, {
      path, content: assembled, encoding, size, createdAt: now, updatedAt: now,
    });
  } else {
    projectFS.files.set(path, {
      path, content, encoding, size, createdAt: now, updatedAt: now,
    });
  }

  return `✅ تم إنشاء: ${path} (${formatSize(size)})`;
}

function editFile(path: string, search: string, replace: string): string {
  const file = projectFS.files.get(path);
  if (!file) throw new Error(`الملف غير موجود: ${path}`);
  if (!file.content.includes(search)) {
    throw new Error(`النص المطلوب غير موجود في: ${path}`);
  }

  file.content = file.content.replace(search, replace);
  file.size = new Blob([file.content]).size;
  file.updatedAt = new Date().toISOString();

  return `✅ تم تعديل: ${path}`;
}

function deleteFile(path: string, recursive: boolean): string {
  if (recursive) {
    const prefix = path.endsWith("/") ? path : path + "/";
    let count = 0;
    for (const key of projectFS.files.keys()) {
      if (key.startsWith(prefix) || key === path) {
        projectFS.files.delete(key);
        count++;
      }
    }
    return `✅ تم حذف ${count} ملف(ات) من: ${path}`;
  }

  if (!projectFS.files.has(path)) throw new Error(`الملف غير موجود: ${path}`);
  projectFS.files.delete(path);
  return `✅ تم حذف: ${path}`;
}

function renameFile(oldPath: string, newPath: string): string {
  const file = projectFS.files.get(oldPath);
  if (!file) throw new Error(`الملف غير موجود: ${oldPath}`);

  projectFS.files.delete(oldPath);
  file.path = newPath;
  file.updatedAt = new Date().toISOString();
  projectFS.files.set(newPath, file);

  return `✅ تم نقل: ${oldPath} → ${newPath}`;
}

function appendFile(
  path: string,
  content: string,
  onProgress?: (msg: string) => void,
): string {
  const file = projectFS.files.get(path);
  if (!file) {
    // Create if not exists
    return createFile(path, content, "utf-8", onProgress);
  }

  file.content += content;
  file.size = new Blob([file.content]).size;
  file.updatedAt = new Date().toISOString();

  return `✅ تم الإلحاق بـ: ${path}`;
}

// ─── Simulated Shell/Install (sandbox-safe) ───

function simulateShell(command: string): string {
  // In browser environment, shell commands are logged but not executed
  return `📋 أمر مسجل للتنفيذ: ${command}`;
}

function simulateInstall(packages: string[], dev: boolean): string {
  return `📦 مسجل للتثبيت${dev ? " (dev)" : ""}: ${packages.join(", ")}`;
}

// ─── Utilities ───

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
