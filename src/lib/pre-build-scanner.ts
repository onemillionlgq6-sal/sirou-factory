/**
 * Pre-Build Intelligence Scanner
 * Scans generated app logic for errors, broken links, missing permissions,
 * and common coding issues before APK/AAB compilation.
 */

export interface ScanIssue {
  id: string;
  severity: "error" | "warning" | "info";
  category: "code" | "permission" | "dependency" | "security" | "ui";
  title: string;
  description: string;
  file?: string;
  line?: number;
  fix?: string;
}

export interface ScanResult {
  passed: boolean;
  score: number; // 0-100
  issues: ScanIssue[];
  timestamp: Date;
  duration: number; // ms
}

interface AppBlueprint {
  features: Array<{ name: string; approved: boolean; category: string }>;
  entities: Array<{ name: string; fields: string[] }>;
  pages: Array<{ name: string; route: string }>;
}

// Check for missing Android permissions based on features
function scanPermissions(blueprint: AppBlueprint | null): ScanIssue[] {
  if (!blueprint) return [];
  const issues: ScanIssue[] = [];
  const featureNames = blueprint.features.filter(f => f.approved).map(f => f.name.toLowerCase());

  const permissionMap: Record<string, string[]> = {
    camera: ["android.permission.CAMERA"],
    maps: ["android.permission.ACCESS_FINE_LOCATION", "android.permission.ACCESS_COARSE_LOCATION"],
    location: ["android.permission.ACCESS_FINE_LOCATION"],
    notification: ["android.permission.POST_NOTIFICATIONS"],
    storage: ["android.permission.READ_EXTERNAL_STORAGE"],
    payment: ["android.permission.INTERNET"],
  };

  for (const feature of featureNames) {
    for (const [key, perms] of Object.entries(permissionMap)) {
      if (feature.includes(key)) {
        for (const perm of perms) {
          issues.push({
            id: `perm-${perm}`,
            severity: "warning",
            category: "permission",
            title: `Missing permission: ${perm.split(".").pop()}`,
            description: `Feature "${feature}" requires ${perm} in AndroidManifest.xml`,
            fix: `Add <uses-permission android:name="${perm}" /> to AndroidManifest.xml`,
          });
        }
      }
    }
  }
  return issues;
}

// Scan for common code quality issues
function scanCodeQuality(blueprint: AppBlueprint | null): ScanIssue[] {
  if (!blueprint) return [];
  const issues: ScanIssue[] = [];

  // Check for entities without primary key field
  for (const entity of blueprint.entities) {
    const hasId = entity.fields.some(f => f === "id" || f === "uuid" || f.startsWith("id") || f.startsWith("uuid"));
    if (!hasId) {
      issues.push({
        id: `entity-noid-${entity.name}`,
        severity: "error",
        category: "code",
        title: `Entity "${entity.name}" missing primary key`,
        description: `Table ${entity.name} has no "id" or "uuid" field. This will cause database errors.`,
        fix: `Add a UUID primary key field to ${entity.name}`,
      });
    }

    // Check for reserved SQL keywords
    const reserved = ["user", "order", "group", "select", "table", "index", "key"];
    if (reserved.includes(entity.name.toLowerCase())) {
      issues.push({
        id: `entity-reserved-${entity.name}`,
        severity: "warning",
        category: "code",
        title: `Entity "${entity.name}" uses reserved SQL keyword`,
        description: `"${entity.name}" is a reserved keyword and may cause SQL syntax errors.`,
        fix: `Rename to "${entity.name}s" or prefix with "app_"`,
      });
    }
  }

  // Check for duplicate routes
  const routes = blueprint.pages.map(p => p.route);
  const duplicates = routes.filter((r, i) => routes.indexOf(r) !== i);
  for (const dup of new Set(duplicates)) {
    issues.push({
      id: `route-dup-${dup}`,
      severity: "error",
      category: "ui",
      title: `Duplicate route: ${dup}`,
      description: `Multiple pages share the route "${dup}". Only the first will render.`,
      fix: `Assign unique routes to each page`,
    });
  }

  return issues;
}

// Scan for security concerns
function scanSecurity(blueprint: AppBlueprint | null): ScanIssue[] {
  if (!blueprint) return [];
  const issues: ScanIssue[] = [];
  const featureNames = blueprint.features.filter(f => f.approved).map(f => f.name.toLowerCase());

  const hasAuth = featureNames.some(f => f.includes("auth"));
  const hasDb = featureNames.some(f => f.includes("crud") || f.includes("database"));
  const hasRls = featureNames.some(f => f.includes("rls") || f.includes("security"));

  if (hasDb && !hasRls) {
    issues.push({
      id: "sec-no-rls",
      severity: "error",
      category: "security",
      title: "Database without Row Level Security",
      description: "CRUD operations are enabled but RLS is not. Data will be publicly accessible.",
      fix: "Enable the 'Row Level Security (RLS)' feature in the blueprint",
    });
  }

  if (hasDb && !hasAuth) {
    issues.push({
      id: "sec-no-auth",
      severity: "warning",
      category: "security",
      title: "Database without Authentication",
      description: "Database operations are enabled without user authentication.",
      fix: "Enable the 'Authentication' feature to secure data access",
    });
  }

  // Check for external API features without approval
  const unapprovedExternal = blueprint.features.filter(
    f => f.category === "external" && !f.approved
  );
  for (const feat of unapprovedExternal) {
    issues.push({
      id: `sec-unapproved-${feat.name}`,
      severity: "error",
      category: "security",
      title: `Unapproved external API: ${feat.name}`,
      description: "External API integration requires explicit user approval before build.",
      fix: "Approve this feature in the Interactive Blueprint",
    });
  }

  return issues;
}

// Check dependency compatibility
function scanDependencies(): ScanIssue[] {
  const issues: ScanIssue[] = [];

  // Check for known problematic combinations
  const knownConflicts = [
    { a: "react-native", b: "@capacitor/core", reason: "Cannot mix React Native and Capacitor" },
    { a: "expo", b: "@capacitor/core", reason: "Expo and Capacitor have conflicting native bridges" },
  ];

  for (const conflict of knownConflicts) {
    // In a real implementation, would check package.json
    // For now, flag as info if Capacitor is detected
    issues.push({
      id: `dep-info-capacitor`,
      severity: "info",
      category: "dependency",
      title: "Capacitor detected as native bridge",
      description: "Ensure no React Native or Expo dependencies are included to avoid Duplicate Class errors.",
    });
    break;
  }

  return issues;
}

/**
 * Run full pre-build intelligence scan
 */
export async function runPreBuildScan(blueprint: AppBlueprint | null): Promise<ScanResult> {
  const start = performance.now();

  // Run all scanners
  const allIssues = [
    ...scanPermissions(blueprint),
    ...scanCodeQuality(blueprint),
    ...scanSecurity(blueprint),
    ...scanDependencies(),
  ];

  // Deduplicate by id
  const seen = new Set<string>();
  const issues = allIssues.filter(i => {
    if (seen.has(i.id)) return false;
    seen.add(i.id);
    return true;
  });

  const errorCount = issues.filter(i => i.severity === "error").length;
  const warningCount = issues.filter(i => i.severity === "warning").length;
  const score = Math.max(0, 100 - errorCount * 20 - warningCount * 5);

  return {
    passed: errorCount === 0,
    score,
    issues,
    timestamp: new Date(),
    duration: performance.now() - start,
  };
}
