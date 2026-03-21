import { useState } from "react";
import { motion } from "framer-motion";
import {
  Eye, Smartphone, Monitor, Tablet, Code2,
  Home, Settings, User, Bell, Search, ShoppingCart,
  Heart, Star, ChevronRight, Menu, BarChart3,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useI18n } from "@/lib/i18n";

interface AppPreviewProps {
  isGenerated: boolean;
  appName: string;
}

type ViewMode = "desktop" | "tablet" | "mobile";

const viewWidths: Record<ViewMode, string> = {
  desktop: "w-full",
  tablet: "w-[768px] max-w-full",
  mobile: "w-[375px] max-w-full",
};

/** Renders a realistic generated app UI inside the emulator frame */
const GeneratedAppUI = ({ appName }: { appName: string }) => (
  <div className="h-[500px] flex flex-col bg-[hsl(220,25%,8%)] text-[hsl(210,15%,92%)] overflow-hidden">
    {/* Status bar */}
    <div className="flex items-center justify-between px-4 py-1.5 text-[10px] text-[hsl(210,10%,55%)]">
      <span>9:41</span>
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-2 rounded-sm border border-[hsl(210,10%,55%)]">
          <div className="w-3 h-1.5 rounded-[1px] bg-[hsl(90,60%,50%)] m-[0.5px]" />
        </div>
      </div>
    </div>

    {/* App header */}
    <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(220,20%,16%)]">
      <Menu className="h-5 w-5 text-[hsl(210,10%,55%)]" />
      <h1 className="text-sm font-bold tracking-wide" style={{ fontFamily: "'Inter', sans-serif" }}>
        {appName}
      </h1>
      <div className="flex items-center gap-3">
        <Search className="h-4 w-4 text-[hsl(210,10%,55%)]" />
        <div className="relative">
          <Bell className="h-4 w-4 text-[hsl(210,10%,55%)]" />
          <div className="absolute -top-1 -end-1 w-2 h-2 rounded-full bg-[hsl(0,72%,55%)]" />
        </div>
      </div>
    </div>

    {/* Content */}
    <div className="flex-1 overflow-auto p-4 space-y-4">
      {/* Hero card */}
      <div className="rounded-xl p-4 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, hsl(55,90%,45%), hsl(90,60%,40%))" }}>
        <p className="text-xs font-semibold text-[hsl(220,25%,8%)] opacity-70">WELCOME BACK</p>
        <p className="text-lg font-bold text-[hsl(220,25%,8%)] mt-1">Dashboard</p>
        <p className="text-xs text-[hsl(220,25%,8%)] opacity-60 mt-1">3 new notifications</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: BarChart3, label: "Sales", val: "1.2K" },
          { icon: User, label: "Users", val: "847" },
          { icon: Star, label: "Rating", val: "4.9" },
        ].map(({ icon: Icon, label, val }) => (
          <div key={label} className="rounded-lg p-3 bg-[hsl(220,20%,12%)] border border-[hsl(220,20%,18%)] text-center">
            <Icon className="h-4 w-4 mx-auto text-[hsl(55,90%,55%)] mb-1" />
            <p className="text-xs text-[hsl(210,10%,55%)]">{label}</p>
            <p className="text-sm font-bold">{val}</p>
          </div>
        ))}
      </div>

      {/* List items */}
      <div className="space-y-2">
        {["Premium Feature", "Analytics Module", "User Settings"].map((item) => (
          <div key={item} className="flex items-center justify-between p-3 rounded-lg bg-[hsl(220,20%,12%)] border border-[hsl(220,20%,18%)]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, hsl(55,90%,50%), hsl(90,60%,45%))" }}>
                <Settings className="h-4 w-4 text-[hsl(220,25%,8%)]" />
              </div>
              <span className="text-sm font-medium">{item}</span>
            </div>
            <ChevronRight className="h-4 w-4 text-[hsl(210,10%,55%)]" />
          </div>
        ))}
      </div>

      {/* CTA button */}
      <button className="w-full py-3 rounded-xl text-sm font-bold text-[hsl(220,25%,8%)]"
        style={{ background: "linear-gradient(135deg, hsl(55,90%,50%), hsl(90,60%,45%))" }}>
        Get Started
      </button>
    </div>

    {/* Bottom nav */}
    <div className="flex items-center justify-around py-2.5 border-t border-[hsl(220,20%,16%)] bg-[hsl(220,20%,10%)]">
      {[
        { icon: Home, label: "Home", active: true },
        { icon: Heart, label: "Saved", active: false },
        { icon: ShoppingCart, label: "Cart", active: false },
        { icon: User, label: "Profile", active: false },
      ].map(({ icon: Icon, label, active }) => (
        <div key={label} className="flex flex-col items-center gap-0.5">
          <Icon className={`h-5 w-5 ${active ? "text-[hsl(55,90%,55%)]" : "text-[hsl(210,10%,40%)]"}`} />
          <span className={`text-[10px] ${active ? "text-[hsl(55,90%,55%)] font-medium" : "text-[hsl(210,10%,40%)]"}`}>
            {label}
          </span>
        </div>
      ))}
    </div>
  </div>
);

const AppPreview = ({ isGenerated, appName }: AppPreviewProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>("mobile");
  const [showCode, setShowCode] = useState(false);
  const { t } = useI18n();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="sf-glass rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold text-foreground">
            {t("preview.title")}
          </h2>
          {isGenerated && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full sf-gradient-bg text-background">
              LIVE
            </span>
          )}
          <Tooltip>
            <TooltipTrigger>
              <span className="text-xs sf-glass-subtle text-muted-foreground px-2 py-0.5 rounded-full cursor-help">
                ?
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs text-sm">{t("preview.tooltip")}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center gap-1 sf-glass-subtle rounded-lg p-1">
          {([
            { mode: "desktop" as const, icon: Monitor },
            { mode: "tablet" as const, icon: Tablet },
            { mode: "mobile" as const, icon: Smartphone },
          ]).map(({ mode, icon: Icon }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`p-2 rounded-md transition-all ${
                viewMode === mode
                  ? "sf-glass-strong text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
          <div className="w-px h-5 bg-foreground/20 mx-1" />
          <button
            onClick={() => setShowCode(!showCode)}
            className={`p-2 rounded-md transition-all ${
              showCode
                ? "sf-glass-strong text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Code2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Emulator frame */}
      <div className={`mx-auto transition-all duration-300 ${viewWidths[viewMode]}`}>
        {/* Device bezel */}
        <div className="rounded-[2rem] border-2 border-[hsl(220,20%,22%)] bg-[hsl(220,25%,6%)] p-1.5 shadow-2xl">
          {/* Notch */}
          <div className="flex justify-center mb-[-6px] relative z-10">
            <div className="w-24 h-5 bg-[hsl(220,25%,6%)] rounded-b-xl" />
          </div>

          {/* Screen */}
          <div className="rounded-[1.4rem] overflow-hidden">
            {!isGenerated ? (
              <div className="flex flex-col items-center justify-center h-[500px] bg-[hsl(220,25%,8%)] text-muted-foreground">
                <Smartphone className="h-16 w-16 mb-4 opacity-20" />
                <p className="text-sm">{t("preview.empty")}</p>
                <p className="text-xs mt-1 opacity-60">{t("preview.hint")}</p>
              </div>
            ) : showCode ? (
              <div className="h-[500px] overflow-auto p-4 bg-[hsl(220,25%,6%)] text-[hsl(90,60%,50%)] font-mono text-xs leading-relaxed">
                <pre className="whitespace-pre-wrap">{`// ${appName} — Generated by Sirou Factory
// Sovereign Dark/Gold Theme Applied

import React from 'react';
import { Home, User, Settings } from 'lucide-react';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-sovereign-dark">
      <header className="sovereign-gradient p-4">
        <h1 className="text-xl font-bold">
          ${appName}
        </h1>
      </header>
      <nav className="bottom-nav">
        <Home /> <User /> <Settings />
      </nav>
    </div>
  );
};

export default App;`}</pre>
              </div>
            ) : (
              <GeneratedAppUI appName={appName} />
            )}
          </div>

          {/* Home indicator */}
          <div className="flex justify-center py-2">
            <div className="w-28 h-1 rounded-full bg-[hsl(210,10%,30%)]" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AppPreview;
