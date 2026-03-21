import { useState, useCallback, useEffect } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import FactoryHeader from "@/components/factory/FactoryHeader";
import TemplatesLauncher from "@/components/factory/TemplatesLauncher";
import SovereignCoreLauncher from "@/components/factory/SovereignCoreLauncher";
import ErrorBoundary from "@/components/ErrorBoundary";
import PipelineIndicator from "@/components/factory/PipelineIndicator";
import LeftColumn from "@/components/factory/LeftColumn";
import RightColumn from "@/components/factory/RightColumn";
import AIChatPanel from "@/components/factory/AIChatPanel";
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

  const handleAppAIMessage = useCallback((message: string) => {
    // If in idea phase, treat as a generation request
    if (phase === "idea") {
      handleGenerate(message);
    } else {
      toast.success("📝 تم تسجيل التعديل — جاري التطبيق...");
    }
  }, [phase, handleGenerate]);

  const handleFactoryAIMessage = useCallback((message: string) => {
    toast.success("🔧 طلب تطوير المصنع مسجل — جاري المعالجة...");
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
    <div className="h-screen flex bg-cover bg-center bg-fixed overflow-hidden" style={{ backgroundImage: `url(${factoryBg})` }}>
      <div className="h-screen flex w-full bg-black/30 backdrop-blur-[2px]">
        {/* ─── LEFT SIDEBAR: AI Chat (fixed, 25%) ─── */}
        <aside className="w-1/4 min-w-[280px] max-w-[360px] h-screen flex flex-col border-e border-border/30 bg-background/80 backdrop-blur-md z-20">
          {/* App AI Chat */}
          <div className="flex-1 overflow-y-auto">
            <ErrorBoundary moduleName="AIChatApp" fallbackTitleAr="خطأ في محادثة التطبيق">
              <AIChatPanel
                mode="app"
                onSendMessage={(msg) => handleAppAIMessage(msg)}
                isGenerating={isPlanning}
              />
            </ErrorBoundary>
          </div>

          {/* Factory AI Chat */}
          <div className="border-t border-border/30">
            <ErrorBoundary moduleName="AIChatFactory" fallbackTitleAr="خطأ في محادثة المصنع">
              <AIChatPanel
                mode="factory"
                onSendMessage={(msg) => handleFactoryAIMessage(msg)}
              />
            </ErrorBoundary>
          </div>
        </aside>

        {/* ─── RIGHT PANEL: Preview & Tools (75%) ─── */}
        <main className="flex-1 h-screen overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <FactoryHeader isBackendConnected={isBackendConnected} />
            <PipelineIndicator currentPhase={phase} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
              <LeftColumn
                phase={phase} idea={idea} isPlanning={isPlanning}
                setIsPlanning={setIsPlanning} blueprint={blueprint}
                notifications={notifications} appName={appName}
                onGenerate={handleGenerate}
                onBlueprintReady={handleBlueprintReady}
                onBlueprintApprove={handleBlueprintApprove}
                onBlueprintReject={handleBlueprintReject}
                onBuildComplete={handleBuildComplete}
                onAuditProceed={handleAuditProceed}
                onAuditRefine={handleAuditRefine}
                onApprove={handleApprove} onReject={handleReject}
              />
              <RightColumn
                isComplete={phase === "complete" || phase === "audit"} appName={appName}
                blueprint={blueprint} isBackendConnected={isBackendConnected}
                onPublish={handlePublish} onExport={handleExport}
                onBackendConnected={() => setIsBackendConnected(true)}
                onBackendDisconnected={() => setIsBackendConnected(false)}
                onAppAIMessage={handleAppAIMessage}
                isGenerating={isPlanning}
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
        </main>
      </div>
    </div>
  );
};

export default Index;
