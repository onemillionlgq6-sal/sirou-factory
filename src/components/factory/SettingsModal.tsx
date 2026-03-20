import { useState, useCallback } from "react";
import { Settings, Moon, Sun, Globe, Paintbrush } from "lucide-react";
import { usePlatform } from "@/hooks/use-platform";
import type { VisualStyle } from "@/lib/platform";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

const PREFS_KEY = "sirou_factory_prefs";

interface FactoryPrefs {
  theme: "dark" | "light" | "system";
  aiProvider: "built-in" | "openai" | "anthropic";
}

const loadPrefs = (): FactoryPrefs => {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? JSON.parse(raw) : { theme: "dark", aiProvider: "built-in" };
  } catch {
    return { theme: "dark", aiProvider: "built-in" };
  }
};

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingsModal = ({ open, onOpenChange }: SettingsModalProps) => {
  const { t, lang, setLang } = useI18n();
  const { visualStyle, setVisualStyle: changeVisualStyle } = usePlatform();
  const [prefs, setPrefs] = useState<FactoryPrefs>(loadPrefs);

  const save = useCallback((updated: FactoryPrefs) => {
    setPrefs(updated);
    localStorage.setItem(PREFS_KEY, JSON.stringify(updated));

    // Apply theme
    if (updated.theme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (updated.theme === "light") {
      document.documentElement.classList.remove("dark");
    }
    toast.success(t("settings.saved"));
  }, [t]);

  const themes: { value: FactoryPrefs["theme"]; icon: typeof Moon; label: string }[] = [
    { value: "dark", icon: Moon, label: t("settings.theme.dark") },
    { value: "light", icon: Sun, label: t("settings.theme.light") },
  ];

  const aiProviders: { value: FactoryPrefs["aiProvider"]; label: string }[] = [
    { value: "built-in", label: t("settings.ai.builtin") },
    { value: "openai", label: "OpenAI" },
    { value: "anthropic", label: "Anthropic" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sf-glass-strong border-foreground/20 text-foreground max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-sf-safe" />
            {t("settings.title")}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {t("settings.desc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Theme */}
          <div>
            <p className="text-sm font-medium text-foreground mb-2">{t("settings.theme")}</p>
            <div className="grid grid-cols-2 gap-2">
              {themes.map(({ value, icon: Icon, label }) => (
                <Button
                  key={value}
                  variant={prefs.theme === value ? "default" : "outline"}
                  size="sm"
                  onClick={() => save({ ...prefs, theme: value })}
                  className={
                    prefs.theme === value
                      ? "sf-gradient-bg text-primary-foreground"
                      : "sf-glass-subtle border-foreground/20 text-foreground"
                  }
                >
                  <Icon className="h-4 w-4 me-2" />
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* AI Provider */}
          <div>
            <p className="text-sm font-medium text-foreground mb-2">{t("settings.ai")}</p>
            <div className="grid grid-cols-3 gap-2">
              {aiProviders.map(({ value, label }) => (
                <Button
                  key={value}
                  variant={prefs.aiProvider === value ? "default" : "outline"}
                  size="sm"
                  onClick={() => save({ ...prefs, aiProvider: value })}
                  className={
                    prefs.aiProvider === value
                      ? "sf-gradient-bg text-primary-foreground"
                      : "sf-glass-subtle border-foreground/20 text-foreground"
                  }
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div>
            <p className="text-sm font-medium text-foreground mb-2">{t("settings.language")}</p>
            <div className="grid grid-cols-2 gap-2">
              {(["en", "ar"] as const).map((l) => (
                <Button
                  key={l}
                  variant={lang === l ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLang(l)}
                  className={
                    lang === l
                      ? "sf-gradient-bg text-primary-foreground"
                      : "sf-glass-subtle border-foreground/20 text-foreground"
                  }
                >
                  <Globe className="h-4 w-4 me-2" />
                  {l === "en" ? "English" : "العربية"}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
