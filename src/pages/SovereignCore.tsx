import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import SovereignCapabilities from "@/components/factory/SovereignCapabilities";
import SovereignIcon from "@/components/factory/SovereignIcon";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useI18n } from "@/lib/i18n";
import factoryBg from "@/assets/factory-bg.jpg";

const SovereignCore = () => {
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const isRTL = lang === "ar";
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{ backgroundImage: `url(${factoryBg})` }}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="min-h-screen bg-black/55 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Top bar */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-5 mb-8"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/")}
              className="gap-2 bg-white/10 border-white/25 text-white hover:bg-white/20 backdrop-blur-md font-display tracking-wider text-xs uppercase"
            >
              <BackArrow className="h-4 w-4" />
              {isRTL ? "رجوع" : "BACK"}
            </Button>
            <div className={`flex items-center gap-5 ${isRTL ? "mr-2" : "ml-2"}`}>
              <SovereignIcon size="md" glowing />
              <div>
                <h1 className="text-xl font-display font-bold tracking-wide text-white">
                  {t("cap.title")}
                </h1>
                <p className="text-sm text-white/75 font-sans">{t("cap.subtitle")}</p>
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
