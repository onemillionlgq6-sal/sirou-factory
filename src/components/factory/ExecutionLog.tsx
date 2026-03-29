/**
 * ExecutionLog — User-friendly progress dashboard
 * Shows build progress with human-readable messages (no code/technical terms)
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronUp, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export interface LogEntry {
  id: string;
  timestamp: Date;
  action: string;
  path?: string;
  status: "success" | "error" | "warning";
  message: string;
}

interface ExecutionLogProps {
  logs: LogEntry[];
  onClear: () => void;
}

const statusConfig = {
  success: { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-400/10", emoji: "✅" },
  error: { icon: XCircle, color: "text-red-400", bg: "bg-red-400/10", emoji: "⚠️" },
  warning: { icon: AlertTriangle, color: "text-yellow-400", bg: "bg-yellow-400/10", emoji: "⏳" },
};

const ExecutionLog = ({ logs, onClear }: ExecutionLogProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const { lang } = useI18n();

  if (logs.length === 0) return null;

  const successCount = logs.filter(l => l.status === "success").length;
  const totalCount = logs.length;
  const progress = Math.round((successCount / totalCount) * 100);

  return (
    <div className="border-t border-border/20 bg-[hsl(220,20%,8%)]">
      {/* Header — friendly */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-[hsl(220,20%,10%)] transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium text-foreground">
            {lang === "ar" ? "تقدّم البناء" : "Build Progress"}
          </span>
          {/* Mini progress bar */}
          <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-400 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground">
            {successCount}/{totalCount}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            className="h-5 w-5 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
          {collapsed ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
        </div>
      </button>

      {/* Log entries — friendly messages only */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="max-h-40 overflow-y-auto px-3 pb-2 space-y-1">
              {logs.map((log) => {
                const { icon: Icon, color, bg } = statusConfig[log.status];
                return (
                  <div
                    key={log.id}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] ${bg}`}
                  >
                    <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${color}`} />
                    <span className={`flex-1 ${color}`}>{log.message}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExecutionLog;
