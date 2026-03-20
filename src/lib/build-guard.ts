/**
 * Build Guard — Dependency & Conflict Validator
 * Checks for npm/Gradle compatibility issues before Android builds.
 * Prevents Duplicate Class errors, version mismatches, and Gradle sync failures.
 */

export interface BuildIssue {
  severity: "error" | "warning" | "info";
  category: "duplicate-class" | "version-mismatch" | "gradle-sync" | "sdk-compat" | "dependency";
  message: string;
  fix?: string;
}

export interface BuildValidationResult {
  passed: boolean;
  issues: BuildIssue[];
  timestamp: string;
}

// Known conflicting package pairs that cause Duplicate Class errors on Android
const KNOWN_CONFLICTS: Array<{ a: string; b: string; message: string }> = [
  { a: "@react-native-firebase/app", b: "firebase", message: "Duplicate Firebase classes — use only one Firebase SDK" },
  { a: "react-native-gesture-handler", b: "@capacitor/gesture", message: "Conflicting gesture handlers" },
  { a: "expo-camera", b: "@capacitor/camera", message: "Duplicate camera native modules" },
  { a: "expo-location", b: "@capacitor/geolocation", message: "Duplicate location native modules" },
  { a: "react-native-push-notification", b: "@capacitor/push-notifications", message: "Duplicate notification modules" },
];

// Packages that break Capacitor Android builds
const INCOMPATIBLE_WITH_CAPACITOR = [
  { pkg: "react-native", reason: "React Native is incompatible with Capacitor — choose one framework" },
  { pkg: "expo", reason: "Expo managed workflow conflicts with Capacitor native layer" },
  { pkg: "@ionic/react", reason: "Ionic Framework may conflict with custom Capacitor UI layer" },
];

// SDK version constraints
const SDK_REQUIREMENTS = {
  minCompileSdk: 34,
  minTargetSdk: 34,
  minMinSdk: 24,
  requiredJdk: 17,
};

/**
 * Validate dependencies for Android build compatibility
 */
export function validateDependencies(packageJson: {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}): BuildIssue[] {
  const issues: BuildIssue[] = [];
  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };
  const depNames = Object.keys(allDeps);

  // Check for known conflicting pairs
  for (const conflict of KNOWN_CONFLICTS) {
    if (depNames.includes(conflict.a) && depNames.includes(conflict.b)) {
      issues.push({
        severity: "error",
        category: "duplicate-class",
        message: conflict.message,
        fix: `Remove either "${conflict.a}" or "${conflict.b}" from dependencies`,
      });
    }
  }

  // Check for Capacitor-incompatible packages
  for (const incompat of INCOMPATIBLE_WITH_CAPACITOR) {
    if (depNames.includes(incompat.pkg)) {
      issues.push({
        severity: "error",
        category: "dependency",
        message: incompat.reason,
        fix: `Remove "${incompat.pkg}" — this project uses Capacitor`,
      });
    }
  }

  // Check Capacitor core/cli version alignment
  const capCore = allDeps["@capacitor/core"];
  const capCli = allDeps["@capacitor/cli"];
  if (capCore && capCli) {
    const coreMajor = extractMajor(capCore);
    const cliMajor = extractMajor(capCli);
    if (coreMajor !== cliMajor) {
      issues.push({
        severity: "error",
        category: "version-mismatch",
        message: `@capacitor/core (v${coreMajor}) and @capacitor/cli (v${cliMajor}) major versions must match`,
        fix: `Align both to the same major version`,
      });
    }
  }

  // Check for missing Capacitor core
  if (!depNames.includes("@capacitor/core")) {
    issues.push({
      severity: "warning",
      category: "dependency",
      message: "Missing @capacitor/core — required for native Android builds",
      fix: "Run: npm install @capacitor/core @capacitor/cli",
    });
  }

  return issues;
}

/**
 * Validate Android SDK configuration
 */
export function validateSdkConfig(config: {
  compileSdkVersion: number;
  targetSdkVersion: number;
  minSdkVersion: number;
}): BuildIssue[] {
  const issues: BuildIssue[] = [];

  if (config.compileSdkVersion < SDK_REQUIREMENTS.minCompileSdk) {
    issues.push({
      severity: "error",
      category: "sdk-compat",
      message: `compileSdkVersion ${config.compileSdkVersion} is below Play Store minimum (${SDK_REQUIREMENTS.minCompileSdk})`,
      fix: `Set compileSdkVersion to ${SDK_REQUIREMENTS.minCompileSdk} or higher`,
    });
  }

  if (config.targetSdkVersion < SDK_REQUIREMENTS.minTargetSdk) {
    issues.push({
      severity: "error",
      category: "sdk-compat",
      message: `targetSdkVersion ${config.targetSdkVersion} is below Play Store requirement (${SDK_REQUIREMENTS.minTargetSdk})`,
      fix: `Set targetSdkVersion to ${SDK_REQUIREMENTS.minTargetSdk} or higher`,
    });
  }

  if (config.minSdkVersion < SDK_REQUIREMENTS.minMinSdk) {
    issues.push({
      severity: "warning",
      category: "sdk-compat",
      message: `minSdkVersion ${config.minSdkVersion} is very low — consider raising to ${SDK_REQUIREMENTS.minMinSdk}`,
    });
  }

  if (config.targetSdkVersion > config.compileSdkVersion) {
    issues.push({
      severity: "error",
      category: "gradle-sync",
      message: "targetSdkVersion cannot exceed compileSdkVersion",
      fix: `Set compileSdkVersion >= targetSdkVersion`,
    });
  }

  return issues;
}

/**
 * Validate Gradle build configuration for common issues
 */
export function validateGradleConfig(buildGradle: string): BuildIssue[] {
  const issues: BuildIssue[] = [];

  // Check for deprecated configurations
  if (buildGradle.includes("compile ")) {
    issues.push({
      severity: "warning",
      category: "gradle-sync",
      message: "Deprecated 'compile' configuration found — use 'implementation' instead",
      fix: "Replace 'compile' with 'implementation' in build.gradle",
    });
  }

  // Check for JDK version
  if (buildGradle.includes("JavaVersion.VERSION_1_8") || buildGradle.includes("JavaVersion.VERSION_11")) {
    issues.push({
      severity: "warning",
      category: "gradle-sync",
      message: "JDK version should be 17+ for modern Android builds",
      fix: "Set sourceCompatibility and targetCompatibility to JavaVersion.VERSION_17",
    });
  }

  // Check for missing ProGuard in release
  if (buildGradle.includes("buildTypes") && !buildGradle.includes("proguardFiles")) {
    issues.push({
      severity: "warning",
      category: "dependency",
      message: "No ProGuard/R8 rules configured — release builds won't be obfuscated",
      fix: "Add proguardFiles to the release buildType",
    });
  }

  return issues;
}

/**
 * Run full pre-build validation
 */
export function runPreBuildValidation(opts: {
  packageJson: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
  sdkConfig: { compileSdkVersion: number; targetSdkVersion: number; minSdkVersion: number };
  buildGradle?: string;
}): BuildValidationResult {
  const issues: BuildIssue[] = [
    ...validateDependencies(opts.packageJson),
    ...validateSdkConfig(opts.sdkConfig),
    ...(opts.buildGradle ? validateGradleConfig(opts.buildGradle) : []),
  ];

  return {
    passed: !issues.some((i) => i.severity === "error"),
    issues,
    timestamp: new Date().toISOString(),
  };
}

function extractMajor(version: string): number {
  const match = version.replace(/[\^~>=<]*/g, "").match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}
