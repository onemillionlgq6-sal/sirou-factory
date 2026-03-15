import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Lightbulb } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useI18n } from "@/lib/i18n";

interface AppIdeaInputProps {
  onGenerate: (idea: string) => void;
  isGenerating: boolean;
}

const AppIdeaInput = ({ onGenerate, isGenerating }: AppIdeaInputProps) => {
  const [idea, setIdea] = useState("");
  const { t } = useI18n();

  const suggestions = [
    t("idea.suggestion1"),
    t("idea.suggestion2"),
    t("idea.suggestion3"),
    t("idea.suggestion4"),
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="sf-glass rounded-2xl p-6 sf-glow"
    >
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="h-5 w-5 text-accent" />
        <h2 className="text-lg font-semibold text-foreground">{t("idea.title")}</h2>
        <Tooltip>
          <TooltipTrigger>
            <span className="text-xs sf-glass-subtle text-muted-foreground px-2 py-0.5 rounded-full cursor-help">
              ?
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs text-sm">{t("idea.tooltip")}</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <Textarea
        value={idea}
        onChange={(e) => setIdea(e.target.value)}
        placeholder={t("idea.placeholder")}
        className="min-h-[120px] resize-none sf-glass-subtle border-foreground/15 rounded-xl text-foreground placeholder:text-foreground/40 focus:ring-2 focus:ring-accent/30 transition-all"
      />

      <div className="flex flex-wrap gap-2 mt-3">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => setIdea(s)}
            className="text-xs px-3 py-1.5 rounded-full sf-glass-subtle text-muted-foreground hover:text-foreground hover:sf-glass-strong transition-all"
          >
            {s}
          </button>
        ))}
      </div>

      <Button
        onClick={() => idea.trim() && onGenerate(idea)}
        disabled={!idea.trim() || isGenerating}
        className="mt-4 w-full h-12 rounded-xl sf-gradient-bg text-primary-foreground font-semibold text-base hover:opacity-90 transition-opacity disabled:opacity-40"
      >
        <AnimatePresence mode="wait">
          {isGenerating ? (
            <motion.span
              key="generating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <Sparkles className="h-5 w-5 animate-pulse" />
              {t("idea.generating")}
            </motion.span>
          ) : (
            <motion.span
              key="generate"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <Sparkles className="h-5 w-5" />
              {t("idea.generate")}
            </motion.span>
          )}
        </AnimatePresence>
      </Button>
    </motion.div>
  );
};

export default AppIdeaInput;
