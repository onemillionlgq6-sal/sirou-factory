import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  Download,
  Settings,
  ShieldCheck,
  Puzzle,
  Database,
  FileInput,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import BackendModal from "@/components/factory/BackendModal";
import SecureVault from "@/components/factory/SecureVault";
import SettingsModal from "@/components/factory/SettingsModal";
import PluginsModal from "@/components/factory/PluginsModal";
import ImportStateModal from "@/components/factory/ImportStateModal";
import { useI18n } from "@/lib/i18n";
import { exportFactoryState, initKeyboardShortcuts } from "@/lib/factory-actions";
import { toast } from "sonner";

interface FactoryActionsProps {
  isGenerated: boolean;
  onPublish: () => void;
  onExport: () => void;
  isBackendConnected: boolean;
  onBackendConnected: () => void;
  onBackendDisconnected: () => void;
}

const FactoryActions = ({
  isGenerated,
  onPublish,
  onExport,
  isBackendConnected,
  onBackendConnected,
  onBackendDisconnected,
}: FactoryActionsProps) => {
  const [backendOpen, setBackendOpen] = useState(false);
  const [vaultOpen, setVaultOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pluginsOpen, setPluginsOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const { t } = useI18n();

  // Keyboard shortcuts
  useEffect(() => {
    return initKeyboardShortcuts({
      onSave: () => toast.success(t("toast.published")),
      onVault: () => setVaultOpen(true),
      onExport: () => exportFactoryState(),
      onSettings: () => setSettingsOpen(true),
    });
  }, [t]);

  const handleExport = () => {
    exportFactoryState();
    onExport();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="sf-glass rounded-2xl p-6"
      >
        <h2 className="text-lg font-semibold text-foreground mb-4">
          {t("controls.title")}
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onPublish}
                disabled={!isGenerated}
                className="h-14 rounded-xl sf-gradient-bg text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-30"
              >
                <Upload className="h-5 w-5 me-2" />
                {t("controls.publish")}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("controls.publish.tooltip")}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleExport}
                variant="outline"
                className="h-14 rounded-xl sf-glass-subtle border-foreground/20 text-foreground hover:sf-glass-strong font-semibold"
              >
                <Download className="h-5 w-5 me-2" />
                {t("controls.export")}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("controls.export.tooltip")} (Ctrl+E)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={() => setImportOpen(true)}
                className="h-14 rounded-xl sf-glass-subtle border-foreground/20 text-foreground hover:sf-glass-strong"
              >
                <FileInput className="h-5 w-5 me-2" />
                {t("controls.import")}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("controls.import.tooltip")}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={() => setVaultOpen(true)}
                className="h-14 rounded-xl sf-glass-subtle border-foreground/20 text-foreground hover:sf-glass-strong"
              >
                <ShieldCheck className="h-5 w-5 me-2" />
                {t("controls.apikeys")}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("controls.apikeys.tooltip")} (Ctrl+K)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={() => setPluginsOpen(true)}
                className="h-14 rounded-xl sf-glass-subtle border-foreground/20 text-foreground hover:sf-glass-strong"
              >
                <Puzzle className="h-5 w-5 me-2" />
                {t("controls.plugins")}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("controls.plugins.tooltip")}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={() => setBackendOpen(true)}
                className={`h-14 rounded-xl sf-glass-subtle border-foreground/20 text-foreground hover:sf-glass-strong ${
                  isBackendConnected
                    ? "border-sf-safe/40 text-sf-safe"
                    : ""
                }`}
              >
                <Database className="h-5 w-5 me-2" />
                {isBackendConnected
                  ? t("controls.backend.connected")
                  : t("controls.backend")}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isBackendConnected
                ? t("controls.backend.tooltip.connected")
                : t("controls.backend.tooltip.disconnected")}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={() => setSettingsOpen(true)}
                className="h-14 rounded-xl sf-glass-subtle border-foreground/20 text-foreground hover:sf-glass-strong"
              >
                <Settings className="h-5 w-5 me-2" />
                {t("controls.settings")}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("controls.settings.tooltip")} (Ctrl+,)</TooltipContent>
          </Tooltip>
        </div>
      </motion.div>

      <BackendModal
        open={backendOpen}
        onOpenChange={setBackendOpen}
        onConnected={onBackendConnected}
        onDisconnected={onBackendDisconnected}
        isConnected={isBackendConnected}
      />
      <SecureVault open={vaultOpen} onOpenChange={setVaultOpen} />
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      <PluginsModal open={pluginsOpen} onOpenChange={setPluginsOpen} />
      <ImportStateModal open={importOpen} onOpenChange={setImportOpen} />
    </>
  );
};

export default FactoryActions;
