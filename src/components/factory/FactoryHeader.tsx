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
        <div className="h-10 w-10 rounded-xl sf-gradient-bg flex items-center justify-center">
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
              className="rounded-full px-3 py-1.5 h-auto text-xs font-medium border-border hover:bg-muted gap-1.5"
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
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            isBackendConnected
              ? "bg-sf-safe/10 text-sf-safe border-sf-safe/20"
              : "bg-muted text-muted-foreground border-border"
          }`}
        >
          <Shield className="h-3.5 w-3.5" />
          {isBackendConnected ? t("sovereign.online") : t("sovereign.offline")}
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
          <Zap className="h-3.5 w-3.5" />
          {t("oversight.active")}
        </div>
      </div>
    </motion.header>
  );
};

export default FactoryHeader;
