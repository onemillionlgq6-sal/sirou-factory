import { useState, useCallback } from "react";
import FactoryHeader from "@/components/factory/FactoryHeader";
import AppIdeaInput from "@/components/factory/AppIdeaInput";
import TransparencyCenter from "@/components/factory/TransparencyCenter";
import type { ActionNotification } from "@/components/factory/TransparencyCenter";
import AppPreview from "@/components/factory/AppPreview";
import FactoryActions from "@/components/factory/FactoryActions";
import { toast } from "sonner";
import { getStoredCredentials } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";

const Index = () => {
  const { t } = useI18n();
  const [notifications, setNotifications] = useState<ActionNotification[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [appName, setAppName] = useState("");
  const [isBackendConnected, setIsBackendConnected] = useState(
    () => !!getStoredCredentials()
  );

  const handleGenerate = useCallback((idea: string) => {
    setIsGenerating(true);
    setAppName(idea.split(" ").slice(0, 4).join(" "));

    setTimeout(() => {
      setNotifications([
        {
          id: "1",
          level: "safe",
          title: t("plan.scaffold.title"),
          description: `${t("plan.scaffold.desc")} "${idea.slice(0, 50)}..."`,
          timestamp: new Date(),
        },
        {
          id: "2",
          level: "safe",
          title: t("plan.tailwind.title"),
          description: t("plan.tailwind.desc"),
          timestamp: new Date(),
        },
        {
          id: "3",
          level: "caution",
          title: t("plan.db.title"),
          description: t("plan.db.desc"),
          timestamp: new Date(),
        },
        {
          id: "4",
          level: "caution",
          title: t("plan.auth.title"),
          description: t("plan.auth.desc"),
          timestamp: new Date(),
        },
        {
          id: "5",
          level: "danger",
          title: t("plan.api.title"),
          description: t("plan.api.desc"),
          timestamp: new Date(),
        },
      ]);
      setIsGenerating(false);
      setIsGenerated(true);
      toast.success(t("toast.plan.generated"));
    }, 1500);
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
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FactoryHeader isBackendConnected={isBackendConnected} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
          <div className="space-y-6">
            <AppIdeaInput
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
            />
            <TransparencyCenter
              notifications={notifications}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          </div>

          <div className="space-y-6">
            <AppPreview isGenerated={isGenerated} appName={appName} />
            <FactoryActions
              isGenerated={isGenerated}
              onPublish={handlePublish}
              onExport={handleExport}
              isBackendConnected={isBackendConnected}
              onBackendConnected={handleBackendConnected}
              onBackendDisconnected={handleBackendDisconnected}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
