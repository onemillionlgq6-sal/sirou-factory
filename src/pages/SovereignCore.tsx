import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import SovereignCapabilities from "@/components/factory/SovereignCapabilities";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useI18n } from "@/lib/i18n";

const SovereignCore = () => {
  const navigate = useNavigate();
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Top bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/")}
            className="gap-2 sf-glass-subtle"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("sovereign.back" as any)}
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{t("cap.title")}</h1>
              <p className="text-xs text-muted-foreground">{t("cap.subtitle")}</p>
            </div>
          </div>
        </motion.div>

        {/* Full capabilities */}
        <ErrorBoundary moduleName="SovereignCapabilities" fallbackTitleAr="خطأ في مركز القدرات">
          <SovereignCapabilities />
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default SovereignCore;
