/**
 * HistoryBar — شريط Undo/Redo/History فوق الدردشة
 * تصميم أنيق مثل Lovable مع قائمة تاريخ منسدلة
 */

import { useState, useEffect, useCallback } from "react";
import { Undo2, Redo2, Clock, Trash2, Download, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import {
  canUndo, canRedo, getUndoCount, getRedoCount,
  undo, redo, getAllEntries, clearHistory,
  syncHistoryToSupabase, type HistoryEntry,
} from "@/lib/history-manager";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface HistoryBarProps {
  onRestore: (files: Record<string, string>) => void;
  refreshTrigger?: number;
}

const HistoryBar = ({ onRestore, refreshTrigger }: HistoryBarProps) => {
  const { lang } = useI18n();
  const [undoAvailable, setUndoAvailable] = useState(false);
  const [redoAvailable, setRedoAvailable] = useState(false);
  const [undoCount, setUndoCount] = useState(0);
  const [redoCount, setRedoCount] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  const refresh = useCallback(() => {
    setUndoAvailable(canUndo());
    setRedoAvailable(canRedo());
    setUndoCount(getUndoCount());
    setRedoCount(getRedoCount());
  }, []);

  useEffect(() => { refresh(); }, [refresh, refreshTrigger]);

  const handleUndo = useCallback(() => {
    const result = undo();
    if (result) {
      onRestore(result.restoredFiles);
      toast.success(lang === "ar" ? "↩️ تم التراجع" : "↩️ Undone");
    }
    refresh();
  }, [onRestore, refresh, lang]);

  const handleRedo = useCallback(() => {
    const result = redo();
    if (result) {
      onRestore(result.restoredFiles);
      toast.success(lang === "ar" ? "↪️ تمت الإعادة" : "↪️ Redone");
    }
    refresh();
  }, [onRestore, refresh, lang]);

  const handleOpenHistory = useCallback(async () => {
    if (!historyOpen) {
      const all = await getAllEntries();
      setEntries(all);
    }
    setHistoryOpen(!historyOpen);
  }, [historyOpen]);

  const handleRestoreEntry = useCallback((entry: HistoryEntry) => {
    onRestore(entry.snapshot);
    toast.success(
      lang === "ar"
        ? `🕐 تم استعادة: ${entry.description}`
        : `🕐 Restored: ${entry.description}`
    );
    setHistoryOpen(false);
    refresh();
  }, [onRestore, refresh, lang]);

  const handleClear = useCallback(async () => {
    await clearHistory();
    setEntries([]);
    toast.success(lang === "ar" ? "🗑️ تم مسح التاريخ" : "🗑️ History cleared");
    refresh();
  }, [refresh, lang]);

  const handleSync = useCallback(async () => {
    const ok = await syncHistoryToSupabase();
    toast[ok ? "success" : "error"](
      ok
        ? (lang === "ar" ? "☁️ تمت المزامنة" : "☁️ Synced")
        : (lang === "ar" ? "❌ فشلت المزامنة" : "❌ Sync failed")
    );
  }, [lang]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleUndo, handleRedo]);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString(lang === "ar" ? "ar-SA" : "en-US", {
      hour: "2-digit", minute: "2-digit",
    });
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) {
      return lang === "ar" ? "اليوم" : "Today";
    }
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) {
      return lang === "ar" ? "أمس" : "Yesterday";
    }
    return d.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
      month: "short", day: "numeric",
    });
  };

  const typeIcon = (type: HistoryEntry["type"]) => {
    switch (type) {
      case "ai_execution": return "🤖";
      case "file_create": return "📄";
      case "file_edit": return "✏️";
      case "file_delete": return "🗑️";
      case "settings_change": return "⚙️";
      default: return "📌";
    }
  };

  return (
    <div className="relative">
      {/* ─── الشريط الرئيسي ─── */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border/20 bg-[hsl(220,20%,9%)]">
        {/* Undo */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleUndo}
          disabled={!undoAvailable}
          className="h-7 px-2 gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
          title={`Undo (Ctrl+Z)${undoCount > 0 ? ` — ${undoCount}` : ""}`}
        >
          <Undo2 className="h-3.5 w-3.5" />
          {undoCount > 0 && (
            <span className="text-[10px] bg-primary/20 text-primary px-1 rounded-full min-w-[16px] text-center">
              {undoCount}
            </span>
          )}
        </Button>

        {/* Redo */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRedo}
          disabled={!redoAvailable}
          className="h-7 px-2 gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
          title={`Redo (Ctrl+Y)${redoCount > 0 ? ` — ${redoCount}` : ""}`}
        >
          <Redo2 className="h-3.5 w-3.5" />
          {redoCount > 0 && (
            <span className="text-[10px] bg-accent/20 text-accent px-1 rounded-full min-w-[16px] text-center">
              {redoCount}
            </span>
          )}
        </Button>

        <div className="w-px h-4 bg-border/20 mx-1" />

        {/* History */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleOpenHistory}
          className={`h-7 px-2 gap-1 text-xs transition-colors ${
            historyOpen
              ? "text-primary bg-primary/10"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>{lang === "ar" ? "التاريخ" : "History"}</span>
          <ChevronDown className={`h-3 w-3 transition-transform ${historyOpen ? "rotate-180" : ""}`} />
        </Button>

        <div className="flex-1" />

        {/* Sync to Supabase */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSync}
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          title={lang === "ar" ? "مزامنة مع Supabase" : "Sync to Supabase"}
        >
          <Download className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* ─── قائمة التاريخ المنسدلة ─── */}
      <AnimatePresence>
        {historyOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-b border-border/20 bg-[hsl(220,20%,7%)]"
          >
            <div className="max-h-[300px] overflow-y-auto">
              {entries.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground/50 text-sm">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  {lang === "ar" ? "لا يوجد تاريخ بعد" : "No history yet"}
                </div>
              ) : (
                <div className="py-1">
                  {entries.map((entry, idx) => {
                    const showDate = idx === 0 ||
                      new Date(entry.timestamp).toDateString() !==
                      new Date(entries[idx - 1].timestamp).toDateString();

                    return (
                      <div key={entry.id}>
                        {showDate && (
                          <div className="px-3 py-1 text-[10px] text-muted-foreground/40 font-medium uppercase tracking-wider">
                            {formatDate(entry.timestamp)}
                          </div>
                        )}
                        <button
                          onClick={() => handleRestoreEntry(entry)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-[hsl(220,20%,12%)] transition-colors text-start group"
                        >
                          <span className="text-sm flex-shrink-0">{typeIcon(entry.type)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-foreground/80 truncate">
                              {entry.description}
                            </p>
                            <p className="text-[10px] text-muted-foreground/40">
                              {formatTime(entry.timestamp)}
                            </p>
                          </div>
                          <span className="text-[10px] text-primary/60 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            {lang === "ar" ? "استعادة" : "Restore"}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {entries.length > 0 && (
              <div className="flex items-center justify-between px-3 py-2 border-t border-border/10">
                <span className="text-[10px] text-muted-foreground/40">
                  {entries.length} {lang === "ar" ? "إدخال" : "entries"}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="h-6 px-2 text-[10px] text-destructive/60 hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  {lang === "ar" ? "مسح الكل" : "Clear all"}
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HistoryBar;
