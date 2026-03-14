import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Database, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import {
  getStoredCredentials,
  storeCredentials,
  clearCredentials,
  createSupabaseClient,
  initializeTables,
} from "@/lib/supabase";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

interface BackendModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected: () => void;
  onDisconnected: () => void;
  isConnected: boolean;
}

const BackendModal = ({
  open,
  onOpenChange,
  onConnected,
  onDisconnected,
  isConnected,
}: BackendModalProps) => {
  const [url, setUrl] = useState("");
  const [anonKey, setAnonKey] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const { t } = useI18n();

  useEffect(() => {
    if (open) {
      const creds = getStoredCredentials();
      if (creds) {
        setUrl(creds.url);
        setAnonKey(creds.anonKey);
      }
    }
  }, [open]);

  const handleConnect = async () => {
    if (!url.trim() || !anonKey.trim()) {
      toast.error(t("toast.creds.missing"));
      return;
    }

    setIsConnecting(true);
    setStatus("idle");

    try {
      const client = createSupabaseClient(url.trim(), anonKey.trim());
      const result = await initializeTables(client);

      if (result.success) {
        storeCredentials(url.trim(), anonKey.trim());
        setStatus("success");
        setStatusMessage(result.message);
        onConnected();
        toast.success(t("toast.connected"));
      } else {
        setStatus("error");
        setStatusMessage(result.message);
        toast.error(t("toast.connect.failed"));
      }
    } catch {
      setStatus("error");
      setStatusMessage("Unexpected error during connection.");
      toast.error(t("toast.connect.failed"));
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    clearCredentials();
    setUrl("");
    setAnonKey("");
    setStatus("idle");
    setStatusMessage("");
    onDisconnected();
    toast(t("toast.disconnected"));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            {t("backend.title")}
          </DialogTitle>
          <DialogDescription>
            {t("backend.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="supabase-url">{t("backend.url")}</Label>
            <Input
              id="supabase-url"
              placeholder={t("backend.url.placeholder")}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isConnecting}
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supabase-key">{t("backend.key")}</Label>
            <Input
              id="supabase-key"
              type="password"
              placeholder={t("backend.key.placeholder")}
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              disabled={isConnecting}
              dir="ltr"
            />
            <p className="text-xs text-muted-foreground">
              {t("backend.key.hint")}
            </p>
          </div>

          {status !== "idle" && (
            <div
              className={`flex items-start gap-2 rounded-lg p-3 text-sm ${
                status === "success"
                  ? "bg-sf-safe/10 text-sf-safe border border-sf-safe/20"
                  : "bg-destructive/10 text-destructive border border-destructive/20"
              }`}
            >
              {status === "success" ? (
                <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              )}
              <span>{statusMessage}</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {isConnected && (
            <Button
              variant="outline"
              onClick={handleDisconnect}
              className="text-destructive border-destructive/30 hover:bg-destructive/10"
            >
              {t("backend.disconnect")}
            </Button>
          )}
          <Button
            onClick={handleConnect}
            disabled={isConnecting || !url.trim() || !anonKey.trim()}
            className="sf-gradient-bg text-primary-foreground"
          >
            {isConnecting ? (
              <>
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
                {t("backend.connecting")}
              </>
            ) : isConnected ? (
              t("backend.reconnect")
            ) : (
              t("backend.connect")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BackendModal;
