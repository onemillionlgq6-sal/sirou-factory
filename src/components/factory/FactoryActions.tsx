import { useState } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  Download,
  Settings,
  ShieldCheck,
  Puzzle,
  Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import BackendModal from "@/components/factory/BackendModal";
import SecureVault from "@/components/factory/SecureVault";
import { useI18n } from "@/lib/i18n";

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
  const { t } = useI18n();

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
                onClick={onExport}
                variant="outline"
                className="h-14 rounded-xl sf-glass-subtle border-foreground/20 text-foreground hover:sf-glass-strong font-semibold"
              >
                <Download className="h-5 w-5 me-2" />
                {t("controls.export")}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("controls.export.tooltip")}</TooltipContent>
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
            <TooltipContent>{t("controls.apikeys.tooltip")}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
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
                className="h-14 rounded-xl sf-glass-subtle border-foreground/20 text-foreground hover:sf-glass-strong"
              >
                <Settings className="h-5 w-5 me-2" />
                {t("controls.settings")}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("controls.settings.tooltip")}</TooltipContent>
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
    </>
  );
};

export default FactoryActions;
