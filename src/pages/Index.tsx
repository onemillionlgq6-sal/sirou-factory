import { useState, useCallback, useEffect } from "react";
import FactoryHeader from "@/components/factory/FactoryHeader";
import TemplatesLauncher from "@/components/factory/TemplatesLauncher";
import SovereignCoreLauncher from "@/components/factory/SovereignCoreLauncher";
import ErrorBoundary from "@/components/ErrorBoundary";
import PipelineIndicator from "@/components/factory/PipelineIndicator";
import LeftColumn from "@/components/factory/LeftColumn";
import RightColumn from "@/components/factory/RightColumn";
import type { Phase } from "@/components/factory/PipelineIndicator";
import type { ActionNotification } from "@/components/factory/TransparencyCenter";
import type { AppBlueprint } from "@/components/factory/AIPlannerEngine";
import { toast } from "sonner";
import { getStoredCredentials } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";
import { initGlobalErrorHandlers } from "@/lib/health-monitor";
import factoryBg from "@/assets/factory-bg.jpg";

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

  useEffect(() => { initGlobalErrorHandlers(); }, []);

  const handleGenerate = useCallback((ideaText: string) => {
    setIdea(ideaText);
    setAppName(ideaText.split(" ").slice(0, 4).join(" "));
    setPhase("planning");
  }, []);

  const handleBlueprintReady = useCallback((bp: AppBlueprint) => {
    setBlueprint(bp);
    setPhase("blueprint");
    const notifs: ActionNotification[] = bp.features.map((f, i) => ({
      id: String(i + 1), level: f.risk, title: f.name,
      description: f.category === "external" ? t("plan.api.desc")
        : f.category === "plugin" ? t("plan.db.desc") : t("plan.tailwind.desc"),
      approved: f.risk === "safe" ? true : undefined, timestamp: new Date(),
    }));
    setNotifications(notifs);
    toast.success(t("toast.plan.generated"));
  }, [t]);

  const handleBlueprintApprove = useCallback((bp: AppBlueprint) => {
    setBlueprint(bp);
    setPhase("building");
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
    setPhase("idea"); setBlueprint(null); setNotifications([]);
    toast(t("blueprint.rejected"));
  }, [t]);

  const handleBuildComplete = useCallback(() => {
    setPhase("audit");
    toast.success(t("toast.published"));
  }, [t]);

  const handleAuditProceed = useCallback(() => {
    setPhase("complete");
    toast.success("✅ App passed Quality Gate — ready to export!");
  }, []);

  const handleAuditRefine = useCallback(() => {
    setPhase("idea");
    setBlueprint(null);
    setNotifications([]);
    toast("🔧 Returning to design mode for refinements...");
  }, []);

  const handleApprove = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, approved: true } : n)));
    toast.success(t("toast.approved"));
  }, [t]);

  const handleReject = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, approved: false } : n)));
    toast(t("toast.rejected"));
  }, [t]);

  const handlePublish = useCallback(() => {
    const pending = notifications.filter((n) => n.level !== "safe" && n.approved === undefined);
    if (pending.length > 0) { toast.error(`${pending.length} ${t("toast.pending")}`); return; }
    toast.success(t("toast.published"));
  }, [notifications, t]);

  const handleExport = useCallback(() => { toast.success(t("toast.exported")); }, [t]);

  return (
    <div className="min-h-screen bg-cover bg-center bg-fixed" style={{ backgroundImage: `url(${factoryBg})` }}>
      <div className="min-h-screen bg-black/30 backdrop-blur-[2px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FactoryHeader isBackendConnected={isBackendConnected} />
          <PipelineIndicator currentPhase={phase} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
            <LeftColumn
              phase={phase} idea={idea} isPlanning={isPlanning}
              setIsPlanning={setIsPlanning} blueprint={blueprint}
              notifications={notifications} onGenerate={handleGenerate}
              onBlueprintReady={handleBlueprintReady}
              onBlueprintApprove={handleBlueprintApprove}
              onBlueprintReject={handleBlueprintReject}
              onBuildComplete={handleBuildComplete}
              onApprove={handleApprove} onReject={handleReject}
            />
            <RightColumn
              isComplete={phase === "complete"} appName={appName}
              blueprint={blueprint} isBackendConnected={isBackendConnected}
              onPublish={handlePublish} onExport={handleExport}
              onBackendConnected={() => setIsBackendConnected(true)}
              onBackendDisconnected={() => setIsBackendConnected(false)}
            />
          </div>

          <div className="pb-12 space-y-4">
            <ErrorBoundary moduleName="TemplatesLauncher" fallbackTitleAr="خطأ في قوالب التطبيقات">
              <TemplatesLauncher />
            </ErrorBoundary>
            <ErrorBoundary moduleName="SovereignCoreLauncher" fallbackTitleAr="خطأ في مركز القدرات">
              <SovereignCoreLauncher />
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
