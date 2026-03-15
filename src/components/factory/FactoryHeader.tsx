import { motion } from "framer-motion";
import { Factory, Shield, Zap, Languages } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FactoryHeaderProps {
  isBackendConnected?: boolean;
}

const FactoryHeader = ({ isBackendConnected = false }: FactoryHeaderProps) => {
  const { t, lang, setLang } = useI18n();

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between py-6"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl sf-gradient-bg flex items-center justify-center sf-glow-green">
          <Factory className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">
            {t("app.title")}
          </h1>
          <p className="text-xs text-muted-foreground">
            {t("app.subtitle")}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLang(lang === "en" ? "ar" : "en")}
              className="rounded-full px-3 py-1.5 h-auto text-xs font-medium sf-glass-subtle text-foreground hover:sf-glass-strong gap-1.5 border-foreground/20"
            >
              <Languages className="h-3.5 w-3.5" />
              {lang === "en" ? "عربي" : "English"}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {lang === "en" ? "Switch to Arabic" : "التبديل إلى الإنجليزية"}
          </TooltipContent>
        </Tooltip>

        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            isBackendConnected
              ? "sf-glass-subtle text-sf-safe border border-sf-safe/30"
              : "sf-glass-subtle text-muted-foreground border border-foreground/20"
          }`}
        >
          <Shield className="h-3.5 w-3.5" />
          {isBackendConnected ? t("sovereign.online") : t("sovereign.offline")}
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full sf-glass-subtle text-accent text-xs font-medium border border-accent/30">
          <Zap className="h-3.5 w-3.5" />
          {t("oversight.active")}
        </div>
      </div>
    </motion.header>
  );
};

export default FactoryHeader;
