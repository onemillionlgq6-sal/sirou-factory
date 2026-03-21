import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Blocks, ChevronRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import SovereignIcon from "./SovereignIcon";

const TemplatesLauncher = () => {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const isRTL = lang === "ar";

  return (
    <motion.button
      onClick={() => navigate("/templates")}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="w-full sf-glass rounded-2xl p-5 text-left group transition-all hover:shadow-lg hover:shadow-primary/10"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SovereignIcon size="sm" glowing={false} />

          <div>
            <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
              {isRTL ? "قوالب التطبيقات" : "App Templates"}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isRTL
                ? "قوالب جاهزة · متجر · مطعم · شبكة اجتماعية · والمزيد"
                : "Ready-made · Store · Restaurant · Social · and more"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <Blocks className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] font-semibold tracking-wider text-primary whitespace-nowrap uppercase">
              {isRTL ? "6 قوالب" : "6 Templates"}
            </span>
          </div>
          <ChevronRight className={`h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors ${isRTL ? "rotate-180" : ""}`} />
        </div>
      </div>
    </motion.button>
  );
};

export default TemplatesLauncher;
