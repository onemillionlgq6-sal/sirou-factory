import { useState, useCallback } from "react";
import FactoryHeader from "@/components/factory/FactoryHeader";
import AppIdeaInput from "@/components/factory/AppIdeaInput";
import TransparencyCenter from "@/components/factory/TransparencyCenter";
import type { ActionNotification } from "@/components/factory/TransparencyCenter";
import AppPreview from "@/components/factory/AppPreview";
import FactoryActions from "@/components/factory/FactoryActions";
import { toast } from "sonner";
import { getStoredCredentials } from "@/lib/supabase";

const generateActionPlan = (idea: string): ActionNotification[] => [
  {
    id: "1",
    level: "safe",
    title: "Create project scaffold",
    description: `Initialize React + TypeScript project structure for: "${idea.slice(0, 50)}..."`,
    timestamp: new Date(),
  },
  {
    id: "2",
    level: "safe",
    title: "Apply Tailwind design system",
    description: "Set up professional color palette, typography, and spacing tokens.",
    timestamp: new Date(),
  },
  {
    id: "3",
    level: "caution",
    title: "Create database schema",
    description: "Will create tables and RLS policies in Supabase for data isolation.",
    timestamp: new Date(),
  },
  {
    id: "4",
    level: "caution",
    title: "Set up authentication",
    description: "Configure Supabase Auth with email/password. No external providers without approval.",
    timestamp: new Date(),
  },
  {
    id: "5",
    level: "danger",
    title: "External API integration detected",
    description: "Your idea may require third-party APIs. No data will be sent without your explicit approval.",
    timestamp: new Date(),
  },
];

const Index = () => {
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
      setNotifications(generateActionPlan(idea));
      setIsGenerating(false);
      setIsGenerated(true);
      toast.success("Action plan generated! Review actions below.");
    }, 1500);
  }, []);

  const handleApprove = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, approved: true } : n))
    );
    toast.success("Action approved ✓");
  }, []);

  const handleReject = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, approved: false } : n))
    );
    toast("Action rejected — it will be skipped.");
  }, []);

  const handlePublish = useCallback(() => {
    const pendingApprovals = notifications.filter(
      (n) => n.level !== "safe" && n.approved === undefined
    );
    if (pendingApprovals.length > 0) {
      toast.error(
        `${pendingApprovals.length} action(s) still need your approval before publishing.`
      );
      return;
    }
    toast.success("App published successfully! 🚀");
  }, [notifications]);

  const handleExport = useCallback(() => {
    toast.success(
      "Export package prepared: code, Docker, and Nginx configs included."
    );
  }, []);

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
          {/* Left column */}
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

          {/* Right column */}
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
