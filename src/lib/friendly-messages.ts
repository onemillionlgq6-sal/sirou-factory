/**
 * Friendly Message Translator
 * Converts technical action names, paths, and errors into human-readable text.
 * Supports Arabic and English via the i18n system.
 */

type Lang = "en" | "ar";

/** Map technical action names to friendly labels */
const actionLabels: Record<string, Record<Lang, string>> = {
  create_file:  { en: "Creating",        ar: "أُنشئ" },
  edit_file:    { en: "Updating",         ar: "أُحدِّث" },
  delete_file:  { en: "Removing",         ar: "أحذف" },
  append_file:  { en: "Adding to",        ar: "أضيف إلى" },
  write_file:   { en: "Writing",          ar: "أكتب" },
  update_file:  { en: "Updating",         ar: "أُحدِّث" },
  validation:   { en: "Checking",         ar: "أتحقق" },
  "auto-route": { en: "Setting up navigation", ar: "أُعِدّ التنقل" },
  "manual-exec":{ en: "Running",          ar: "أُنفِّذ" },
  "ai-error":   { en: "Issue detected",   ar: "مشكلة" },
  system:       { en: "Preparing",        ar: "أُجهِّز" },
};

/** Map file paths/extensions to friendly descriptions */
function describePath(path: string, lang: Lang): string {
  if (!path) return "";

  // Pages
  if (path.includes("src/pages/")) {
    const name = path.split("/").pop()?.replace(/\.(tsx|jsx|ts|js)$/, "") || "";
    return lang === "ar" ? `صفحة "${name}"` : `"${name}" page`;
  }
  // Components
  if (path.includes("src/components/")) {
    const name = path.split("/").pop()?.replace(/\.(tsx|jsx|ts|js)$/, "") || "";
    return lang === "ar" ? `عنصر "${name}"` : `"${name}" component`;
  }
  // Styles
  if (path.endsWith(".css")) {
    return lang === "ar" ? "التصميم والألوان" : "Styles & colors";
  }
  // Types
  if (path.includes("types") || path.endsWith(".d.ts")) {
    return lang === "ar" ? "البنية الأساسية" : "Data structure";
  }
  // Config
  if (path.includes("config") || path.includes("package.json") || path.includes("tsconfig")) {
    return lang === "ar" ? "إعدادات المشروع" : "Project settings";
  }
  // App.tsx / main entry
  if (path.includes("App.tsx") || path.includes("main.tsx")) {
    return lang === "ar" ? "التطبيق الرئيسي" : "Main app";
  }
  // Lib / utils
  if (path.includes("src/lib/") || path.includes("src/utils/")) {
    const name = path.split("/").pop()?.replace(/\.(tsx|jsx|ts|js)$/, "") || "";
    return lang === "ar" ? `وظيفة "${name}"` : `"${name}" feature`;
  }
  // Hooks
  if (path.includes("src/hooks/")) {
    return lang === "ar" ? "ربط ذكي" : "Smart hook";
  }
  // Generic
  const fileName = path.split("/").pop() || path;
  return fileName;
}

/** Build step descriptions - hide technical details */
export interface FriendlyStep {
  label: string;
  emoji: string;
}

const buildStepPatterns: Array<{ test: RegExp; emoji: string; label: Record<Lang, string> }> = [
  { test: /structure|scaffold/i,    emoji: "📐", label: { en: "Setting up the foundation", ar: "أُجهِّز الأساس" } },
  { test: /data|storage|database/i, emoji: "🗄️", label: { en: "Preparing data storage", ar: "أُجهِّز تخزين البيانات" } },
  { test: /design|theme|css|style/i,emoji: "🎨", label: { en: "Applying beautiful design", ar: "أُطبِّق التصميم الجميل" } },
  { test: /native|hardware|bridge/i,emoji: "📱", label: { en: "Connecting device features", ar: "أربط ميزات الجهاز" } },
  { test: /animation|motion|transition/i, emoji: "✨", label: { en: "Adding smooth animations", ar: "أضيف حركات سلسة" } },
  { test: /encrypt|security|aes/i,  emoji: "🔐", label: { en: "Securing your app", ar: "أُأمِّن تطبيقك" } },
  { test: /permission|admin|role/i, emoji: "🛡️", label: { en: "Setting up permissions", ar: "أُعِدّ الصلاحيات" } },
  { test: /performance|lazy|split/i,emoji: "⚡", label: { en: "Optimizing speed", ar: "أُحسِّن السرعة" } },
  { test: /form|validation|error/i, emoji: "📋", label: { en: "Adding smart forms", ar: "أضيف نماذج ذكية" } },
  { test: /splash|icon|image/i,     emoji: "🖼️", label: { en: "Creating app icon", ar: "أُنشئ أيقونة التطبيق" } },
  { test: /audit|scan|check/i,      emoji: "🔍", label: { en: "Final quality check", ar: "فحص الجودة النهائي" } },
  { test: /route|navigation|page/i, emoji: "🧭", label: { en: "Setting up navigation", ar: "أُعِدّ التنقل" } },
  { test: /auth|login|signup/i,     emoji: "🔑", label: { en: "Adding login system", ar: "أضيف نظام الدخول" } },
  { test: /chat|message|realtime/i, emoji: "💬", label: { en: "Building chat feature", ar: "أبني ميزة الدردشة" } },
  { test: /payment|stripe|billing/i,emoji: "💳", label: { en: "Setting up payments", ar: "أُعِدّ المدفوعات" } },
];

/** Convert a build step string to friendly version */
export function friendlyBuildStep(step: string, lang: Lang): FriendlyStep {
  for (const pattern of buildStepPatterns) {
    if (pattern.test.test(step)) {
      return { emoji: pattern.emoji, label: pattern.label[lang] };
    }
  }
  // Extract feature name from "Building: FeatureName"
  const featureMatch = step.match(/Building:\s*(.+)/i) || step.match(/⚙️\s*Building:\s*(.+)/);
  if (featureMatch) {
    const name = featureMatch[1].trim();
    return {
      emoji: "⚙️",
      label: lang === "ar" ? `أبني ميزة "${name}"` : `Building "${name}" feature`,
    };
  }
  return { emoji: "⏳", label: lang === "ar" ? "أعمل على التجهيز..." : "Working on setup..." };
}

/** Convert technical log entry to friendly message */
export function friendlyLogMessage(
  action: string,
  path: string | undefined,
  message: string,
  status: "success" | "error" | "warning",
  lang: Lang
): string {
  const actionLabel = actionLabels[action]?.[lang] || (lang === "ar" ? "أُنفِّذ" : "Processing");
  const pathDesc = path ? describePath(path, lang) : "";

  if (status === "success") {
    if (pathDesc) {
      return lang === "ar" ? `✅ تم — ${pathDesc}` : `✅ Done — ${pathDesc}`;
    }
    return lang === "ar" ? "✅ تم بنجاح" : "✅ Done";
  }

  if (status === "error") {
    // Hide technical error details
    if (message.includes("JSON") || message.includes("parse") || message.includes("syntax")) {
      return lang === "ar" ? "⏳ أُحاول مرة أخرى..." : "⏳ Retrying...";
    }
    if (message.includes("truncat") || message.includes("مقطوع")) {
      return lang === "ar" ? "⏳ أُكمل التجهيز..." : "⏳ Completing setup...";
    }
    return lang === "ar" ? "⚠️ حدثت مشكلة، أُحاول حلها..." : "⚠️ Issue detected, fixing...";
  }

  // Warning / in-progress
  if (pathDesc) {
    return `${actionLabel} ${pathDesc}...`;
  }
  return lang === "ar" ? "⏳ جارٍ العمل..." : "⏳ Working...";
}

/** Convert AI response summary to friendly chat message */
export function friendlyExecutionSummary(
  successCount: number,
  failCount: number,
  totalSteps: number,
  lang: Lang
): string {
  if (failCount === 0) {
    return lang === "ar"
      ? `🎉 تم! تطبيقك جاهز — ${successCount} خطوة اكتملت بنجاح`
      : `🎉 Done! Your app is ready — ${successCount} steps completed`;
  }
  return lang === "ar"
    ? `✅ تم ${successCount} من ${totalSteps} خطوة — أُكمل الباقي...`
    : `✅ ${successCount} of ${totalSteps} steps done — finishing up...`;
}

/** Friendly "compiling" status text */
export function friendlyStatus(phase: "thinking" | "building" | "done" | "error", lang: Lang): string {
  const map: Record<string, Record<Lang, string>> = {
    thinking: { en: "Thinking...", ar: "أُفكِّر..." },
    building: { en: "Building your app...", ar: "أبني تطبيقك..." },
    done:     { en: "All done!", ar: "انتهى!" },
    error:    { en: "Let me try again...", ar: "أُحاول مرة أخرى..." },
  };
  return map[phase]?.[lang] || "";
}

/** Convert technical toast messages to friendly ones */
export function friendlyToast(technicalMsg: string, lang: Lang): string {
  if (technicalMsg.includes("JSON") && technicalMsg.includes("صالح")) {
    return lang === "ar" ? "⏳ أُعالج الطلب..." : "⏳ Processing request...";
  }
  if (technicalMsg.includes("أمر صالح") || technicalMsg.includes("valid")) {
    const countMatch = technicalMsg.match(/(\d+)/);
    const count = countMatch ? countMatch[1] : "";
    return lang === "ar"
      ? `⚡ ${count} خطوة جاهزة للتنفيذ`
      : `⚡ ${count} steps ready to go`;
  }
  if (technicalMsg.includes("تنفيذ") || technicalMsg.includes("executed")) {
    const countMatch = technicalMsg.match(/(\d+)/);
    const count = countMatch ? countMatch[1] : "";
    return lang === "ar"
      ? `✅ تم تنفيذ ${count} خطوة`
      : `✅ ${count} steps completed`;
  }
  return technicalMsg;
}

/** Build a progress bar string */
export function progressBar(current: number, total: number): string {
  const filled = Math.round((current / total) * 10);
  const empty = 10 - filled;
  return `[${"█".repeat(filled)}${"░".repeat(empty)}]`;
}

/** Get step label like "الخطوة 2 من 4" */
export function stepLabel(current: number, total: number, lang: Lang): string {
  return lang === "ar"
    ? `الخطوة ${current} من ${total}`
    : `Step ${current} of ${total}`;
}
