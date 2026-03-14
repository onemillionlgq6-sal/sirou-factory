import { motion, AnimatePresence } from "framer-motion";
import { Shield, AlertTriangle, CheckCircle2, XCircle, Clock } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useI18n } from "@/lib/i18n";

export interface ActionNotification {
  id: string;
  level: "safe" | "caution" | "danger";
  title: string;
  description: string;
  approved?: boolean;
  timestamp: Date;
}

interface TransparencyCenterProps {
  notifications: ActionNotification[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

const TransparencyCenter = ({
  notifications,
  onApprove,
  onReject,
}: TransparencyCenterProps) => {
  const { t } = useI18n();

  const levelConfig = {
    safe: {
      icon: CheckCircle2,
      label: t("transparency.safe"),
      emoji: "🟢",
      bg: "bg-sf-safe/10",
      border: "border-sf-safe/30",
      text: "text-sf-safe",
    },
    caution: {
      icon: AlertTriangle,
      label: t("transparency.caution"),
      emoji: "🟡",
      bg: "bg-sf-caution/10",
      border: "border-sf-caution/30",
      text: "text-sf-caution",
    },
    danger: {
      icon: XCircle,
      label: t("transparency.danger"),
      emoji: "🔴",
      bg: "bg-sf-danger/10",
      border: "border-sf-danger/30",
      text: "text-sf-danger",
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="sf-glass rounded-2xl p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Shield className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">
          {t("transparency.title")}
        </h2>
        <Tooltip>
          <TooltipTrigger>
            <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full cursor-help">
              ?
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs text-sm">{t("transparency.tooltip")}</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="flex gap-3 mb-4">
        {(["safe", "caution", "danger"] as const).map((level) => {
          const config = levelConfig[level];
          const count = notifications.filter((n) => n.level === level).length;
          return (
            <div
              key={level}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${config.bg} ${config.text} border ${config.border}`}
            >
              <span>{config.emoji}</span>
              <span>{config.label}</span>
              <span className="font-bold">{count}</span>
            </div>
          );
        })}
      </div>

      <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
        <AnimatePresence>
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-40" />
              {t("transparency.empty")}
            </div>
          ) : (
            notifications.map((n, i) => {
              const config = levelConfig[n.level];
              const Icon = config.icon;
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex items-start gap-3 p-3 rounded-xl border ${config.border} ${config.bg}`}
                >
                  <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${config.text}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground">
                      {n.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {n.description}
                    </p>
                  </div>
                  {n.level !== "safe" && n.approved === undefined && (
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => onApprove(n.id)}
                        className="text-xs px-3 py-1 rounded-lg bg-sf-safe/20 text-sf-safe hover:bg-sf-safe/30 font-medium transition-colors"
                      >
                        {t("transparency.approve")}
                      </button>
                      <button
                        onClick={() => onReject(n.id)}
                        className="text-xs px-3 py-1 rounded-lg bg-sf-danger/20 text-sf-danger hover:bg-sf-danger/30 font-medium transition-colors"
                      >
                        {t("transparency.reject")}
                      </button>
                    </div>
                  )}
                  {n.approved === true && (
                    <span className="text-xs text-sf-safe font-medium">
                      {t("transparency.approved")}
                    </span>
                  )}
                  {n.approved === false && (
                    <span className="text-xs text-sf-danger font-medium">
                      {t("transparency.rejected")}
                    </span>
                  )}
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default TransparencyCenter;
