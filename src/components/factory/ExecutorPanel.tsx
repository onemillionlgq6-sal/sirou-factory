/**
 * ExecutorPanel — Batch Approval & Execution Status UI
 * Shows pending actions, risk levels, approval controls, and execution results.
 */

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  CheckCircle,
  XCircle,
  Clock,
  Undo2,
  Redo2,
  Terminal,
  FileCode,
  Trash2,
  FolderEdit,
  Package,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  type ValidatedAction,
  type ExecutionResult,
  type RiskLevel,
  executeBatch,
  canUndo,
  canRedo,
  undo,
  redo,
} from "@/lib/executor";

// ─── Risk UI Config ───

const RISK_CONFIG: Record<RiskLevel, { icon: typeof ShieldCheck; color: string; label: string }> = {
  low: { icon: ShieldCheck, color: "text-emerald-400", label: "آمن" },
  medium: { icon: ShieldAlert, color: "text-amber-400", label: "متوسط" },
  high: { icon: ShieldAlert, color: "text-orange-400", label: "عالي" },
  critical: { icon: ShieldX, color: "text-destructive", label: "حرج" },
};

const ACTION_ICONS: Record<string, typeof FileCode> = {
  create_file: FileCode,
  edit_file: FolderEdit,
  delete_file: Trash2,
  rename_file: FolderEdit,
  shell_cmd: Terminal,
  install_dep: Package,
  append_file: FileCode,
};

interface ExecutorPanelProps {
  actions: ValidatedAction[];
  onExecutionComplete?: (results: ExecutionResult[]) => void;
  onClear?: () => void;
}

const ExecutorPanel = ({ actions, onExecutionComplete, onClear }: ExecutorPanelProps) => {
  const [approvedSet, setApprovedSet] = useState<Set<number>>(new Set());
  const [results, setResults] = useState<ExecutionResult[]>([]);
  const [executing, setExecuting] = useState(false);
  const [progress, setProgress] = useState("");

  const toggleApproval = useCallback((idx: number) => {
    setApprovedSet(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, []);

  const approveAll = useCallback(() => {
    const highRisk = actions
      .map((a, i) => ({ ...a, idx: i }))
      .filter(a => a.requiresApproval);
    setApprovedSet(new Set(highRisk.map(a => a.idx)));
  }, [actions]);

  const handleExecute = useCallback(async () => {
    setExecuting(true);
    setResults([]);

    try {
      const res = await executeBatch(actions, approvedSet, (idx, msg) => {
        setProgress(msg);
      });

      setResults(res);
      onExecutionComplete?.(res);

      const success = res.filter(r => r.status === "success").length;
      const failed = res.filter(r => r.status === "failed").length;
      const pending = res.filter(r => r.status === "pending_approval").length;

      if (failed > 0) {
        toast.error(`${failed} عمليات فشلت من أصل ${res.length}`);
      } else if (pending > 0) {
        toast.warning(`${pending} عملية بانتظار الموافقة`);
      } else {
        toast.success(`✅ تم تنفيذ ${success} عمليات بنجاح`);
      }
    } catch (err) {
      toast.error(`خطأ في التنفيذ: ${(err as Error).message}`);
    } finally {
      setExecuting(false);
      setProgress("");
    }
  }, [actions, approvedSet, onExecutionComplete]);

  const handleUndo = useCallback(() => {
    const record = undo();
    if (record) toast.success(`↩️ تراجع: ${record.action} — ${record.path}`);
    else toast("لا توجد عمليات للتراجع");
  }, []);

  const handleRedo = useCallback(() => {
    const record = redo();
    if (record) toast.success(`↪️ إعادة: ${record.action} — ${record.path}`);
    else toast("لا توجد عمليات للإعادة");
  }, []);

  if (actions.length === 0 && results.length === 0) return null;

  const needsApproval = actions.filter(a => a.requiresApproval);
  const autoExecute = actions.filter(a => !a.requiresApproval);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="sf-glass rounded-2xl p-4 space-y-3"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="h-5 w-5 text-amber-400" />
          <h3 className="text-sm font-bold text-foreground">محرك التنفيذ</h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-foreground/10 text-muted-foreground">
            {actions.length} أمر
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost" size="icon"
            onClick={handleUndo} disabled={!canUndo()}
            className="h-7 w-7 text-muted-foreground"
          >
            <Undo2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost" size="icon"
            onClick={handleRedo} disabled={!canRedo()}
            className="h-7 w-7 text-muted-foreground"
          >
            <Redo2 className="h-3.5 w-3.5" />
          </Button>
          {onClear && (
            <Button variant="ghost" size="icon" onClick={onClear} className="h-7 w-7 text-muted-foreground">
              <XCircle className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Auto-execute section */}
      {autoExecute.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] text-emerald-400/80 font-medium">
            ✅ تنفيذ تلقائي ({autoExecute.length})
          </p>
          {autoExecute.map((a, i) => {
            const ActionIcon = ACTION_ICONS[a.action.action] || FileCode;
            return (
              <div key={`auto-${i}`} className="sf-glass-subtle rounded-lg px-3 py-2 flex items-center gap-2">
                <ActionIcon className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span className="text-xs text-foreground flex-1">{a.description}</span>
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400/60" />
              </div>
            );
          })}
        </div>
      )}

      {/* Approval required section */}
      {needsApproval.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-amber-400/80 font-medium flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              تحتاج موافقة ({needsApproval.length})
            </p>
            <Button
              variant="ghost" size="sm"
              onClick={approveAll}
              className="h-6 text-[10px] text-amber-400"
            >
              موافقة الكل
            </Button>
          </div>
          {actions.map((a, i) => {
            if (!a.requiresApproval) return null;
            const risk = RISK_CONFIG[a.risk];
            const RiskIcon = risk.icon;
            const ActionIcon = ACTION_ICONS[a.action.action] || FileCode;
            const isApproved = approvedSet.has(i);

            return (
              <motion.div
                key={`approve-${i}`}
                className={`sf-glass-subtle rounded-lg px-3 py-2 flex items-center gap-2 cursor-pointer transition-colors ${
                  isApproved ? "ring-1 ring-emerald-500/30" : "hover:bg-foreground/5"
                }`}
                onClick={() => toggleApproval(i)}
              >
                <ActionIcon className={`h-3.5 w-3.5 shrink-0 ${risk.color}`} />
                <span className="text-xs text-foreground flex-1">{a.description}</span>
                <span className={`text-[10px] ${risk.color}`}>{risk.label}</span>
                <RiskIcon className={`h-3.5 w-3.5 ${risk.color}`} />
                {isApproved && <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Progress */}
      <AnimatePresence>
        {executing && progress && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="sf-glass-subtle rounded-lg px-3 py-2 flex items-center gap-2"
          >
            <Clock className="h-3.5 w-3.5 text-amber-400 animate-spin" />
            <span className="text-xs text-muted-foreground">{progress}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] text-muted-foreground font-medium">النتائج:</p>
          {results.map((r, i) => (
            <div
              key={`result-${i}`}
              className="sf-glass-subtle rounded-lg px-3 py-2 flex items-center gap-2"
            >
              {r.status === "success" && <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
              {r.status === "failed" && <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />}
              {r.status === "pending_approval" && <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0" />}
              {r.status === "skipped" && <XCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
              <span className="text-xs text-foreground flex-1">{r.message}</span>
              {r.duration > 0 && (
                <span className="text-[10px] text-muted-foreground">
                  {r.duration.toFixed(0)}ms
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Execute Button */}
      <Button
        onClick={handleExecute}
        disabled={executing}
        className="w-full sf-gradient-bg text-primary-foreground"
      >
        <Play className="h-4 w-4 me-2" />
        {executing ? "جاري التنفيذ..." : `تنفيذ ${actions.length} أمر`}
      </Button>
    </motion.div>
  );
};

export default ExecutorPanel;
