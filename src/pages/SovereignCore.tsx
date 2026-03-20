import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import SovereignCapabilities from "@/components/factory/SovereignCapabilities";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useI18n } from "@/lib/i18n";
import factoryBg from "@/assets/factory-bg.jpg";

const SovereignCore = () => {
  const navigate = useNavigate();
  const { t } = useI18n();

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{ backgroundImage: `url(${factoryBg})` }}
    >
      <div className="min-h-screen bg-black/50 backdrop-blur-sm">
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
              className="gap-2 sf-glass-subtle text-white border-white/20 hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("sovereign.back" as any)}
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl sf-gradient-bg flex items-center justify-center shadow-lg">
                <Shield className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{t("cap.title")}</h1>
                <p className="text-xs text-white/60">{t("cap.subtitle")}</p>
              </div>
            </div>
          </motion.div>

          {/* Full capabilities */}
          <ErrorBoundary moduleName="SovereignCapabilities" fallbackTitleAr="خطأ في مركز القدرات">
            <SovereignCapabilities />
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
};

export default SovereignCore;
