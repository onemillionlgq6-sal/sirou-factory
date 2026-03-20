/**
 * Google Play Policy Guard
 * Automated checklist verifying app metadata, privacy policy,
 * and permission rationales against Google Play requirements.
 */

export interface PolicyCheck {
  id: string;
  category: "metadata" | "privacy" | "permissions" | "content" | "security";
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  passed: boolean;
  severity: "critical" | "warning" | "info";
  fix?: string;
  fixAr?: string;
}

export interface PolicyReport {
  passed: boolean;
  score: number;
  checks: PolicyCheck[];
  timestamp: Date;
}

interface AppConfig {
  appName: string;
  features: Array<{ name: string; approved: boolean; category: string }>;
  hasPrivacyPolicy: boolean;
  privacyPolicyUrl: string;
  hasTermsOfService: boolean;
  targetSdk: number;
  minSdk: number;
  permissionsUsed: string[];
  permissionRationales: Record<string, string>;
  appDescription: string;
  appCategory: string;
  contentRating: string;
}

export function runPolicyCheck(config: Partial<AppConfig>): PolicyReport {
  const checks: PolicyCheck[] = [];

  // 1. App Name
  checks.push({
    id: "meta-name",
    category: "metadata",
    title: "App name length",
    titleAr: "طول اسم التطبيق",
    description: "App name must be ≤30 characters",
    descriptionAr: "يجب ألا يتجاوز اسم التطبيق 30 حرفًا",
    passed: (config.appName?.length || 0) <= 30 && (config.appName?.length || 0) > 0,
    severity: "critical",
    fix: "Shorten app name to 30 characters or less",
    fixAr: "قصّر اسم التطبيق إلى 30 حرفًا أو أقل",
  });

  // 2. App Description
  checks.push({
    id: "meta-desc",
    category: "metadata",
    title: "App description provided",
    titleAr: "وصف التطبيق",
    description: "Short description (≤80 chars) is required",
    descriptionAr: "الوصف القصير (≤80 حرفًا) مطلوب",
    passed: (config.appDescription?.length || 0) >= 10 && (config.appDescription?.length || 0) <= 80,
    severity: "critical",
    fix: "Add a concise app description between 10-80 characters",
    fixAr: "أضف وصفًا موجزًا بين 10-80 حرفًا",
  });

  // 3. Target SDK
  checks.push({
    id: "sdk-target",
    category: "security",
    title: "Target SDK ≥ 34",
    titleAr: "SDK المستهدف ≥ 34",
    description: "Google Play requires targetSdkVersion 34+ for new apps (2024+)",
    descriptionAr: "يتطلب Google Play إصدار SDK 34+ للتطبيقات الجديدة",
    passed: (config.targetSdk || 0) >= 34,
    severity: "critical",
    fix: "Set targetSdkVersion to 34 or higher in build.gradle",
    fixAr: "اضبط targetSdkVersion إلى 34 أو أعلى",
  });

  // 4. Privacy Policy
  checks.push({
    id: "privacy-policy",
    category: "privacy",
    title: "Privacy Policy linked",
    titleAr: "سياسة الخصوصية مرتبطة",
    description: "Required for apps that access personal/sensitive data",
    descriptionAr: "مطلوبة للتطبيقات التي تصل إلى بيانات شخصية أو حساسة",
    passed: !!config.hasPrivacyPolicy && !!config.privacyPolicyUrl,
    severity: "critical",
    fix: "Add a privacy policy URL in app settings",
    fixAr: "أضف رابط سياسة الخصوصية في إعدادات التطبيق",
  });

  // 5. Terms of Service
  checks.push({
    id: "tos",
    category: "privacy",
    title: "Terms of Service available",
    titleAr: "شروط الخدمة متاحة",
    description: "Recommended for all published apps",
    descriptionAr: "موصى بها لجميع التطبيقات المنشورة",
    passed: !!config.hasTermsOfService,
    severity: "warning",
  });

  // 6. Permission Rationales
  const permsUsed = config.permissionsUsed || [];
  const rationales = config.permissionRationales || {};
  const sensitivePerms = ["CAMERA", "LOCATION", "MICROPHONE", "CONTACTS", "PHONE", "STORAGE"];

  for (const perm of permsUsed) {
    const isSensitive = sensitivePerms.some(s => perm.toUpperCase().includes(s));
    if (isSensitive) {
      checks.push({
        id: `perm-rationale-${perm}`,
        category: "permissions",
        title: `Rationale for ${perm.split(".").pop()}`,
        titleAr: `مبرر لـ ${perm.split(".").pop()}`,
        description: "Sensitive permissions require user-facing rationale",
        descriptionAr: "الأذونات الحساسة تتطلب مبررًا واضحًا للمستخدم",
        passed: !!rationales[perm],
        severity: "critical",
        fix: `Add a user-facing rationale explaining why ${perm.split(".").pop()} is needed`,
        fixAr: `أضف مبررًا يوضح سبب الحاجة إلى ${perm.split(".").pop()}`,
      });
    }
  }

  // 7. Content Rating
  checks.push({
    id: "content-rating",
    category: "content",
    title: "Content rating declared",
    titleAr: "تصنيف المحتوى محدد",
    description: "All apps must complete the content rating questionnaire",
    descriptionAr: "يجب إكمال استبيان تصنيف المحتوى لجميع التطبيقات",
    passed: !!config.contentRating,
    severity: "critical",
  });

  // 8. Data Safety Section
  const usesNetwork = config.features?.some(f =>
    f.name.toLowerCase().includes("api") || f.name.toLowerCase().includes("auth")
  );
  checks.push({
    id: "data-safety",
    category: "privacy",
    title: "Data Safety section ready",
    titleAr: "قسم أمان البيانات جاهز",
    description: "Apps must declare data collection and sharing practices",
    descriptionAr: "يجب الإفصاح عن ممارسات جمع البيانات ومشاركتها",
    passed: !usesNetwork, // Passes if no network features, otherwise needs manual setup
    severity: usesNetwork ? "critical" : "info",
    fix: "Complete the Data Safety form in Google Play Console",
    fixAr: "أكمل نموذج أمان البيانات في Google Play Console",
  });

  // 9. Min SDK
  checks.push({
    id: "sdk-min",
    category: "security",
    title: "Minimum SDK ≥ 24",
    titleAr: "الحد الأدنى لـ SDK ≥ 24",
    description: "Recommended minSdkVersion for modern security APIs",
    descriptionAr: "الحد الأدنى الموصى به لأمان واجهات البرمجة الحديثة",
    passed: (config.minSdk || 0) >= 24,
    severity: "warning",
  });

  // 10. No unapproved external features
  const unapproved = config.features?.filter(f => f.category === "external" && !f.approved) || [];
  checks.push({
    id: "no-unapproved",
    category: "security",
    title: "All external features approved",
    titleAr: "جميع الميزات الخارجية معتمدة",
    description: "External integrations must be explicitly approved",
    descriptionAr: "يجب الموافقة صراحة على التكاملات الخارجية",
    passed: unapproved.length === 0,
    severity: "critical",
  });

  const criticalFails = checks.filter(c => c.severity === "critical" && !c.passed).length;
  const warningFails = checks.filter(c => c.severity === "warning" && !c.passed).length;
  const score = Math.max(0, 100 - criticalFails * 20 - warningFails * 5);

  return {
    passed: criticalFails === 0,
    score,
    checks,
    timestamp: new Date(),
  };
}
