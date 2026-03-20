import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, CheckCircle2, XCircle, AlertTriangle, Info,
  FileText, Download, RefreshCw, Scale, Radio
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { runPolicyCheck, type PolicyReport, type PolicyCheck } from "@/lib/play-policy-guard";
import { generatePrivacyPolicy, generateTermsOfService, downloadLegalDocument } from "@/lib/legal-bundle";
import { createOTAUpdate, getUpdateHistory } from "@/lib/ota-updates";
import { toast } from "sonner";
import type { AppBlueprint } from "@/components/factory/AIPlannerEngine";

interface CompliancePanelProps {
  blueprint: AppBlueprint | null;
  appName: string;
}

const severityBadge = (severity: PolicyCheck["severity"], lang: string) => {
  const cls = severity === "critical"
    ? "bg-sf-danger/20 text-sf-danger"
    : severity === "warning"
    ? "bg-sf-caution/20 text-sf-caution"
    : "bg-accent/20 text-accent";
  const label = severity === "critical"
    ? (lang === "ar" ? "حرج" : "Critical")
    : severity === "warning"
    ? (lang === "ar" ? "تحذير" : "Warning")
    : (lang === "ar" ? "معلومة" : "Info");
  return <span className={`text-[10px] px-1.5 py-0.5 rounded-full uppercase font-bold ${cls}`}>{label}</span>;
};

const CompliancePanel = ({ blueprint, appName }: CompliancePanelProps) => {
  const { t, lang } = useI18n();
  const [policyReport, setPolicyReport] = useState<PolicyReport | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [activeTab, setActiveTab] = useState<"policy" | "legal" | "ota">("policy");

  const handlePolicyCheck = useCallback(() => {
    setIsChecking(true);
    setTimeout(() => {
      const features = blueprint?.features.filter(f => f.approved) || [];
      const report = runPolicyCheck({
        appName,
        features,
        targetSdk: 35,
        minSdk: 24,
        permissionsUsed: features
          .filter(f => ["Camera", "Maps", "GPS", "Notifications"].some(p => f.name.includes(p)))
          .map(f => f.name),
        hasPrivacyPolicy: false,
        privacyPolicyUrl: "",
        hasTermsOfService: false,
        appDescription: blueprint?.description || "",
        contentRating: "",
      });
      setPolicyReport(report);
      setIsChecking(false);
      toast[report.passed ? "success" : "error"](t(report.passed ? "compliance.check.passed" : "compliance.check.failed"));
    }, 600);
  }, [blueprint, appName, t]);

  const handleDownloadPrivacy = useCallback(() => {
    const featureNames = blueprint?.features.filter(f => f.approved).map(f => f.name) || [];
    const content = generatePrivacyPolicy({ appName, features: featureNames });
    downloadLegalDocument(content, `${appName.replace(/\s+/g, "-")}-privacy-policy.md`);
    toast.success(t("compliance.legal.downloaded"));
  }, [blueprint, appName, t]);

  const handleDownloadTOS = useCallback(() => {
    const content = generateTermsOfService({ appName });
    downloadLegalDocument(content, `${appName.replace(/\s+/g, "-")}-terms-of-service.md`);
    toast.success(t("compliance.legal.downloaded"));
  }, [appName, t]);

  const handlePushOTA = useCallback(async () => {
    try {
      await createOTAUpdate("config", {
        lastVerified: new Date().toISOString(),
        appName,
        version: "1.0.0",
      }, "owner-key");
      toast.success(t("compliance.ota.pushed"));
    } catch {
      toast.error("OTA update failed");
    }
  }, [appName, t]);

  const otaHistory = getUpdateHistory();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sf-glass rounded-2xl p-6 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <Scale className="h-5 w-5 text-accent" />
        <h2 className="text-lg font-semibold text-foreground">{t("compliance.title")}</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 sf-glass-subtle rounded-lg p-1">
        {(["policy", "legal", "ota"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === tab
                ? "sf-glass-strong text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t(`compliance.tab.${tab}`)}
          </button>
        ))}
      </div>

      {/* Policy Guard Tab */}
      <AnimatePresence mode="wait">
        {activeTab === "policy" && (
          <motion.div key="policy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <Button
              size="sm"
              variant="outline"
              onClick={handlePolicyCheck}
              disabled={isChecking}
              className="w-full sf-glass-subtle border-foreground/10 text-foreground gap-1.5"
            >
              {isChecking ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Shield className="h-3.5 w-3.5" />}
              {t("compliance.check.run")}
            </Button>

            {policyReport && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full bg-foreground/10 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${policyReport.score}%` }}
                      className={`h-full rounded-full ${
                        policyReport.score >= 80 ? "bg-sf-safe" : policyReport.score >= 50 ? "bg-sf-caution" : "bg-sf-danger"
                      }`}
                    />
                  </div>
                  <span className={`text-sm font-mono font-bold ${
                    policyReport.score >= 80 ? "text-sf-safe" : policyReport.score >= 50 ? "text-sf-caution" : "text-sf-danger"
                  }`}>{policyReport.score}/100</span>
                </div>

                <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                  {policyReport.checks.map(check => (
                    <div key={check.id} className="sf-glass-subtle rounded-lg p-3 flex items-start gap-3">
                      {check.passed
                        ? <CheckCircle2 className="h-4 w-4 text-sf-safe mt-0.5" />
                        : check.severity === "critical"
                        ? <XCircle className="h-4 w-4 text-sf-danger mt-0.5" />
                        : <AlertTriangle className="h-4 w-4 text-sf-caution mt-0.5" />
                      }
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {lang === "ar" ? check.titleAr : check.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {lang === "ar" ? check.descriptionAr : check.description}
                        </p>
                        {!check.passed && check.fix && (
                          <p className="text-xs text-sf-safe mt-1 font-mono">
                            💡 {lang === "ar" ? (check.fixAr || check.fix) : check.fix}
                          </p>
                        )}
                      </div>
                      {severityBadge(check.severity, lang)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Legal Bundle Tab */}
        {activeTab === "legal" && (
          <motion.div key="legal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <p className="text-xs text-muted-foreground">{t("compliance.legal.desc")}</p>

            <div className="space-y-2">
              <button
                onClick={handleDownloadPrivacy}
                className="w-full sf-glass-subtle rounded-lg p-4 flex items-center gap-3 hover:bg-foreground/5 transition-all text-start"
              >
                <FileText className="h-5 w-5 text-accent" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{t("compliance.legal.privacy")}</p>
                  <p className="text-xs text-muted-foreground">{t("compliance.legal.privacy.desc")}</p>
                </div>
                <Download className="h-4 w-4 text-muted-foreground" />
              </button>

              <button
                onClick={handleDownloadTOS}
                className="w-full sf-glass-subtle rounded-lg p-4 flex items-center gap-3 hover:bg-foreground/5 transition-all text-start"
              >
                <FileText className="h-5 w-5 text-accent" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{t("compliance.legal.tos")}</p>
                  <p className="text-xs text-muted-foreground">{t("compliance.legal.tos.desc")}</p>
                </div>
                <Download className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <div className="sf-glass-subtle rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-accent mt-0.5" />
                <p className="text-xs text-muted-foreground">{t("compliance.legal.note")}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* OTA Updates Tab */}
        {activeTab === "ota" && (
          <motion.div key="ota" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <Button
              size="sm"
              variant="outline"
              onClick={handlePushOTA}
              className="w-full sf-glass-subtle border-foreground/10 text-foreground gap-1.5"
            >
              <Radio className="h-3.5 w-3.5" />
              {t("compliance.ota.push")}
            </Button>

            {otaHistory.length > 0 ? (
              <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                {otaHistory.slice(0, 5).map(update => (
                  <div key={update.id} className="sf-glass-subtle rounded-lg p-3 flex items-center gap-3">
                    <Radio className="h-4 w-4 text-sf-safe" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground">{update.type} • v{update.version}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(update.timestamp).toLocaleString()}</p>
                    </div>
                    <CheckCircle2 className="h-3.5 w-3.5 text-sf-safe" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">{t("compliance.ota.empty")}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CompliancePanel;
