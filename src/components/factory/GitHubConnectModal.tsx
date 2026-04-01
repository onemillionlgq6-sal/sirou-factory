/**
 * GitHubConnectModal — ربط GitHub بـ Sirou Factory.
 * يدعم طريقتين: OAuth (تلقائي) أو PAT (يدوي).
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  storeGitHubCredentials,
  clearGitHubCredentials,
  getGitHubCredentials,
  testGitHubConnection,
  getLastSyncStatus,
  getRepoUrl,
} from "@/lib/github-sync";
import { startGitHubOAuth, getOAuthApp } from "@/lib/github-oauth";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Unplug,
  ExternalLink,
  GitBranch,
  LogIn,
  KeyRound,
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
  const [oauthLoading, setOauthLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [tab, setTab] = useState<string>("oauth");

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

  // ── OAuth Flow ──
  const handleOAuth = async () => {
    const oauthApp = getOAuthApp();
    if (!oauthApp?.clientId || !oauthApp?.clientSecret) {
      toast.error("أدخل GitHub OAuth App credentials في الإعدادات أولاً (⚙️)");
      return;
    }

    setOauthLoading(true);
    setStatus("idle");

    const result = await startGitHubOAuth();

    if (result.ok && result.token && result.login) {
      // Got token + username, now need repo info
      setToken(result.token);
      setOwner(result.login);
      setStatus("ok");
      setStatusMsg(`تم تسجيل الدخول كـ ${result.login} ✅ — أدخل اسم المستودع`);
      toast.success(`مرحباً ${result.login}! أدخل اسم المستودع للإكمال`);
    } else {
      setStatus("error");
      setStatusMsg(result.error || "فشل OAuth");
    }

    setOauthLoading(false);
  };

  const handleOAuthConnect = async () => {
    if (!token || !owner || !repo.trim()) {
      toast.error("أدخل اسم المستودع");
      return;
    }
    setTesting(true);
    const creds = {
      token,
      owner,
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

  // ── PAT Flow ──
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
  const hasOAuthApp = !!getOAuthApp()?.clientId;

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

        {/* Already connected info */}
        {isAlreadyConnected && (
          <div className="space-y-3">
            {syncStatus.lastPush && (
              <div className="flex items-center justify-between text-[10px] text-muted-foreground px-3 py-2 rounded-md bg-[hsl(220,20%,14%)] border border-border/20">
                <span>آخر مزامنة: {new Date(syncStatus.lastPush).toLocaleString("ar-SA")}</span>
                {syncStatus.lastCommit && (
                  <code className="text-[hsl(220,60%,70%)]">{syncStatus.lastCommit.slice(0, 7)}</code>
                )}
              </div>
            )}
            <div className="flex gap-2">
              {repoUrl && (
                <Button
                  variant="outline"
                  onClick={() => window.open(repoUrl, "_blank")}
                  className="flex-1 border-border/30 text-muted-foreground hover:text-foreground gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  فتح المستودع
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleDisconnect}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10 gap-2"
              >
                <Unplug className="h-4 w-4" />
                فصل
              </Button>
            </div>
          </div>
        )}

        {/* Connection methods */}
        {!isAlreadyConnected && (
          <Tabs value={tab} onValueChange={setTab} className="mt-2">
            <TabsList className="grid grid-cols-2 bg-[hsl(220,20%,14%)]">
              <TabsTrigger value="oauth" className="gap-1.5 text-xs data-[state=active]:bg-[hsl(220,20%,20%)]">
                <LogIn className="h-3.5 w-3.5" />
                OAuth (تلقائي)
              </TabsTrigger>
              <TabsTrigger value="pat" className="gap-1.5 text-xs data-[state=active]:bg-[hsl(220,20%,20%)]">
                <KeyRound className="h-3.5 w-3.5" />
                Token (يدوي)
              </TabsTrigger>
            </TabsList>

            {/* ── OAuth Tab ── */}
            <TabsContent value="oauth" className="space-y-4 mt-4">
              {!hasOAuthApp && (
                <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-md">
                  ⚠️ أعدّ GitHub OAuth App أولاً من الإعدادات (⚙️) → GitHub OAuth
                </div>
              )}

              {/* Step 1: Sign in */}
              {!owner && (
                <Button
                  onClick={handleOAuth}
                  disabled={oauthLoading || !hasOAuthApp}
                  className="w-full h-12 bg-[hsl(220,10%,15%)] hover:bg-[hsl(220,10%,20%)] text-foreground border border-border/30 gap-2"
                >
                  {oauthLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <GitBranch className="h-5 w-5" />
                  )}
                  {oauthLoading ? "جاري التفويض..." : "تسجيل الدخول عبر GitHub"}
                </Button>
              )}

              {/* Step 2: After OAuth — enter repo */}
              {owner && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    متصل كـ <span className="font-mono font-bold">{owner}</span>
                  </div>
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
                  <Button
                    onClick={handleOAuthConnect}
                    disabled={testing || !repo.trim()}
                    className="w-full bg-[hsl(220,50%,45%)] hover:bg-[hsl(220,50%,40%)] text-white"
                  >
                    {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : "ربط المستودع"}
                  </Button>
                </div>
              )}

              <p className="text-[10px] text-muted-foreground leading-relaxed">
                💡 يفتح نافذة GitHub للتفويض تلقائياً — لا حاجة لنسخ توكن يدوياً.
                يتطلب إعداد GitHub OAuth App في الإعدادات.
              </p>
            </TabsContent>

            {/* ── PAT Tab ── */}
            <TabsContent value="pat" className="space-y-4 mt-4">
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

              <Button
                onClick={handleTest}
                disabled={testing || !token.trim() || !owner.trim() || !repo.trim()}
                className="w-full bg-[hsl(220,50%,45%)] hover:bg-[hsl(220,50%,40%)] text-white"
              >
                {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : "اختبار الاتصال"}
              </Button>
            </TabsContent>
          </Tabs>
        )}

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
      </DialogContent>
    </Dialog>
  );
};

export default GitHubConnectModal;
