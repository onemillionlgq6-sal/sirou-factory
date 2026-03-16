import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { KeyRound, Plus, Trash2, Eye, EyeOff, ShieldCheck } from "lucide-react";
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
import { toast } from "sonner";

interface VaultEntry {
  id: string;
  label: string;
  value: string;
  category: "api" | "certificate" | "token";
  addedAt: string;
}

const VAULT_KEY = "sirou_secure_vault";

const loadVault = (): VaultEntry[] => {
  try {
    const raw = localStorage.getItem(VAULT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveVault = (entries: VaultEntry[]) => {
  localStorage.setItem(VAULT_KEY, JSON.stringify(entries));
};

interface SecureVaultProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SecureVault = ({ open, onOpenChange }: SecureVaultProps) => {
  const { t } = useI18n();
  const [entries, setEntries] = useState<VaultEntry[]>(loadVault);
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [category, setCategory] = useState<VaultEntry["category"]>("api");
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());

  const addEntry = useCallback(() => {
    if (!label.trim() || !value.trim()) {
      toast.error(t("vault.fill.required"));
      return;
    }
    const newEntry: VaultEntry = {
      id: crypto.randomUUID(),
      label: label.trim(),
      value: value.trim(),
      category,
      addedAt: new Date().toISOString(),
    };
    const updated = [...entries, newEntry];
    setEntries(updated);
    saveVault(updated);
    setLabel("");
    setValue("");
    toast.success(t("vault.added"));
  }, [label, value, category, entries, t]);

  const removeEntry = useCallback(
    (id: string) => {
      const updated = entries.filter((e) => e.id !== id);
      setEntries(updated);
      saveVault(updated);
      toast(t("vault.removed"));
    },
    [entries, t]
  );

  const toggleVisible = (id: string) => {
    setVisibleIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const categoryLabels = {
    api: t("vault.cat.api"),
    certificate: t("vault.cat.cert"),
    token: t("vault.cat.token"),
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sf-glass-strong border-foreground/20 text-foreground max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-sf-safe" />
            {t("vault.title")}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {t("vault.desc")}
          </DialogDescription>
        </DialogHeader>

        {/* Add new entry */}
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {(["api", "certificate", "token"] as const).map((cat) => (
              <Button
                key={cat}
                variant={category === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setCategory(cat)}
                className={
                  category === cat
                    ? "sf-gradient-bg text-primary-foreground"
                    : "sf-glass-subtle border-foreground/20 text-foreground"
                }
              >
                {categoryLabels[cat]}
              </Button>
            ))}
          </div>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={t("vault.label.placeholder")}
            className="sf-glass-subtle border-foreground/20 text-foreground placeholder:text-muted-foreground"
          />
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            type="password"
            placeholder={t("vault.value.placeholder")}
            className="sf-glass-subtle border-foreground/20 text-foreground placeholder:text-muted-foreground"
          />
          <Button
            onClick={addEntry}
            className="w-full sf-gradient-bg text-primary-foreground"
          >
            <Plus className="h-4 w-4 me-2" />
            {t("vault.add")}
          </Button>
        </div>

        {/* Stored entries */}
        {entries.length > 0 && (
          <div className="space-y-2 mt-4 max-h-48 overflow-y-auto">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="sf-glass-subtle rounded-xl px-4 py-3 flex items-center justify-between"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-3.5 w-3.5 text-sf-safe shrink-0" />
                    <span className="text-sm font-medium text-foreground truncate">
                      {entry.label}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full sf-glass-subtle text-muted-foreground">
                      {categoryLabels[entry.category]}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono truncate">
                    {visibleIds.has(entry.id)
                      ? entry.value
                      : "•".repeat(Math.min(entry.value.length, 24))}
                  </p>
                </div>
                <div className="flex items-center gap-1 ms-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleVisible(entry.id)}
                    className="h-8 w-8 p-0 text-foreground/60"
                  >
                    {visibleIds.has(entry.id) ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeEntry(entry.id)}
                    className="h-8 w-8 p-0 text-destructive/70"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {entries.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t("vault.empty")}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SecureVault;
