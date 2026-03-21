import { memo } from "react";

type Phase = "idea" | "planning" | "blueprint" | "building" | "audit" | "complete";

const PHASES: Phase[] = ["idea", "planning", "blueprint", "building", "audit", "complete"];

interface PipelineIndicatorProps {
  currentPhase: Phase;
}

const PipelineIndicator = memo(({ currentPhase }: PipelineIndicatorProps) => {
  const currentIndex = PHASES.indexOf(currentPhase);

  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {PHASES.map((p, i) => (
        <div key={p} className="flex items-center gap-2">
          <div
            className={`h-2.5 w-2.5 rounded-full transition-all ${
              currentPhase === p
                ? "sf-gradient-bg scale-125 sf-glow-green"
                : currentIndex > i
                ? "bg-sf-safe"
                : "bg-foreground/20"
            }`}
          />
          {i < 4 && (
            <div
              className={`h-px w-8 transition-all ${
                currentIndex > i ? "bg-sf-safe" : "bg-foreground/20"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
});

PipelineIndicator.displayName = "PipelineIndicator";

export default PipelineIndicator;
export type { Phase };
