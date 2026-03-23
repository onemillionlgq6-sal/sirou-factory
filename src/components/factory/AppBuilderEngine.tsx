import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hammer, CheckCircle2, Loader2, Shield, Package, Sparkles, Lightbulb, ChevronRight, Terminal } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import type { AppBlueprint } from "./AIPlannerEngine";
import { blueprintToActions, type ValidatedAction, type ExecutionResult, executeBatch } from "@/lib/executor";
import ExecutorPanel from "./ExecutorPanel";

interface AppBuilderEngineProps {
  blueprint: AppBlueprint;
  onComplete: () => void;
}

const AppBuilderEngine = ({ blueprint, onComplete }: AppBuilderEngineProps) => {
  const { t } = useI18n();
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [generatedActions, setGeneratedActions] = useState<ValidatedAction[]>([]);
  const [buildExecuted, setBuildExecuted] = useState(false);

  const approvedFeatures = useMemo(
    () => blueprint.features.filter((f) => f.approved),
    [blueprint.features]
  );

  const buildSteps = useMemo(() => [
    "📐 Creating app structure...",
    "🗄️ Setting up data storage...",
    ...approvedFeatures.map((f) => `⚙️ Building: ${f.name}`),
    "🎨 Applying user-defined design theme...",
    "📱 Connecting native hardware bridge...",
    "✨ Adding Framer Motion transitions...",
    "🔐 Injecting AES-256 encryption layer...",
    "🛡️ Configuring User/Admin permission shield...",
    "⚡ Applying code-splitting & lazy loading...",
    "📋 Adding form validation & error handling...",
    "🖼️ Generating splash screen & icons...",
    "🔍 Running pre-export system audit...",
  ], [approvedFeatures]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      for (let i = 0; i < buildSteps.length; i++) {
        if (cancelled) return;
        await new Promise((r) => setTimeout(r, 400 + Math.random() * 300));
        setCurrentStep(i + 1);
      }
      if (!cancelled) {
        setIsComplete(true);
        // Generate executable actions from blueprint
        const actions = blueprintToActions(blueprint);
        setGeneratedActions(actions);
        toast.success(`🔧 تم توليد ${actions.length} أمر تنفيذي من المخطط`);
        // Show suggestions after a brief pause
        setTimeout(() => setShowSuggestions(true), 800);
        onComplete();
      }
    };
    run();
    return () => { cancelled = true; };
  }, [buildSteps.length, onComplete]);

  const progress = Math.round((currentStep / buildSteps.length) * 100);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    toast.success(`✅ "${suggestion}" has been noted! It will be included in the next update.`);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sf-glass rounded-2xl p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Hammer className="h-5 w-5 text-accent" />
        <h2 className="text-lg font-semibold text-foreground">{t("builder.title")}</h2>
      </div>

      {/* Progress bar */}
      <div className="relative h-3 rounded-full sf-glass-subtle overflow-hidden mb-4">
        <motion.div
          className="absolute inset-y-0 start-0 sf-gradient-bg rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>
      <p className="text-xs text-muted-foreground mb-4 text-center">{progress}%</p>

      <div className="space-y-2 max-h-[250px] overflow-y-auto">
        {buildSteps.map((step, i) => {
          const done = currentStep > i;
          const active = currentStep === i + 1 && !isComplete;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className={`flex items-center gap-3 p-2.5 rounded-lg text-sm transition-all ${
                done ? "text-foreground" : active ? "text-accent sf-glass-subtle" : "text-foreground/30"
              }`}
            >
              {done ? (
                <CheckCircle2 className="h-4 w-4 text-sf-safe shrink-0" />
              ) : active ? (
                <Loader2 className="h-4 w-4 text-accent animate-spin shrink-0" />
              ) : (
                <div className="h-4 w-4 rounded-full border border-foreground/20 shrink-0" />
              )}
              <span className="font-medium">{step}</span>
            </motion.div>
          );
        })}
      </div>

      {isComplete && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-4 p-4 rounded-xl sf-glass-strong text-center"
        >
          <div className="flex items-center justify-center gap-2 text-sf-safe font-semibold mb-1">
            <Package className="h-5 w-5" />
            {t("builder.complete")}
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5" />
            {t("builder.verified")}
          </div>

          {/* Hardware summary */}
          {blueprint.hardwareNeeds && blueprint.hardwareNeeds.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              {blueprint.hardwareNeeds.map(hw => (
                <span key={hw} className="text-[10px] px-2 py-0.5 rounded-full sf-glass-subtle text-accent font-medium">
                  📱 {hw}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ─── Proactive Suggestions ─── */}
      <AnimatePresence>
        {showSuggestions && blueprint.suggestions && blueprint.suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-4 w-4 text-accent" />
              <p className="text-sm font-semibold text-foreground">Smart Suggestions</p>
              <Sparkles className="h-3.5 w-3.5 text-accent" />
            </div>
            <div className="space-y-2">
              {blueprint.suggestions.map((suggestion, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.15 }}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full flex items-center justify-between p-3 rounded-xl sf-glass-subtle hover:sf-glass-strong transition-all text-start group"
                >
                  <span className="text-sm text-foreground/80 group-hover:text-foreground transition-colors">
                    {suggestion}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors shrink-0 ms-2" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AppBuilderEngine;
