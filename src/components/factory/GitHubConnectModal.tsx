/**
 * GitHubConnectModal — ربط GitHub بـ Sirou Factory.
 * PAT token + owner/repo + اختبار + push + حالة المزامنة.
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
import {
  storeGitHubCredentials,
  clearGitHubCredentials,
  getGitHubCredentials,
  testGitHubConnection,
  getLastSyncStatus,
  getRepoUrl,
} from "@/lib/github-sync";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Unplug,
  ExternalLink,
  GitBranch,
} from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnectionChange?: (connected: boolean) => void;
}

const GitHubConnectModal = ({ open, onOpenChange, onConnectionChange }: Props) => {
  const [token, setToken] = useState("");
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [branch, setBranch] = useState("main");
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    if (!open) return;
    const creds = getGitHubCredentials();
    if (creds) {
      setToken(creds.token);
      setOwner(creds.owner);
      setRepo(creds.repo);
      setBranch(creds.branch);
    }
  }, [open]);

  const handleTest = async () => {
    if (!token.trim() || !owner.trim() || !repo.trim()) {
      toast.error("أدخل جميع الحقول المطلوبة");
      return;
    }
    setTesting(true);
    setStatus("idle");

    const creds = {
      token: token.trim(),
      owner: owner.trim(),
      repo: repo.trim(),
      branch: branch.trim() || "main",
    };

    const result = await testGitHubConnection(creds);
    setTesting(false);
    setStatus(result.ok ? "ok" : "error");
    setStatusMsg(result.message);

    if (result.ok) {
      storeGitHubCredentials(creds);
      toast.success("تم الربط بنجاح ✅");
      onConnectionChange?.(true);
    }
  };

  const handleDisconnect = () => {
    clearGitHubCredentials();
    setToken("");
    setOwner("");
    setRepo("");
    setBranch("main");
    setStatus("idle");
    setStatusMsg("");
    onConnectionChange?.(false);
    toast.info("تم قطع اتصال GitHub");
  };

  const isAlreadyConnected = !!getGitHubCredentials();
  const syncStatus = getLastSyncStatus();
  const repoUrl = getRepoUrl();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-[hsl(220,20%,10%)] border-border/30 text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <GitBranch className="h-5 w-5 text-[hsl(220,60%,70%)]" />
            ربط GitHub
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            اربط مستودع GitHub لحفظ الكود تلقائياً مع تاريخ إصدارات كامل.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Token */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Personal Access Token (PAT)</Label>
            <Input
              dir="ltr"
              type="password"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="bg-[hsl(220,20%,14%)] border-border/30 text-foreground text-sm"
            />
            <p className="text-[10px] text-muted-foreground">
              أنشئ token من{" "}
              <a
                href="https://github.com/settings/tokens/new?scopes=repo"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[hsl(220,60%,70%)] hover:underline"
              >
                GitHub Settings → Tokens
              </a>{" "}
              مع صلاحية <code className="text-[hsl(220,60%,70%)]">repo</code>
            </p>
          </div>

          {/* Owner */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">اسم المستخدم / المنظمة</Label>
            <Input
              dir="ltr"
              placeholder="your-username"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              className="bg-[hsl(220,20%,14%)] border-border/30 text-foreground text-sm"
            />
          </div>

          {/* Repo + Branch */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">اسم المستودع</Label>
              <Input
                dir="ltr"
                placeholder="my-app"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                className="bg-[hsl(220,20%,14%)] border-border/30 text-foreground text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">الفرع</Label>
              <Input
                dir="ltr"
                placeholder="main"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="bg-[hsl(220,20%,14%)] border-border/30 text-foreground text-sm"
              />
            </div>
          </div>

          {/* Status */}
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

          {/* Sync Info */}
          {isAlreadyConnected && syncStatus.lastPush && (
            <div className="flex items-center justify-between text-[10px] text-muted-foreground px-3 py-2 rounded-md bg-[hsl(220,20%,14%)] border border-border/20">
              <span>
                آخر مزامنة:{" "}
                {new Date(syncStatus.lastPush).toLocaleString("ar-SA")}
              </span>
              {syncStatus.lastCommit && (
                <code className="text-[hsl(220,60%,70%)]">
                  {syncStatus.lastCommit.slice(0, 7)}
                </code>
              )}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleTest}
              disabled={testing || !token.trim() || !owner.trim() || !repo.trim()}
              className="flex-1 bg-[hsl(220,50%,45%)] hover:bg-[hsl(220,50%,40%)] text-white"
            >
              {testing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "اختبار الاتصال"
              )}
            </Button>

            {isAlreadyConnected && (
              <>
                {repoUrl && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(repoUrl, "_blank")}
                    className="border-border/30 text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={handleDisconnect}
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  <Unplug className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          <p className="text-[10px] text-muted-foreground leading-relaxed">
            💡 عند الربط، سيتم حفظ الكود تلقائياً في GitHub عند كل تغيير.
            إذا لم يكن المستودع موجوداً سيتم إنشاؤه تلقائياً كـ Private.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GitHubConnectModal;
