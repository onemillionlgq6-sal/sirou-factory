import { useState, useCallback, useEffect, useRef } from "react";
import { PanelLeftClose, PanelLeftOpen, Settings, Database, GitBranch } from "lucide-react";
import ErrorBoundary from "@/components/ErrorBoundary";
import AIChatPanel from "@/components/factory/AIChatPanel";
import PreviewPanel from "@/components/factory/PreviewPanel";
import SovereignIcon from "@/components/factory/SovereignIcon";
import SettingsModal from "@/components/factory/SettingsModal";
import SupabaseConnectModal from "@/components/factory/SupabaseConnectModal";
import GitHubConnectModal from "@/components/factory/GitHubConnectModal";
import { toast } from "sonner";
import { initGlobalErrorHandlers } from "@/lib/health-monitor";
import { isLocalServerRunning } from "@/lib/local-executor";
import { isConnected as isSupabaseConnected } from "@/lib/supabase-sync";
import { isGitHubConnected } from "@/lib/github-sync";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

const Index = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [serverOnline, setServerOnline] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [supabaseOpen, setSupabaseOpen] = useState(false);
  const [githubOpen, setGithubOpen] = useState(false);
  const [dbConnected, setDbConnected] = useState(isSupabaseConnected());
  const [generatedFiles, setGeneratedFiles] = useState<Record<string, string>>({});
  const [ghConnected, setGhConnected] = useState(isGitHubConnected());

  useEffect(() => {
    initGlobalErrorHandlers();
    isLocalServerRunning().then(setServerOnline);
  }, []);

  const handleAppAIMessage = useCallback((message: string) => {
    toast.success("📝 جاري التنفيذ...");
  }, []);

  return (
    <div className="h-screen flex flex-col bg-[hsl(220,25%,6%)] text-foreground overflow-hidden">
      {/* ─── Top Bar ─── */}
      <header className="flex items-center justify-between h-11 px-3 border-b border-border/20 bg-[hsl(220,20%,8%)] flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-[hsl(220,20%,14%)] transition-colors"
          >
            {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </button>
          <div className="flex items-center gap-2" dir="ltr">
            <SovereignIcon size="sm" glowing />
            <span
              className="text-sm font-bold tracking-wide text-foreground"
              style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
            >
              Sirou Factory
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                serverOnline
                  ? "bg-emerald-400 shadow-[0_0_4px_hsl(142,60%,50%)]"
                  : "bg-red-400"
              }`}
            />
            {serverOnline ? "Executor Online" : "Executor Offline"}
          </div>

          {/* ─── زر Supabase ─── */}
          <button
            onClick={() => setSupabaseOpen(true)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-[hsl(220,20%,14%)] transition-colors relative"
            title="Supabase"
          >
            <Database className="h-4 w-4" />
            {dbConnected && (
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_4px_hsl(142,60%,50%)]" />
            )}
          </button>

          <button
            onClick={() => setSettingsOpen(true)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-[hsl(220,20%,14%)] transition-colors"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </header>

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      <SupabaseConnectModal
        open={supabaseOpen}
        onOpenChange={setSupabaseOpen}
        onConnectionChange={setDbConnected}
      />

      {/* ─── Main Content ─── */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Left: AI Chat */}
          {sidebarOpen && (
            <>
              <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
                <div className="h-full flex flex-col bg-[hsl(220,20%,8%)]">
                  <ErrorBoundary moduleName="AIChatApp" fallbackTitleAr="خطأ في المحادثة">
                    <AIChatPanel
                      mode="app"
                      onSendMessage={(msg) => handleAppAIMessage(msg)}
                      onFilesGenerated={(files) => setGeneratedFiles(prev => ({ ...prev, ...files }))}
                    />
                  </ErrorBoundary>
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
            </>
          )}

          {/* Right: Preview */}
          <ResizablePanel defaultSize={sidebarOpen ? 70 : 100}>
            <ErrorBoundary moduleName="PreviewPanel" fallbackTitleAr="خطأ في المعاينة">
              <PreviewPanel generatedFiles={generatedFiles} />
            </ErrorBoundary>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default Index;
