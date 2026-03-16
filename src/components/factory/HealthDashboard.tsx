import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  Clock,
  Cpu,
  Monitor,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import {
  getHealthStatus,
  getErrorLog,
  getPerformanceLog,
  clearLogs,
  type HealthStatus,
  type ErrorEntry,
  type PerformanceEntry,
} from "@/lib/health-monitor";

const HealthDashboard = () => {
  const { t } = useI18n();
  const [health, setHealth] = useState<HealthStatus>(getHealthStatus());
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [perf, setPerf] = useState<PerformanceEntry[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setHealth(getHealthStatus());
      setErrors(getErrorLog().slice(0, 10));
      setPerf(getPerformanceLog().slice(0, 10));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const statusColor =
    health.status === "healthy"
      ? "text-sf-safe"
      : health.status === "degraded"
      ? "text-sf-caution"
      : "text-destructive";

  const statusDot =
    health.status === "healthy"
      ? "bg-sf-safe"
      : health.status === "degraded"
      ? "bg-sf-caution"
      : "bg-destructive";

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sf-glass rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-foreground" />
          <h2 className="text-lg font-semibold text-foreground">
            {t("health.title")}
          </h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="text-foreground/70"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </div>

      {/* Status summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="sf-glass-subtle rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <div className={`h-2 w-2 rounded-full ${statusDot} animate-pulse`} />
            <span className={`text-xs font-medium ${statusColor}`}>
              {health.status === "healthy"
                ? t("health.healthy")
                : health.status === "degraded"
                ? t("health.degraded")
                : t("health.critical")}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground">{t("health.status")}</p>
        </div>

        <div className="sf-glass-subtle rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Clock className="h-3.5 w-3.5 text-foreground/70" />
            <span className="text-xs font-medium text-foreground">
              {formatUptime(health.uptime)}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground">{t("health.uptime")}</p>
        </div>

        <div className="sf-glass-subtle rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <AlertTriangle className="h-3.5 w-3.5 text-foreground/70" />
            <span className="text-xs font-medium text-foreground">
              {health.errorCount}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground">{t("health.errors")}</p>
        </div>

        <div className="sf-glass-subtle rounded-xl p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Monitor className="h-3.5 w-3.5 text-foreground/70" />
            <span className="text-xs font-medium text-foreground">
              {health.platform}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground">{t("health.platform")}</p>
        </div>
      </div>

      {health.memoryUsage !== null && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span className="flex items-center gap-1">
              <Cpu className="h-3 w-3" /> {t("health.memory")}
            </span>
            <span>{health.memoryUsage}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-foreground/10 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                health.memoryUsage > 80 ? "bg-destructive" : health.memoryUsage > 50 ? "bg-sf-caution" : "sf-gradient-bg"
              }`}
              style={{ width: `${health.memoryUsage}%` }}
            />
          </div>
        </div>
      )}

      {/* Expanded details */}
      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="space-y-4"
        >
          {/* Recent errors */}
          {errors.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-foreground">
                  {t("health.recent.errors")}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    clearLogs();
                    setErrors([]);
                    setPerf([]);
                  }}
                  className="text-xs text-muted-foreground h-auto py-1 px-2"
                >
                  <Trash2 className="h-3 w-3 me-1" />
                  {t("health.clear")}
                </Button>
              </div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {errors.map((e, i) => (
                  <div
                    key={i}
                    className="sf-glass-subtle rounded-lg px-3 py-2 text-xs flex justify-between"
                  >
                    <span className="text-foreground/80 truncate flex-1">
                      <span className="text-muted-foreground">[{e.module}]</span>{" "}
                      {e.message}
                    </span>
                    <span
                      className={`ms-2 shrink-0 ${
                        e.severity === "critical" ? "text-destructive" : "text-sf-caution"
                      }`}
                    >
                      {e.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Performance entries */}
          {perf.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">
                {t("health.performance")}
              </h3>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {perf.map((p, i) => (
                  <div
                    key={i}
                    className="sf-glass-subtle rounded-lg px-3 py-2 text-xs flex justify-between"
                  >
                    <span className="text-foreground/80">{p.metric}</span>
                    <span
                      className={`${
                        p.value > 100 ? "text-sf-caution" : "text-sf-safe"
                      }`}
                    >
                      {p.value}{p.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {errors.length === 0 && perf.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">
              {t("health.no.data")}
            </p>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default HealthDashboard;
