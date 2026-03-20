import { useState, useCallback, useEffect } from "react";
import FactoryHeader from "@/components/factory/FactoryHeader";
import AppIdeaInput from "@/components/factory/AppIdeaInput";
import TransparencyCenter from "@/components/factory/TransparencyCenter";
import type { ActionNotification } from "@/components/factory/TransparencyCenter";
import AppPreview from "@/components/factory/AppPreview";
import FactoryActions from "@/components/factory/FactoryActions";
import AIPlannerEngine from "@/components/factory/AIPlannerEngine";
import type { AppBlueprint } from "@/components/factory/AIPlannerEngine";
import InteractiveBlueprint from "@/components/factory/InteractiveBlueprint";
import AppBuilderEngine from "@/components/factory/AppBuilderEngine";
import HealthDashboard from "@/components/factory/HealthDashboard";
import ErrorBoundary from "@/components/ErrorBoundary";
import BuildGuardPanel from "@/components/factory/BuildGuardPanel";
import { toast } from "sonner";
import { getStoredCredentials } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";
import { initGlobalErrorHandlers } from "@/lib/health-monitor";
import factoryBg from "@/assets/factory-bg.jpg";

type Phase = "idea" | "planning" | "blueprint" | "building" | "complete";

const Index = () => {
  const { t } = useI18n();
  const [notifications, setNotifications] = useState<ActionNotification[]>([]);
  const [phase, setPhase] = useState<Phase>("idea");
  const [idea, setIdea] = useState("");
  const [isPlanning, setIsPlanning] = useState(false);
  const [blueprint, setBlueprint] = useState<AppBlueprint | null>(null);
  const [appName, setAppName] = useState("");
  const [isBackendConnected, setIsBackendConnected] = useState(
    () => !!getStoredCredentials()
  );

  useEffect(() => {
    initGlobalErrorHandlers();
  }, []);

  const handleGenerate = useCallback((ideaText: string) => {
    setIdea(ideaText);
    setAppName(ideaText.split(" ").slice(0, 4).join(" "));
    setPhase("planning");
  }, []);

  const handleBlueprintReady = useCallback((bp: AppBlueprint) => {
    setBlueprint(bp);
    setPhase("blueprint");

    // Generate transparency notifications from blueprint
    const notifs: ActionNotification[] = bp.features.map((f, i) => ({
      id: String(i + 1),
      level: f.risk,
      title: f.name,
      description: f.category === "external"
        ? t("plan.api.desc")
        : f.category === "plugin"
        ? t("plan.db.desc")
        : t("plan.tailwind.desc"),
      approved: f.risk === "safe" ? true : undefined,
      timestamp: new Date(),
    }));
    setNotifications(notifs);
    toast.success(t("toast.plan.generated"));
  }, [t]);

  const handleBlueprintApprove = useCallback((bp: AppBlueprint) => {
    setBlueprint(bp);
    setPhase("building");

    // Auto-approve all notifications for approved features
    setNotifications((prev) =>
      prev.map((n) => {
        const feature = bp.features.find((f) => f.name === n.title);
        if (feature?.approved) return { ...n, approved: true };
        if (feature && !feature.approved) return { ...n, approved: false };
        return n;
      })
    );
    toast.success(t("blueprint.building"));
  }, [t]);

  const handleBlueprintReject = useCallback(() => {
    setPhase("idea");
    setBlueprint(null);
    setNotifications([]);
    toast(t("blueprint.rejected"));
  }, [t]);

  const handleBuildComplete = useCallback(() => {
    setPhase("complete");
    toast.success(t("toast.published"));
  }, [t]);

  const handleApprove = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, approved: true } : n))
    );
    toast.success(t("toast.approved"));
  }, [t]);

  const handleReject = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, approved: false } : n))
    );
    toast(t("toast.rejected"));
  }, [t]);

  const handlePublish = useCallback(() => {
    const pendingApprovals = notifications.filter(
      (n) => n.level !== "safe" && n.approved === undefined
    );
    if (pendingApprovals.length > 0) {
      toast.error(`${pendingApprovals.length} ${t("toast.pending")}`);
      return;
    }
    toast.success(t("toast.published"));
  }, [notifications, t]);

  const handleExport = useCallback(() => {
    toast.success(t("toast.exported"));
  }, [t]);

  const handleBackendConnected = useCallback(() => {
    setIsBackendConnected(true);
  }, []);

  const handleBackendDisconnected = useCallback(() => {
    setIsBackendConnected(false);
  }, []);

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{ backgroundImage: `url(${factoryBg})` }}
    >
      {/* Dark overlay for readability */}
      <div className="min-h-screen bg-black/30 backdrop-blur-[2px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FactoryHeader isBackendConnected={isBackendConnected} />

          {/* Pipeline indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {(["idea", "planning", "blueprint", "building", "complete"] as Phase[]).map((p, i) => (
              <div key={p} className="flex items-center gap-2">
                <div
                  className={`h-2.5 w-2.5 rounded-full transition-all ${
                    phase === p
                      ? "sf-gradient-bg scale-125 sf-glow-green"
                      : ["idea", "planning", "blueprint", "building", "complete"].indexOf(phase) > i
                      ? "bg-sf-safe"
                      : "bg-foreground/20"
                  }`}
                />
                {i < 4 && (
                  <div
                    className={`h-px w-8 transition-all ${
                      ["idea", "planning", "blueprint", "building", "complete"].indexOf(phase) > i
                        ? "bg-sf-safe"
                        : "bg-foreground/20"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
            <div className="space-y-6">
              {/* Left column: Idea → Planner → Blueprint */}
              {(phase === "idea" || phase === "planning") && (
                <ErrorBoundary moduleName="AppIdeaInput" fallbackTitleAr="خطأ في مدخل الفكرة">
                  <AppIdeaInput
                    onGenerate={handleGenerate}
                    isGenerating={isPlanning}
                  />
                </ErrorBoundary>
              )}

              {(phase === "planning" || phase === "blueprint") && (
                <ErrorBoundary moduleName="AIPlannerEngine" fallbackTitleAr="خطأ في محرك التخطيط">
                  <AIPlannerEngine
                    idea={idea}
                    onBlueprintReady={handleBlueprintReady}
                    isPlanning={isPlanning}
                    setIsPlanning={setIsPlanning}
                  />
                </ErrorBoundary>
              )}

              {phase === "blueprint" && blueprint && (
                <ErrorBoundary moduleName="InteractiveBlueprint" fallbackTitleAr="خطأ في المخطط التفاعلي">
                  <InteractiveBlueprint
                    blueprint={blueprint}
                    onApprove={handleBlueprintApprove}
                    onReject={handleBlueprintReject}
                  />
                </ErrorBoundary>
              )}

              {phase === "building" && blueprint && (
                <ErrorBoundary moduleName="AppBuilderEngine" fallbackTitleAr="خطأ في محرك البناء">
                  <AppBuilderEngine
                    blueprint={blueprint}
                    onComplete={handleBuildComplete}
                  />
                </ErrorBoundary>
              )}

              <ErrorBoundary moduleName="TransparencyCenter" fallbackTitleAr="خطأ في مركز الشفافية">
                <TransparencyCenter
                  notifications={notifications}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              </ErrorBoundary>
            </div>

            <div className="space-y-6">
              <ErrorBoundary moduleName="AppPreview" fallbackTitleAr="خطأ في المعاينة">
                <AppPreview isGenerated={phase === "complete"} appName={appName} />
              </ErrorBoundary>
              <ErrorBoundary moduleName="FactoryActions" fallbackTitleAr="خطأ في أدوات التحكم">
                <FactoryActions
                  isGenerated={phase === "complete"}
                  onPublish={handlePublish}
                  onExport={handleExport}
                  isBackendConnected={isBackendConnected}
                  onBackendConnected={handleBackendConnected}
                  onBackendDisconnected={handleBackendDisconnected}
                />
              </ErrorBoundary>
              <ErrorBoundary moduleName="HealthDashboard" fallbackTitleAr="خطأ في لوحة الصحة">
                <HealthDashboard />
              </ErrorBoundary>
              <ErrorBoundary moduleName="BuildGuard" fallbackTitleAr="خطأ في حارس البناء">
                <BuildGuardPanel />
              </ErrorBoundary>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
