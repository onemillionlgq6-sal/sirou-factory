/**
 * BuildGuardPanel — Pre-build validation UI
 * Checks dependency conflicts, SDK compatibility, and Gradle issues.
 */

import { useState, useCallback } from "react";
import { Shield, AlertTriangle, CheckCircle, Info, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { runPreBuildValidation, type BuildValidationResult, type BuildIssue } from "@/lib/build-guard";
import { ANDROID_CONFIG, BUILD_GRADLE_APP } from "@/lib/android-build";

const SEVERITY_STYLES: Record<BuildIssue["severity"], { icon: typeof AlertTriangle; color: string }> = {
  error: { icon: AlertTriangle, color: "text-destructive" },
  warning: { icon: Info, color: "text-yellow-400" },
  info: { icon: Info, color: "text-muted-foreground" },
};

const BuildGuardPanel = () => {
  const { t } = useI18n();
  const [result, setResult] = useState<BuildValidationResult | null>(null);
  const [running, setRunning] = useState(false);

  const runCheck = useCallback(async () => {
    setRunning(true);
    // Simulate a brief scan delay
    await new Promise((r) => setTimeout(r, 800));

    const validation = runPreBuildValidation({
      packageJson: {
        dependencies: {
          "@capacitor/core": "^8.2.0",
          "@capacitor/cli": "^8.2.0",
          "react": "^18.3.1",
          "react-dom": "^18.3.1",
        },
      },
      sdkConfig: {
        compileSdkVersion: ANDROID_CONFIG.compileSdkVersion,
        targetSdkVersion: ANDROID_CONFIG.targetSdkVersion,
        minSdkVersion: ANDROID_CONFIG.minSdkVersion,
      },
      buildGradle: BUILD_GRADLE_APP,
    });

    setResult(validation);
    setRunning(false);
  }, []);

  return (
    <div className="sf-glass rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-sf-safe" />
          <h3 className="text-foreground font-semibold text-sm">
            {t("controls.title") === "أدوات التحكم بالمصنع" ? "حارس البناء" : "Build Guard"}
          </h3>
        </div>
        <Button
          size="sm"
          onClick={runCheck}
          disabled={running}
          className="sf-gradient-bg text-primary-foreground"
        >
          <Play className="h-3.5 w-3.5 me-1" />
          {running ? "..." : result ? "Re-scan" : "Scan"}
        </Button>
      </div>

      {result && (
        <div className="space-y-2">
          {/* Overall status */}
          <div className={`flex items-center gap-2 text-sm font-medium ${result.passed ? "text-sf-safe" : "text-destructive"}`}>
            {result.passed ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            {result.passed ? "All checks passed ✓" : `${result.issues.filter(i => i.severity === "error").length} error(s) found`}
          </div>

          {/* Issues list */}
          {result.issues.map((issue, idx) => {
            const style = SEVERITY_STYLES[issue.severity];
            const Icon = style.icon;
            return (
              <div key={idx} className="sf-glass-subtle rounded-xl px-4 py-3 space-y-1">
                <div className="flex items-start gap-2">
                  <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${style.color}`} />
                  <div className="min-w-0">
                    <p className="text-sm text-foreground">{issue.message}</p>
                    {issue.fix && (
                      <p className="text-xs text-muted-foreground mt-1">
                        💡 {issue.fix}
                      </p>
                    )}
                    <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wide">
                      {issue.category}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {result.issues.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">
              No issues detected — ready for Android build
            </p>
          )}
        </div>
      )}

      {!result && !running && (
        <p className="text-xs text-muted-foreground text-center">
          Run a scan to check dependency and SDK compatibility before building
        </p>
      )}
    </div>
  );
};

export default BuildGuardPanel;
