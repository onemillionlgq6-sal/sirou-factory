/**
 * JSON Action Schema — Zod-validated action definitions
 * Converts AI suggestions into structured, executable commands.
 */

import { z } from "zod";

// ─── Risk Levels ───

export type RiskLevel = "low" | "medium" | "high" | "critical";

// ─── Action Types ───

export const CreateFileActionSchema = z.object({
  action: z.literal("create_file"),
  path: z.string().min(1).max(500),
  content: z.string(),
  encoding: z.enum(["utf-8", "base64"]).default("utf-8"),
});

export const EditFileActionSchema = z.object({
  action: z.literal("edit_file"),
  path: z.string().min(1).max(500),
  search: z.string().min(1),
  replace: z.string(),
});

export const DeleteFileActionSchema = z.object({
  action: z.literal("delete_file"),
  path: z.string().min(1).max(500),
  recursive: z.boolean().default(false),
});

export const RenameFileActionSchema = z.object({
  action: z.literal("rename_file"),
  path: z.string().min(1).max(500),
  newPath: z.string().min(1).max(500),
});

export const ShellCommandActionSchema = z.object({
  action: z.literal("shell_cmd"),
  command: z.string().min(1).max(2000),
  cwd: z.string().optional(),
  timeout: z.number().min(1000).max(120000).default(30000),
});

export const InstallDependencyActionSchema = z.object({
  action: z.literal("install_dep"),
  packages: z.array(z.string().min(1)).min(1),
  dev: z.boolean().default(false),
});

export const AppendFileActionSchema = z.object({
  action: z.literal("append_file"),
  path: z.string().min(1).max(500),
  content: z.string(),
});

// ─── Union Schema ───

export const ActionSchema = z.discriminatedUnion("action", [
  CreateFileActionSchema,
  EditFileActionSchema,
  DeleteFileActionSchema,
  RenameFileActionSchema,
  ShellCommandActionSchema,
  InstallDependencyActionSchema,
  AppendFileActionSchema,
]);

export type FactoryAction = z.infer<typeof ActionSchema>;

// ─── Batch Schema ───

export const ActionBatchSchema = z.object({
  description: z.string().optional(),
  actions: z.array(ActionSchema).min(1).max(50),
});

export type ActionBatch = z.infer<typeof ActionBatchSchema>;

// ─── Risk Classification ───

/** Paths considered dangerous to modify */
const FACTORY_PATHS = [
  "src/lib/executor/",
  "src/lib/event-store",
  "src/lib/event-crypto",
  "src/lib/crypto",
  "src/lib/build-guard",
  "src/lib/plugin-sandbox",
  "src/components/factory/",
  "src/pages/Index.tsx",
  "vite.config",
  "tsconfig",
  "package.json",
];

const DESTRUCTIVE_SHELL = [
  "rm -rf", "rm -r", "rmdir", "drop table", "drop database",
  "truncate", "format", "mkfs", "dd if=",
];

export function classifyRisk(action: FactoryAction): RiskLevel {
  // Shell commands
  if (action.action === "shell_cmd") {
    const cmd = action.command.toLowerCase();
    if (DESTRUCTIVE_SHELL.some(d => cmd.includes(d))) return "critical";
    return "high";
  }

  // Delete operations
  if (action.action === "delete_file") {
    if (action.recursive) return "critical";
    if (FACTORY_PATHS.some(p => action.path.includes(p))) return "critical";
    return "high";
  }

  // Factory path modifications
  const path = "path" in action ? action.path : "";
  if (path && FACTORY_PATHS.some(p => path.includes(p))) {
    return "critical";
  }

  // Edit/rename are medium
  if (action.action === "edit_file" || action.action === "rename_file") {
    return "medium";
  }

  // Create, append, install are low
  return "low";
}

// ─── Validation Helper ───

export interface ValidatedAction {
  action: FactoryAction;
  risk: RiskLevel;
  requiresApproval: boolean;
  description: string;
}

export function validateAndClassify(raw: unknown): ValidatedAction | { error: string } {
  const result = ActionSchema.safeParse(raw);
  if (!result.success) {
    return { error: result.error.issues.map(i => i.message).join("; ") };
  }

  const action = result.data;
  const risk = classifyRisk(action);
  const requiresApproval = risk === "high" || risk === "critical";

  return {
    action,
    risk,
    requiresApproval,
    description: describeAction(action),
  };
}

export function validateBatch(raw: unknown): { batch: ValidatedAction[]; errors: string[] } {
  const parsed = ActionBatchSchema.safeParse(raw);
  if (!parsed.success) {
    return { batch: [], errors: parsed.error.issues.map(i => i.message) };
  }

  const batch: ValidatedAction[] = [];
  const errors: string[] = [];

  for (const rawAction of parsed.data.actions) {
    const validated = validateAndClassify(rawAction);
    if ("error" in validated) {
      errors.push(validated.error);
    } else {
      batch.push(validated);
    }
  }

  return { batch, errors };
}

// ─── Human-Readable Descriptions ───

function describeAction(action: FactoryAction): string {
  switch (action.action) {
    case "create_file":
      return `إنشاء ملف: ${action.path}`;
    case "edit_file":
      return `تعديل ملف: ${action.path}`;
    case "delete_file":
      return `حذف ${action.recursive ? "مجلد" : "ملف"}: ${action.path}`;
    case "rename_file":
      return `إعادة تسمية: ${action.path} → ${action.newPath}`;
    case "shell_cmd":
      return `أمر: ${action.command.slice(0, 60)}${action.command.length > 60 ? "..." : ""}`;
    case "install_dep":
      return `تثبيت حزم: ${action.packages.join(", ")}`;
    case "append_file":
      return `إلحاق بملف: ${action.path}`;
  }
}
