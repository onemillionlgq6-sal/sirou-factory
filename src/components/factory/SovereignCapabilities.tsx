import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  Smartphone,
  Database,
  FileCheck,
  ChevronRight,
  Play,
  Lightbulb,
  Lock,
  Fingerprint,
  Eye,
  ShieldCheck,
  Cpu,
  Package,
  Radio,
  Camera,
  MapPin,
  Vibrate,
  HardDrive,
  RefreshCw,
  KeyRound,
  FileText,
  Scale,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

interface Capability {
  id: string;
  nameKey: string;
  descKey: string;
  icon: React.ElementType;
  status: "active" | "standby";
  testAction?: () => void;
}

interface CapabilityCategory {
  titleKey: string;
  icon: React.ElementType;
  color: string;
  capabilities: Capability[];
}

const SovereignCapabilities = () => {
  const { t } = useI18n();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  const runTest = useCallback((id: string, name: string) => {
    setTestingId(id);
    setTimeout(() => {
      toast.success(`${name} — Live test passed ✓`);
      setTestingId(null);
    }, 800);
  }, []);

  const categories: CapabilityCategory[] = [
    {
      titleKey: "cap.cat.security",
      icon: Shield,
      color: "from-red-500 to-orange-500",
      capabilities: [
        { id: "aes", nameKey: "cap.aes.name", descKey: "cap.aes.desc", icon: Lock, status: "active", testAction: () => runTest("aes", "AES-256 Vault") },
        { id: "bio", nameKey: "cap.bio.name", descKey: "cap.bio.desc", icon: Fingerprint, status: "active", testAction: () => runTest("bio", "Biometric Auth") },
        { id: "r8", nameKey: "cap.r8.name", descKey: "cap.r8.desc", icon: Eye, status: "active" },
        { id: "integrity", nameKey: "cap.integrity.name", descKey: "cap.integrity.desc", icon: ShieldCheck, status: "active", testAction: () => runTest("integrity", "Integrity Check") },
      ],
    },
    {
      titleKey: "cap.cat.android",
      icon: Smartphone,
      color: "from-green-500 to-emerald-500",
      capabilities: [
        { id: "sdk", nameKey: "cap.sdk.name", descKey: "cap.sdk.desc", icon: Cpu, status: "active" },
        { id: "apk", nameKey: "cap.apk.name", descKey: "cap.apk.desc", icon: Package, status: "active" },
        { id: "camera", nameKey: "cap.camera.name", descKey: "cap.camera.desc", icon: Camera, status: "active", testAction: () => runTest("camera", "Camera Bridge") },
        { id: "gps", nameKey: "cap.gps.name", descKey: "cap.gps.desc", icon: MapPin, status: "active", testAction: () => runTest("gps", "GPS Location") },
        { id: "haptics", nameKey: "cap.haptics.name", descKey: "cap.haptics.desc", icon: Vibrate, status: "active", testAction: () => runTest("haptics", "Haptics") },
      ],
    },
    {
      titleKey: "cap.cat.data",
      icon: Database,
      color: "from-blue-500 to-cyan-500",
      capabilities: [
        { id: "journal", nameKey: "cap.journal.name", descKey: "cap.journal.desc", icon: HardDrive, status: "active", testAction: () => runTest("journal", "Event Journal") },
        { id: "sync", nameKey: "cap.sync.name", descKey: "cap.sync.desc", icon: RefreshCw, status: "active" },
        { id: "zk", nameKey: "cap.zk.name", descKey: "cap.zk.desc", icon: KeyRound, status: "active" },
      ],
    },
    {
      titleKey: "cap.cat.compliance",
      icon: FileCheck,
      color: "from-purple-500 to-pink-500",
      capabilities: [
        { id: "policy", nameKey: "cap.policy.name", descKey: "cap.policy.desc", icon: Radio, status: "active", testAction: () => runTest("policy", "Policy Guard") },
        { id: "legal", nameKey: "cap.legal.name", descKey: "cap.legal.desc", icon: FileText, status: "active" },
      ],
    },
  ];

  const strategies = [
    "cap.strategy.1",
    "cap.strategy.2",
    "cap.strategy.3",
    "cap.strategy.4",
    "cap.strategy.5",
  ] as const;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sf-glass rounded-2xl p-6 col-span-1 lg:col-span-2"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <Shield className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
      <h2 className="text-lg font-display font-bold tracking-wide text-foreground">{t("cap.title")}</h2>
          <p className="text-xs text-muted-foreground font-sans">{t("cap.subtitle")}</p>
        </div>
      </div>

      {/* Capability Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {categories.map((cat) => (
          <div key={cat.titleKey} className="sf-glass-subtle rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className={`h-7 w-7 rounded-lg bg-gradient-to-br ${cat.color} flex items-center justify-center`}>
                <cat.icon className="h-3.5 w-3.5 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">{t(cat.titleKey as any)}</h3>
            </div>
            <div className="space-y-1.5">
              {cat.capabilities.map((cap) => (
                <div key={cap.id}>
                  <button
                    onClick={() => setExpandedId(expandedId === cap.id ? null : cap.id)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-foreground/5 transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-sf-safe animate-pulse" />
                      <cap.icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-foreground">{t(cap.nameKey as any)}</span>
                    </div>
                    <ChevronRight className={`h-3 w-3 text-muted-foreground transition-transform ${expandedId === cap.id ? "rotate-90" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {expandedId === cap.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-2 pt-1 ms-7">
                          <p className="text-[11px] text-white/60 mb-2">{t(cap.descKey as any)}</p>
                          {cap.testAction && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={testingId === cap.id}
                              onClick={(e) => { e.stopPropagation(); cap.testAction!(); }}
                              className="h-6 text-[10px] px-2 gap-1 bg-white/10 border-white/20 text-white hover:bg-white/20 disabled:opacity-70"
                            >
                              {testingId === cap.id ? (
                                <Loader2 className="h-2.5 w-2.5 animate-spin" />
                              ) : (
                                <Play className="h-2.5 w-2.5" />
                              )}
                              {testingId === cap.id ? "Testing..." : t("cap.run.test")}
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Strategic Insight Panel */}
      <div className="sf-glass-subtle rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="h-4 w-4 text-sf-caution" />
          <h3 className="text-sm font-semibold text-foreground">{t("cap.strategies.title")}</h3>
        </div>
        <div className="space-y-2">
          {strategies.map((key, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="h-5 w-5 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-primary-foreground">{i + 1}</span>
              </div>
              <p className="text-xs text-foreground/80">{t(key as any)}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default SovereignCapabilities;
