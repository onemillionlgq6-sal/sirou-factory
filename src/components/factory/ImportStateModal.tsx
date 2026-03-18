import { useState, useCallback, useRef } from "react";
import { Upload, ShieldCheck, FileJson, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";
import { importFactoryState } from "@/lib/factory-actions";
import { hasEncryptedVault } from "@/lib/crypto";
import { toast } from "sonner";

interface ImportStateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ImportStateModal = ({ open, onOpenChange }: ImportStateModalProps) => {
  const { t } = useI18n();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [masterKey, setMasterKey] = useState("");
  const [needsKey, setNeedsKey] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0];
      if (!selected) return;
      setFile(selected);
      setResult(null);

      // Quick peek to see if vault data exists
      try {
        const text = await selected.text();
        const parsed = JSON.parse(text);
        const stateData = parsed.systemState || parsed;
        setNeedsKey(!!stateData.sirou_secure_vault_enc);
      } catch {
        setNeedsKey(false);
      }
    },
    []
  );

  const handleImport = useCallback(async () => {
    if (!file) {
      toast.error(t("import.select.file"));
      return;
    }

    setImporting(true);
    setResult(null);

    const res = await importFactoryState(file, needsKey ? masterKey : undefined);

    setResult({ success: res.success, message: res.message });

    if (res.success) {
      toast.success(res.message);
      // Reload to apply restored state
      setTimeout(() => window.location.reload(), 1500);
    } else {
      toast.error(res.message);
    }

    setImporting(false);
  }, [file, masterKey, needsKey, t]);

  const reset = useCallback(() => {
    setFile(null);
    setMasterKey("");
    setNeedsKey(false);
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  }, []);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sf-glass-strong border-foreground/20 text-foreground max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            {t("import.title")}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {t("import.desc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* File picker */}
          <div
            onClick={() => fileRef.current?.click()}
            className="sf-glass-subtle rounded-xl border-2 border-dashed border-foreground/20 p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
          >
            <FileJson className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              {file ? file.name : t("import.drop")}
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {/* Master key input (if vault data detected) */}
          {needsKey && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-amber-400">
              <ShieldCheck className="h-4 w-4" />
                {t("import.vault.detected" as any)}
              </div>
              <Input
                type="password"
                value={masterKey}
                onChange={(e) => setMasterKey(e.target.value)}
                placeholder={t("vault.master.placeholder")}
                className="sf-glass-subtle border-foreground/20 text-foreground placeholder:text-muted-foreground"
              />
            </div>
          )}

          {/* Result display */}
          {result && (
            <div
              className={`flex items-start gap-2 rounded-lg p-3 text-sm ${
                result.success
                  ? "bg-sf-safe/10 text-sf-safe border border-sf-safe/20"
                  : "bg-destructive/10 text-destructive border border-destructive/20"
              }`}
            >
              {result.success ? (
                <CheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              )}
              <span>{result.message}</span>
            </div>
          )}

          <Button
            onClick={handleImport}
            disabled={!file || importing || (needsKey && !masterKey.trim())}
            className="w-full sf-gradient-bg text-primary-foreground"
          >
            {importing ? "..." : t("import.restore")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportStateModal;
