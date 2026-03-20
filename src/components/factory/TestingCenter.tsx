import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Smartphone, Tablet, Monitor, Play, RefreshCw,
  AlertTriangle, CheckCircle2, XCircle, Info, Send,
  Maximize2, FlipHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import type { AppBlueprint } from "@/components/factory/AIPlannerEngine";
import { runPreBuildScan, type ScanResult, type ScanIssue } from "@/lib/pre-build-scanner";
import { toast } from "sonner";

interface TestingCenterProps {
  blueprint: {
    features: Array<{ name: string; approved: boolean; category: string }>;
    entities: Array<{ name: string; fields: Array<{ name: string; type: string }> }>;
    pages: Array<{ name: string; route: string }>;
  } | null;
  appName: string;
  isGenerated: boolean;
}

type DevicePreset = "phone" | "tablet" | "foldable" | "desktop";

interface DeviceConfig {
  name: string;
  nameAr: string;
  width: number;
  height: number;
  icon: typeof Smartphone;
  bezelClass: string;
}

const DEVICES: Record<DevicePreset, DeviceConfig> = {
  phone: {
    name: "Phone",
    nameAr: "هاتف",
    width: 375,
    height: 667,
    icon: Smartphone,
    bezelClass: "rounded-[2rem] p-2",
  },
  tablet: {
    name: "Tablet",
    nameAr: "جهاز لوحي",
    width: 768,
    height: 500,
    icon: Tablet,
    bezelClass: "rounded-[1.5rem] p-3",
  },
  foldable: {
    name: "Foldable",
    nameAr: "قابل للطي",
    width: 884,
    height: 500,
    icon: FlipHorizontal,
    bezelClass: "rounded-[1.5rem] p-2",
  },
  desktop: {
    name: "Desktop",
    nameAr: "سطح المكتب",
    width: 1280,
    height: 500,
    icon: Monitor,
    bezelClass: "rounded-xl p-1",
  },
};

const severityIcon = (severity: ScanIssue["severity"]) => {
  switch (severity) {
    case "error": return <XCircle className="h-4 w-4 text-sf-danger" />;
    case "warning": return <AlertTriangle className="h-4 w-4 text-sf-caution" />;
    case "info": return <Info className="h-4 w-4 text-accent" />;
  }
};

const TestingCenter = ({ blueprint, appName, isGenerated }: TestingCenterProps) => {
  const { t, lang } = useI18n();
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [activeDevice, setActiveDevice] = useState<DevicePreset>("phone");
  const [isRotated, setIsRotated] = useState(false);

  const handleScan = useCallback(async () => {
    setIsScanning(true);
    setScanResult(null);
    // Simulate async scan with slight delay for UX
    await new Promise(r => setTimeout(r, 800));
    const result = await runPreBuildScan(blueprint);
    setScanResult(result);
    setIsScanning(false);

    if (result.passed) {
      toast.success(t("testing.scan.passed"));
    } else {
      toast.error(t("testing.scan.failed"));
    }
  }, [blueprint, t]);

  const handleRemoteTest = useCallback(() => {
    const bundle = {
      appName,
      blueprint,
      timestamp: new Date().toISOString(),
      config: { debugMode: true, targetSdk: 35 },
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${appName.replace(/\s+/g, "-").toLowerCase()}-debug-bundle.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t("testing.remote.exported"));
  }, [appName, blueprint, t]);

  const device = DEVICES[activeDevice];
  const previewW = isRotated ? device.height : device.width;
  const previewH = isRotated ? device.width : device.height;
  // Scale to fit within container
  const maxW = 580;
  const scale = Math.min(1, maxW / previewW);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sf-glass rounded-2xl p-6 space-y-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-semibold text-foreground">
            {t("testing.title")}
          </h2>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleScan}
            disabled={isScanning}
            className="sf-glass-subtle border-foreground/10 text-foreground gap-1.5"
          >
            {isScanning ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            {t("testing.scan.run")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRemoteTest}
            disabled={!blueprint}
            className="sf-glass-subtle border-foreground/10 text-foreground gap-1.5"
          >
            <Send className="h-3.5 w-3.5" />
            {t("testing.remote.btn")}
          </Button>
        </div>
      </div>

      {/* Pre-Build Scan Results */}
      <AnimatePresence>
        {scanResult && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            {/* Score bar */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 rounded-full bg-foreground/10 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${scanResult.score}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className={`h-full rounded-full ${
                    scanResult.score >= 80 ? "bg-sf-safe" :
                    scanResult.score >= 50 ? "bg-sf-caution" : "bg-sf-danger"
                  }`}
                />
              </div>
              <span className={`text-sm font-mono font-bold ${
                scanResult.score >= 80 ? "text-sf-safe" :
                scanResult.score >= 50 ? "text-sf-caution" : "text-sf-danger"
              }`}>
                {scanResult.score}/100
              </span>
              {scanResult.passed ? (
                <CheckCircle2 className="h-5 w-5 text-sf-safe" />
              ) : (
                <XCircle className="h-5 w-5 text-sf-danger" />
              )}
            </div>

            {/* Issues list */}
            {scanResult.issues.length > 0 && (
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {scanResult.issues.map((issue) => (
                  <div
                    key={issue.id}
                    className="sf-glass-subtle rounded-lg p-3 flex items-start gap-3"
                  >
                    <div className="mt-0.5">{severityIcon(issue.severity)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{issue.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{issue.description}</p>
                      {issue.fix && (
                        <p className="text-xs text-sf-safe mt-1 font-mono">💡 {issue.fix}</p>
                      )}
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full uppercase font-bold ${
                      issue.category === "security" ? "bg-sf-danger/20 text-sf-danger" :
                      issue.category === "permission" ? "bg-sf-caution/20 text-sf-caution" :
                      "bg-accent/20 text-accent"
                    }`}>
                      {issue.category}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground text-end">
              {t("testing.scan.time")}: {scanResult.duration.toFixed(0)}ms
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Device Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 sf-glass-subtle rounded-lg p-1">
          {(Object.entries(DEVICES) as [DevicePreset, DeviceConfig][]).map(([key, dev]) => {
            const Icon = dev.icon;
            return (
              <button
                key={key}
                onClick={() => { setActiveDevice(key); setIsRotated(false); }}
                className={`p-2 rounded-md transition-all flex items-center gap-1.5 ${
                  activeDevice === key
                    ? "sf-glass-strong text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs hidden sm:inline">
                  {lang === "ar" ? dev.nameAr : dev.name}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setIsRotated(!isRotated)}
          className="p-2 rounded-lg sf-glass-subtle text-muted-foreground hover:text-foreground transition-all"
          title={lang === "ar" ? "تدوير" : "Rotate"}
        >
          <Maximize2 className={`h-4 w-4 transition-transform ${isRotated ? "rotate-90" : ""}`} />
        </button>
      </div>

      {/* Virtual Simulator */}
      <div className="flex justify-center">
        <div
          className={`bg-foreground/5 border border-foreground/10 ${device.bezelClass} transition-all duration-300`}
          style={{
            width: previewW * scale + 24,
          }}
        >
          {/* Status bar */}
          <div className="flex items-center justify-between px-4 py-1 text-[10px] text-muted-foreground">
            <span>12:00</span>
            <span className="flex gap-1">
              <span>📶</span><span>🔋</span>
            </span>
          </div>

          {/* Screen */}
          <div
            className="bg-background/60 rounded-lg overflow-hidden mx-auto transition-all duration-300"
            style={{
              width: previewW * scale,
              height: previewH * scale,
            }}
          >
            {!isGenerated ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
                <Smartphone className="h-10 w-10 mb-3 opacity-20" />
                <p className="text-xs text-center">{t("testing.simulator.empty")}</p>
              </div>
            ) : (
              <div className="h-full flex flex-col">
                {/* Simulated app header */}
                <div className="sf-gradient-bg px-4 py-3">
                  <p className="text-sm font-semibold text-foreground">{appName}</p>
                </div>
                {/* Simulated content */}
                <div className="flex-1 p-4 space-y-3">
                  <div className="h-3 sf-glass-subtle rounded w-3/4" />
                  <div className="h-3 sf-glass-subtle rounded w-1/2" />
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <div className="h-16 sf-glass-subtle rounded-xl" />
                    <div className="h-16 sf-glass-subtle rounded-xl" />
                  </div>
                  <div className="h-8 sf-gradient-bg rounded-lg opacity-60 mt-3" />
                </div>
                {/* Bottom nav */}
                <div className="flex justify-around py-2 border-t border-foreground/10 sf-glass-subtle">
                  {["🏠", "🔍", "👤", "⚙️"].map((icon, i) => (
                    <span key={i} className="text-sm opacity-60">{icon}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Home indicator */}
          {activeDevice === "phone" && (
            <div className="flex justify-center mt-2">
              <div className="w-24 h-1 rounded-full bg-foreground/20" />
            </div>
          )}
        </div>
      </div>

      {/* Device info */}
      <p className="text-xs text-muted-foreground text-center">
        {previewW} × {previewH}px • {lang === "ar" ? device.nameAr : device.name}
        {isRotated ? (lang === "ar" ? " (أفقي)" : " (Landscape)") : ""}
      </p>
    </motion.div>
  );
};

export default TestingCenter;
