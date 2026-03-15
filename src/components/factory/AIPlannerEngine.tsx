import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Loader2, CheckCircle2, Shield, Sparkles, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export interface BlueprintEntity {
  name: string;
  fields: string[];
}

export interface BlueprintPage {
  name: string;
  route: string;
  components: string[];
}

export interface BlueprintFeature {
  name: string;
  category: "core" | "plugin" | "external";
  approved: boolean;
  risk: "safe" | "caution" | "danger";
}

export interface AppBlueprint {
  appName: string;
  description: string;
  entities: BlueprintEntity[];
  pages: BlueprintPage[];
  features: BlueprintFeature[];
  plugins: string[];
}

interface AIPlannerEngineProps {
  idea: string;
  onBlueprintReady: (blueprint: AppBlueprint) => void;
  isPlanning: boolean;
  setIsPlanning: (v: boolean) => void;
}

/**
 * [Safe 🟢] AI Planner Engine
 * Analyzes the app idea, extracts entities, suggests features,
 * and filters harmful functions. No external calls — all local logic.
 */
const AIPlannerEngine = ({ idea, onBlueprintReady, isPlanning, setIsPlanning }: AIPlannerEngineProps) => {
  const { t } = useI18n();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = useMemo(() => [
    t("planner.step.analyzing"),
    t("planner.step.entities"),
    t("planner.step.features"),
    t("planner.step.security"),
    t("planner.step.blueprint"),
  ], [t]);

  /**
   * [Safe 🟢] Simulates the AI planning pipeline locally.
   * Extracts keywords from the idea to generate a blueprint.
   */
  const runPlanner = useCallback(async () => {
    setIsPlanning(true);
    setCurrentStep(0);

    const words = idea.toLowerCase().split(/\s+/);
    const appName = idea.split(" ").slice(0, 4).join(" ");

    // Step-by-step simulation
    for (let i = 0; i < 5; i++) {
      await new Promise((r) => setTimeout(r, 600));
      setCurrentStep(i + 1);
    }

    // Extract entities based on common patterns
    const entities: BlueprintEntity[] = [
      { name: "users", fields: ["id", "email", "name", "avatar_url", "created_at"] },
    ];
    if (words.some((w) => ["task", "todo", "project", "board", "مهام"].includes(w))) {
      entities.push({ name: "tasks", fields: ["id", "title", "status", "priority", "user_id", "created_at"] });
    }
    if (words.some((w) => ["shop", "store", "product", "ecommerce", "متجر"].includes(w))) {
      entities.push({ name: "products", fields: ["id", "name", "price", "category", "image_url", "stock"] });
      entities.push({ name: "orders", fields: ["id", "user_id", "total", "status", "created_at"] });
    }
    if (words.some((w) => ["chat", "message", "room", "دردشة"].includes(w))) {
      entities.push({ name: "messages", fields: ["id", "content", "sender_id", "room_id", "created_at"] });
      entities.push({ name: "rooms", fields: ["id", "name", "type", "created_at"] });
    }
    if (words.some((w) => ["blog", "post", "article", "مدونة"].includes(w))) {
      entities.push({ name: "posts", fields: ["id", "title", "content", "author_id", "published_at"] });
    }
    if (entities.length === 1) {
      entities.push({ name: "items", fields: ["id", "name", "description", "user_id", "created_at"] });
    }

    const pages: BlueprintPage[] = [
      { name: "Home", route: "/", components: ["Hero", "FeatureGrid"] },
      { name: "Dashboard", route: "/dashboard", components: ["Sidebar", "StatsCards", "DataTable"] },
    ];

    const features: BlueprintFeature[] = [
      { name: t("blueprint.feature.auth"), category: "core", approved: true, risk: "safe" },
      { name: t("blueprint.feature.crud"), category: "core", approved: true, risk: "safe" },
      { name: t("blueprint.feature.rls"), category: "core", approved: true, risk: "safe" },
      { name: t("blueprint.feature.db"), category: "core", approved: false, risk: "caution" },
      { name: t("blueprint.feature.storage"), category: "plugin", approved: false, risk: "caution" },
    ];

    if (words.some((w) => ["payment", "stripe", "pay", "دفع"].includes(w))) {
      features.push({ name: t("blueprint.feature.payment"), category: "external", approved: false, risk: "danger" });
    }
    if (words.some((w) => ["map", "location", "gps", "خريطة"].includes(w))) {
      features.push({ name: t("blueprint.feature.maps"), category: "external", approved: false, risk: "danger" });
    }

    const plugins = ["Authentication", "File Storage"];

    const blueprint: AppBlueprint = {
      appName,
      description: idea,
      entities,
      pages,
      features,
      plugins,
    };

    onBlueprintReady(blueprint);
    setIsPlanning(false);
  }, [idea, onBlueprintReady, setIsPlanning, t]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sf-glass rounded-2xl p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Brain className="h-5 w-5 text-accent" />
        <h2 className="text-lg font-semibold text-foreground">{t("planner.title")}</h2>
      </div>

      {!isPlanning && currentStep === 0 && (
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground mb-4">{t("planner.ready")}</p>
          <Button
            onClick={runPlanner}
            disabled={!idea.trim()}
            className="sf-gradient-bg text-primary-foreground font-semibold rounded-xl px-8 h-12 hover:opacity-90 transition-opacity"
          >
            <Sparkles className="h-5 w-5 me-2" />
            {t("planner.start")}
          </Button>
        </div>
      )}

      {(isPlanning || currentStep > 0) && (
        <div className="space-y-3">
          {steps.map((step, i) => {
            const done = currentStep > i;
            const active = currentStep === i + 1 && isPlanning;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  done
                    ? "sf-glass-subtle"
                    : active
                    ? "sf-glass-strong sf-glow-green"
                    : "opacity-40"
                }`}
              >
                {done ? (
                  <CheckCircle2 className="h-5 w-5 text-sf-safe shrink-0" />
                ) : active ? (
                  <Loader2 className="h-5 w-5 text-accent animate-spin shrink-0" />
                ) : (
                  <div className="h-5 w-5 rounded-full border border-foreground/20 shrink-0" />
                )}
                <span className={`text-sm font-medium ${done ? "text-foreground" : active ? "text-accent" : "text-foreground/50"}`}>
                  {step}
                </span>
              </motion.div>
            );
          })}
        </div>
      )}

      {currentStep >= 5 && !isPlanning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 flex items-center justify-center gap-2 text-sf-safe text-sm font-medium"
        >
          <Shield className="h-4 w-4" />
          {t("planner.complete")}
          <ArrowDown className="h-4 w-4 animate-bounce" />
        </motion.div>
      )}
    </motion.div>
  );
};

export default AIPlannerEngine;
