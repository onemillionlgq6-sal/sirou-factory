import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Database, Layout, Puzzle, CheckCircle2, XCircle, Edit3, Table2, FileCode2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import type { AppBlueprint, BlueprintFeature } from "./AIPlannerEngine";

interface InteractiveBlueprintProps {
  blueprint: AppBlueprint;
  onApprove: (blueprint: AppBlueprint) => void;
  onReject: () => void;
}

/**
 * [Safe 🟢] Interactive Blueprint Viewer
 * Displays the AI-generated app blueprint in glass frames.
 * Human-in-the-loop: user must approve before building.
 */
const InteractiveBlueprint = ({ blueprint, onApprove, onReject }: InteractiveBlueprintProps) => {
  const { t } = useI18n();
  const [features, setFeatures] = useState<BlueprintFeature[]>(blueprint.features);
  const [activeTab, setActiveTab] = useState<"entities" | "pages" | "features">("entities");

  const toggleFeature = useCallback((index: number) => {
    setFeatures((prev) =>
      prev.map((f, i) => (i === index ? { ...f, approved: !f.approved } : f))
    );
  }, []);

  const handleApprove = useCallback(() => {
    onApprove({ ...blueprint, features });
  }, [blueprint, features, onApprove]);

  const riskConfig = useMemo(() => ({
    safe: { emoji: "🟢", bg: "bg-sf-safe/15", border: "border-sf-safe/30", text: "text-sf-safe" },
    caution: { emoji: "🟡", bg: "bg-sf-caution/15", border: "border-sf-caution/30", text: "text-sf-caution" },
    danger: { emoji: "🔴", bg: "bg-sf-danger/15", border: "border-sf-danger/30", text: "text-sf-danger" },
  }), []);

  const tabs = useMemo(() => [
    { id: "entities" as const, label: t("blueprint.tab.entities"), icon: Table2 },
    { id: "pages" as const, label: t("blueprint.tab.pages"), icon: Layout },
    { id: "features" as const, label: t("blueprint.tab.features"), icon: Puzzle },
  ], [t]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sf-glass rounded-2xl p-6"
    >
      <div className="flex items-center gap-2 mb-2">
        <FileCode2 className="h-5 w-5 text-accent" />
        <h2 className="text-lg font-semibold text-foreground">{t("blueprint.title")}</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        {t("blueprint.subtitle")} — <span className="text-accent font-medium">{blueprint.appName}</span>
      </p>

      {/* Tabs */}
      <div className="flex gap-1 p-1 sf-glass-subtle rounded-xl mb-4">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === id
                ? "sf-glass-strong text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === "entities" && (
          <motion.div
            key="entities"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3 max-h-[300px] overflow-y-auto"
          >
            {blueprint.entities.map((entity, i) => (
              <div key={i} className="sf-glass-subtle rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="h-4 w-4 text-accent" />
                  <span className="font-semibold text-sm text-foreground">{entity.name}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {entity.fields.map((field) => (
                    <span
                      key={field}
                      className="text-xs px-2.5 py-1 rounded-full sf-glass-subtle text-muted-foreground font-mono"
                    >
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === "pages" && (
          <motion.div
            key="pages"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3 max-h-[300px] overflow-y-auto"
          >
            {blueprint.pages.map((page, i) => (
              <div key={i} className="sf-glass-subtle rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm text-foreground">{page.name}</span>
                  <code className="text-xs text-accent font-mono sf-glass-subtle px-2 py-0.5 rounded-full">
                    {page.route}
                  </code>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {page.components.map((comp) => (
                    <span
                      key={comp}
                      className="text-xs px-2.5 py-1 rounded-full sf-glass-subtle text-muted-foreground"
                    >
                      {comp}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === "features" && (
          <motion.div
            key="features"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2 max-h-[300px] overflow-y-auto"
          >
            {features.map((feature, i) => {
              const risk = riskConfig[feature.risk];
              return (
                <div
                  key={i}
                  className={`flex items-center justify-between p-3 rounded-xl border ${risk.border} ${risk.bg}`}
                >
                  <div className="flex items-center gap-2">
                    <span>{risk.emoji}</span>
                    <span className="text-sm font-medium text-foreground">{feature.name}</span>
                    <span className="text-xs text-muted-foreground">({feature.category})</span>
                  </div>
                  <button
                    onClick={() => toggleFeature(i)}
                    className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                      feature.approved
                        ? "bg-sf-safe/20 text-sf-safe"
                        : "sf-glass-subtle text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {feature.approved ? (
                      <><CheckCircle2 className="h-3.5 w-3.5" /> {t("blueprint.enabled")}</>
                    ) : (
                      <><XCircle className="h-3.5 w-3.5" /> {t("blueprint.disabled")}</>
                    )}
                  </button>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex gap-3 mt-5">
        <Button
          onClick={handleApprove}
          className="flex-1 h-12 rounded-xl sf-gradient-bg text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
        >
          <CheckCircle2 className="h-5 w-5 me-2" />
          {t("blueprint.approve")}
        </Button>
        <Button
          onClick={onReject}
          variant="outline"
          className="h-12 rounded-xl border-foreground/20 text-foreground hover:bg-foreground/10"
        >
          <Edit3 className="h-5 w-5 me-2" />
          {t("blueprint.modify")}
        </Button>
      </div>
    </motion.div>
  );
};

export default InteractiveBlueprint;
