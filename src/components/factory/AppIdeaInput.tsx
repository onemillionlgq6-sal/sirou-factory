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

interface AppIdeaInputProps {
  onGenerate: (idea: string) => void;
  isGenerating: boolean;
}

const suggestions = [
  "A task manager with drag-and-drop boards",
  "An e-commerce store with product filtering",
  "A real-time chat application with rooms",
  "A personal portfolio with blog section",
];

const AppIdeaInput = ({ onGenerate, isGenerating }: AppIdeaInputProps) => {
  const [idea, setIdea] = useState("");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="sf-glass rounded-2xl p-6 sf-glow"
    >
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="h-5 w-5 text-sf-caution" />
        <h2 className="text-lg font-semibold text-foreground">App Idea</h2>
        <Tooltip>
          <TooltipTrigger>
            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full cursor-help">
              ?
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs text-sm">
              Describe what you want to build. Be specific about features,
              design style, and target audience for best results.
            </p>
          </TooltipContent>
        </Tooltip>
      </div>

      <Textarea
        value={idea}
        onChange={(e) => setIdea(e.target.value)}
        placeholder="Describe your application idea in detail..."
        className="min-h-[120px] resize-none bg-sf-surface-elevated border-border/50 rounded-xl text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30 transition-all"
      />

      <div className="flex flex-wrap gap-2 mt-3">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => setIdea(s)}
            className="text-xs px-3 py-1.5 rounded-full bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
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
              Generating...
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
              Generate App
            </motion.span>
          )}
        </AnimatePresence>
      </Button>
    </motion.div>
  );
};

export default AppIdeaInput;
