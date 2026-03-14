import { useState } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  Download,
  Settings,
  Key,
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

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="sf-glass rounded-2xl p-6"
      >
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Factory Controls
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onPublish}
                disabled={!isGenerated}
                className="h-14 rounded-xl sf-gradient-bg text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-30"
              >
                <Upload className="h-5 w-5 mr-2" />
                Publish App
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Deploy your app to production with one click
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onExport}
                variant="outline"
                className="h-14 rounded-xl border-border hover:bg-muted font-semibold"
              >
                <Download className="h-5 w-5 mr-2" />
                Full System Export
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Export code, Docker files, and Nginx config for self-hosting
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="h-14 rounded-xl border-border hover:bg-muted"
              >
                <Key className="h-5 w-5 mr-2" />
                API Keys
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Securely manage OpenAI, Anthropic, and other API keys
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="h-14 rounded-xl border-border hover:bg-muted"
              >
                <Puzzle className="h-5 w-5 mr-2" />
                Plugins
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Add Auth, Payments, Maps, Analytics, and more
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                onClick={() => setBackendOpen(true)}
                className={`h-14 rounded-xl border-border hover:bg-muted ${
                  isBackendConnected
                    ? "border-sf-safe/40 bg-sf-safe/5 text-sf-safe"
                    : ""
                }`}
              >
                <Database className="h-5 w-5 mr-2" />
                {isBackendConnected ? "Backend ✓" : "Backend"}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isBackendConnected
                ? "Connected — click to manage"
                : "Connect your Supabase backend"}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="h-14 rounded-xl border-border hover:bg-muted"
              >
                <Settings className="h-5 w-5 mr-2" />
                Settings
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Factory preferences and learning log
            </TooltipContent>
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
    </>
  );
};

export default FactoryActions;
