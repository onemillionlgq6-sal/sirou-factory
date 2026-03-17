import { useState } from "react";
import { Puzzle, Check, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

const PLUGINS_KEY = "sirou_plugins";

interface Plugin {
  id: string;
  name: string;
  description: string;
  category: "auth" | "payments" | "maps" | "analytics";
  verified: boolean;
  enabled: boolean;
}

const DEFAULT_PLUGINS: Plugin[] = [
  { id: "auth-email", name: "Email Auth", description: "Email/password authentication via Supabase", category: "auth", verified: true, enabled: false },
  { id: "auth-oauth", name: "OAuth 2.0", description: "Google, GitHub, Apple sign-in", category: "auth", verified: true, enabled: false },
  { id: "pay-stripe", name: "Stripe", description: "Payment processing and subscriptions", category: "payments", verified: true, enabled: false },
  { id: "maps-leaflet", name: "Leaflet Maps", description: "Open-source interactive maps", category: "maps", verified: true, enabled: false },
  { id: "analytics-posthog", name: "PostHog", description: "Privacy-friendly product analytics", category: "analytics", verified: true, enabled: false },
];

const loadPlugins = (): Plugin[] => {
  try {
    const raw = localStorage.getItem(PLUGINS_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_PLUGINS;
  } catch {
    return DEFAULT_PLUGINS;
  }
};

interface PluginsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PluginsModal = ({ open, onOpenChange }: PluginsModalProps) => {
  const { t } = useI18n();
  const [plugins, setPlugins] = useState<Plugin[]>(loadPlugins);

  const toggle = (id: string) => {
    const updated = plugins.map((p) =>
      p.id === id ? { ...p, enabled: !p.enabled } : p
    );
    setPlugins(updated);
    localStorage.setItem(PLUGINS_KEY, JSON.stringify(updated));
    const plugin = updated.find((p) => p.id === id);
    toast.success(plugin?.enabled ? t("plugins.enabled") : t("plugins.disabled"));
  };

  const categoryColors: Record<string, string> = {
    auth: "text-blue-400",
    payments: "text-emerald-400",
    maps: "text-amber-400",
    analytics: "text-purple-400",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sf-glass-strong border-foreground/20 text-foreground max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Puzzle className="h-5 w-5 text-sf-safe" />
            {t("plugins.title")}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {t("plugins.desc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-72 overflow-y-auto">
          {plugins.map((plugin) => (
            <div
              key={plugin.id}
              className="sf-glass-subtle rounded-xl px-4 py-3 flex items-center justify-between"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{plugin.name}</span>
                  {plugin.verified && (
                    <Shield className="h-3.5 w-3.5 text-sf-safe" />
                  )}
                  <span className={`text-[10px] ${categoryColors[plugin.category]}`}>
                    {plugin.category}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{plugin.description}</p>
              </div>
              <Switch
                checked={plugin.enabled}
                onCheckedChange={() => toggle(plugin.id)}
              />
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PluginsModal;
