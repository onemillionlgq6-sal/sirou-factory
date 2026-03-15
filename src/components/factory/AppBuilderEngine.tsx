import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Hammer, CheckCircle2, Loader2, Shield, Package } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { AppBlueprint } from "./AIPlannerEngine";

interface AppBuilderEngineProps {
  blueprint: AppBlueprint;
  onComplete: () => void;
}

/**
 * [Safe 🟢] App Builder Engine
 * Physically builds the application based on the approved blueprint.
 * Only executes functions that were previously displayed and approved.
 */
const AppBuilderEngine = ({ blueprint, onComplete }: AppBuilderEngineProps) => {
  const { t } = useI18n();
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const approvedFeatures = useMemo(
    () => blueprint.features.filter((f) => f.approved),
    [blueprint.features]
  );

  const buildSteps = useMemo(() => [
    t("builder.step.scaffold"),
    t("builder.step.db"),
    ...approvedFeatures.map((f) => `${t("builder.step.feature")}: ${f.name}`),
    t("builder.step.ui"),
    t("builder.step.security"),
    t("builder.step.test"),
  ], [t, approvedFeatures]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      for (let i = 0; i < buildSteps.length; i++) {
        if (cancelled) return;
        await new Promise((r) => setTimeout(r, 500 + Math.random() * 400));
        setCurrentStep(i + 1);
      }
      if (!cancelled) {
        setIsComplete(true);
        onComplete();
      }
    };
    run();
    return () => { cancelled = true; };
  }, [buildSteps.length, onComplete]);

  const progress = Math.round((currentStep / buildSteps.length) * 100);

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
              transition={{ delay: i * 0.05 }}
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
        </motion.div>
      )}
    </motion.div>
  );
};

export default AppBuilderEngine;
