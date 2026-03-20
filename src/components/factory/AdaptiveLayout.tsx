/**
 * AdaptiveLayout — Responsive wrapper that adapts to platform.
 * Android: Bottom navigation tabs + optional navigation drawer.
 * Web/Desktop: Standard side-by-side layout.
 */

import { useState, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Shield,
  Settings,
  Activity,
  Menu,
  X,
  Smartphone,
} from "lucide-react";
import { usePlatform } from "@/hooks/use-platform";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

interface AdaptiveLayoutProps {
  children: ReactNode;
  /** Show bottom tabs on mobile */
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const tabs = [
  { id: "factory", icon: LayoutDashboard, labelKey: "nav.factory" },
  { id: "security", icon: Shield, labelKey: "nav.security" },
  { id: "health", icon: Activity, labelKey: "nav.health" },
  { id: "settings", icon: Settings, labelKey: "nav.settings" },
];

const AdaptiveLayout = ({
  children,
  activeTab = "factory",
  onTabChange,
}: AdaptiveLayoutProps) => {
  const { isMobile, isAndroid, hapticTap } = usePlatform();
  const { t } = useI18n();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleTabPress = (tabId: string) => {
    hapticTap();
    onTabChange?.(tabId);
  };

  // Desktop: pass through without modifications
  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Android Navigation Drawer Overlay */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-0 start-0 bottom-0 w-72 z-50 sf-glass-strong border-e border-foreground/10 p-4"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-sf-safe" />
                  <span className="font-semibold text-foreground text-sm">
                    {t("app.title")}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDrawerOpen(false)}
                  className="h-8 w-8 text-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <nav className="space-y-1">
                {tabs.map(({ id, icon: Icon, labelKey }) => (
                  <button
                    key={id}
                    onClick={() => {
                      handleTabPress(id);
                      setDrawerOpen(false);
                    }}
                    className={`flex items-center gap-3 w-full px-3 py-3 rounded-lg text-sm font-medium transition-colors min-h-[48px] ${
                      activeTab === id
                        ? "sf-gradient-bg text-primary-foreground"
                        : "text-foreground/70 hover:text-foreground hover:bg-foreground/5"
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {t(labelKey)}
                  </button>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Hamburger for drawer (Android only) */}
      {isAndroid && (
        <div className="sticky top-0 z-30 flex items-center px-4 py-2 sf-glass-subtle">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              hapticTap();
              setDrawerOpen(true);
            }}
            className="h-10 w-10 text-foreground"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* Main content area */}
      <main className="flex-1 overflow-y-auto">{children}</main>

      {/* Bottom Navigation Tabs */}
      <nav className="sticky bottom-0 z-30 sf-glass-strong border-t border-foreground/10 safe-area-bottom">
        <div className="flex items-center justify-around px-2 py-1">
          {tabs.map(({ id, icon: Icon, labelKey }) => (
            <button
              key={id}
              onClick={() => handleTabPress(id)}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg min-w-[64px] min-h-[48px] transition-colors ${
                activeTab === id
                  ? "text-sf-safe"
                  : "text-muted-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium leading-tight">
                {t(labelKey)}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default AdaptiveLayout;
