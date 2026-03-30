/**
 * SupabaseConnectModal — نافذة ربط Supabase الشخصي.
 * تعرض حقول URL + Anon Key + زر اختبار + SQL لإنشاء الجداول.
 */

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { storeCredentials, clearCredentials, getStoredCredentials } from "@/lib/supabase";
import {
  testConnection,
  resetClient,
  SETUP_SQL,
} from "@/lib/supabase-sync";
import { Database, CheckCircle2, XCircle, Copy, Loader2, Unplug } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnectionChange?: (connected: boolean) => void;
}

const SupabaseConnectModal = ({ open, onOpenChange, onConnectionChange }: Props) => {
  const [url, setUrl] = useState("");
  const [anonKey, setAnonKey] = useState("");
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [showSQL, setShowSQL] = useState(false);

  useEffect(() => {
    const creds = getStoredCredentials();
    if (creds) {
      setUrl(creds.url);
      setAnonKey(creds.anonKey);
    }
  }, [open]);

  const handleTest = async () => {
    if (!url.trim() || !anonKey.trim()) {
      toast.error("أدخل URL و Anon Key أولاً");
      return;
    }
    setTesting(true);
    setStatus("idle");
    // حفظ مؤقت للاختبار
    storeCredentials(url.trim(), anonKey.trim());
    resetClient();
    const result = await testConnection();
    setTesting(false);
    setStatus(result.ok ? "ok" : "error");
    setStatusMsg(result.message);
    if (result.ok) {
      toast.success("متصل بنجاح ✅");
      onConnectionChange?.(true);
    }
  };

  const handleDisconnect = () => {
    clearCredentials();
    resetClient();
    setUrl("");
    setAnonKey("");
    setStatus("idle");
    setStatusMsg("");
    onConnectionChange?.(false);
    toast.info("تم قطع الاتصال");
  };

  const handleCopySQL = () => {
    navigator.clipboard.writeText(SETUP_SQL);
    toast.success("تم نسخ SQL ✅");
  };

  const isAlreadyConnected = !!getStoredCredentials();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-[hsl(220,20%,10%)] border-border/30 text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Database className="h-5 w-5 text-emerald-400" />
            ربط Supabase
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            اربط مشروع Supabase الشخصي لحفظ المحادثات والمشاريع والإعدادات تلقائياً.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* URL */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Project URL</Label>
            <Input
              dir="ltr"
              placeholder="https://xxxxx.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="bg-[hsl(220,20%,14%)] border-border/30 text-foreground text-sm"
            />
          </div>

          {/* Anon Key */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Anon Key</Label>
            <Input
              dir="ltr"
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIs..."
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              className="bg-[hsl(220,20%,14%)] border-border/30 text-foreground text-sm"
            />
          </div>

          {/* حالة الاتصال */}
          {status !== "idle" && (
            <div
              className={`flex items-center gap-2 text-xs px-3 py-2 rounded-md ${
                status === "ok"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-red-500/10 text-red-400 border border-red-500/20"
              }`}
            >
              {status === "ok" ? (
                <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
              ) : (
                <XCircle className="h-3.5 w-3.5 flex-shrink-0" />
              )}
              <span>{statusMsg}</span>
            </div>
          )}

          {/* أزرار */}
          <div className="flex gap-2">
            <Button
              onClick={handleTest}
              disabled={testing || !url.trim() || !anonKey.trim()}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {testing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "اختبار الاتصال"
              )}
            </Button>

            {isAlreadyConnected && (
              <Button
                variant="outline"
                onClick={handleDisconnect}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                <Unplug className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* عرض SQL */}
          <div className="border-t border-border/20 pt-3">
            <button
              onClick={() => setShowSQL(!showSQL)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showSQL ? "▾ إخفاء SQL الجداول" : "▸ عرض SQL لإنشاء الجداول"}
            </button>

            {showSQL && (
              <div className="mt-2 relative">
                <pre
                  dir="ltr"
                  className="text-[10px] bg-[hsl(220,20%,6%)] border border-border/20 rounded-md p-3 overflow-auto max-h-48 text-muted-foreground"
                >
                  {SETUP_SQL.trim()}
                </pre>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopySQL}
                  className="absolute top-1 right-1 h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          <p className="text-[10px] text-muted-foreground leading-relaxed">
            💡 انسخ SQL أعلاه وشغّله في{" "}
            <span className="text-foreground font-medium">SQL Editor</span> في لوحة
            Supabase لإنشاء الجداول. ثم اضغط &quot;اختبار الاتصال&quot;.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SupabaseConnectModal;
