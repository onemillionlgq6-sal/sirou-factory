import { memo } from "react";
import AppPreview from "@/components/factory/AppPreview";
import TestingCenter from "@/components/factory/TestingCenter";
import FactoryActions from "@/components/factory/FactoryActions";
import HealthDashboard from "@/components/factory/HealthDashboard";
import BuildGuardPanel from "@/components/factory/BuildGuardPanel";
import CompliancePanel from "@/components/factory/CompliancePanel";
import ErrorBoundary from "@/components/ErrorBoundary";
import type { AppBlueprint } from "@/components/factory/AIPlannerEngine";

interface RightColumnProps {
  isComplete: boolean;
  appName: string;
  blueprint: AppBlueprint | null;
  isBackendConnected: boolean;
  onPublish: () => void;
  onExport: () => void;
  onBackendConnected: () => void;
  onBackendDisconnected: () => void;
}

const RightColumn = memo(({
  isComplete, appName, blueprint, isBackendConnected,
  onPublish, onExport, onBackendConnected, onBackendDisconnected,
}: RightColumnProps) => (
  <div className="space-y-6">
    <ErrorBoundary moduleName="AppPreview" fallbackTitleAr="خطأ في المعاينة">
      <AppPreview isGenerated={isComplete} appName={appName} blueprint={blueprint} />
    </ErrorBoundary>
    <ErrorBoundary moduleName="TestingCenter" fallbackTitleAr="خطأ في مركز الاختبار">
      <TestingCenter blueprint={blueprint} appName={appName} isGenerated={isComplete} />
    </ErrorBoundary>
    <ErrorBoundary moduleName="FactoryActions" fallbackTitleAr="خطأ في أدوات التحكم">
      <FactoryActions
        isGenerated={isComplete}
        onPublish={onPublish}
        onExport={onExport}
        isBackendConnected={isBackendConnected}
        onBackendConnected={onBackendConnected}
        onBackendDisconnected={onBackendDisconnected}
      />
    </ErrorBoundary>
    <ErrorBoundary moduleName="HealthDashboard" fallbackTitleAr="خطأ في لوحة الصحة">
      <HealthDashboard />
    </ErrorBoundary>
    <ErrorBoundary moduleName="BuildGuard" fallbackTitleAr="خطأ في حارس البناء">
      <BuildGuardPanel />
    </ErrorBoundary>
    <ErrorBoundary moduleName="CompliancePanel" fallbackTitleAr="خطأ في لوحة الامتثال">
      <CompliancePanel blueprint={blueprint} appName={appName} />
    </ErrorBoundary>
  </div>
));

RightColumn.displayName = "RightColumn";

export default RightColumn;
