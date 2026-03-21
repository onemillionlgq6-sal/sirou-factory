import { memo } from "react";
import AppIdeaInput from "@/components/factory/AppIdeaInput";
import AIPlannerEngine from "@/components/factory/AIPlannerEngine";
import InteractiveBlueprint from "@/components/factory/InteractiveBlueprint";
import AppBuilderEngine from "@/components/factory/AppBuilderEngine";
import TransparencyCenter from "@/components/factory/TransparencyCenter";
import type { ActionNotification } from "@/components/factory/TransparencyCenter";
import type { AppBlueprint } from "@/components/factory/AIPlannerEngine";
import ErrorBoundary from "@/components/ErrorBoundary";
import type { Phase } from "./PipelineIndicator";

interface LeftColumnProps {
  phase: Phase;
  idea: string;
  isPlanning: boolean;
  setIsPlanning: (v: boolean) => void;
  blueprint: AppBlueprint | null;
  notifications: ActionNotification[];
  onGenerate: (idea: string) => void;
  onBlueprintReady: (bp: AppBlueprint) => void;
  onBlueprintApprove: (bp: AppBlueprint) => void;
  onBlueprintReject: () => void;
  onBuildComplete: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

const LeftColumn = memo(({
  phase, idea, isPlanning, setIsPlanning, blueprint, notifications,
  onGenerate, onBlueprintReady, onBlueprintApprove, onBlueprintReject,
  onBuildComplete, onApprove, onReject,
}: LeftColumnProps) => (
  <div className="space-y-6">
    {(phase === "idea" || phase === "planning") && (
      <ErrorBoundary moduleName="AppIdeaInput" fallbackTitleAr="خطأ في مدخل الفكرة">
        <AppIdeaInput onGenerate={onGenerate} isGenerating={isPlanning} />
      </ErrorBoundary>
    )}

    {(phase === "planning" || phase === "blueprint") && (
      <ErrorBoundary moduleName="AIPlannerEngine" fallbackTitleAr="خطأ في محرك التخطيط">
        <AIPlannerEngine
          idea={idea}
          onBlueprintReady={onBlueprintReady}
          isPlanning={isPlanning}
          setIsPlanning={setIsPlanning}
        />
      </ErrorBoundary>
    )}

    {phase === "blueprint" && blueprint && (
      <ErrorBoundary moduleName="InteractiveBlueprint" fallbackTitleAr="خطأ في المخطط التفاعلي">
        <InteractiveBlueprint
          blueprint={blueprint}
          onApprove={onBlueprintApprove}
          onReject={onBlueprintReject}
        />
      </ErrorBoundary>
    )}

    {phase === "building" && blueprint && (
      <ErrorBoundary moduleName="AppBuilderEngine" fallbackTitleAr="خطأ في محرك البناء">
        <AppBuilderEngine blueprint={blueprint} onComplete={onBuildComplete} />
      </ErrorBoundary>
    )}

    <ErrorBoundary moduleName="TransparencyCenter" fallbackTitleAr="خطأ في مركز الشفافية">
      <TransparencyCenter
        notifications={notifications}
        onApprove={onApprove}
        onReject={onReject}
      />
    </ErrorBoundary>
  </div>
));

LeftColumn.displayName = "LeftColumn";

export default LeftColumn;
