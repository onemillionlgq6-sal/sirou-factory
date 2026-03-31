/**
 * AIChatPanel — Strict JSON-only Compiler Chat for Sirou Factory.
 * All AI responses MUST be valid JSON Actions. Non-JSON is rejected.
 * Preview only updates from validated+executed actions.
 * Auto-routing only from JSON Actions, not file scanning.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { sendAIMessage, hasActiveAPIKey, getActiveProvider, type AIMessage } from "@/lib/ai-provider";
import { getActionSystemPrompt, type ValidatedAction } from "@/lib/executor";
import { validateAIResponse } from "@/lib/executor/action-validator";
import { handleAIExecution, isLocalServerRunning, executeLocal } from "@/lib/local-executor";
import { executeAction, loadProjectFS, getProjectFS } from "@/lib/executor/executor-engine";
import ExecutorPanel from "@/components/factory/ExecutorPanel";
import ExecutionLog, { type LogEntry } from "@/components/factory/ExecutionLog";
import HistoryBar from "@/components/factory/HistoryBar";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Bot, Sparkles, X, ImagePlus, Eye, Trash2, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import {
  friendlyLogMessage,
  friendlyExecutionSummary,
  friendlyStatus,
  friendlyToast,
  progressBar,
  stepLabel,
} from "@/lib/friendly-messages";
import {
  pushSnapshot, setCurrentSnapshot, getCurrentSnapshot,
} from "@/lib/history-manager";

type ChatMode = "app" | "factory";

interface ImageAttachment {
  id: string;
  file: File;
  preview: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "ai";
  text: string;
  images?: string[];
  timestamp: Date;
}

interface AIChatPanelProps {
  mode: ChatMode;
  onSendMessage?: (message: string, mode: ChatMode, images?: File[]) => void;
  onFilesGenerated?: (files: Record<string, string>) => void;
  isGenerating?: boolean;
}

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Generate auto-route edit_file actions ONLY from validated JSON Actions
 * (not from file scanning). Only triggers for create_file actions targeting src/pages/.
 */
function generateAutoRouteActions(actions: ValidatedAction[]): Record<string, unknown>[] {
  const routeActions: Record<string, unknown>[] = [];

  for (const act of actions) {
    const a = act.action as any;
    if (a.action === "create_file" && typeof a.path === "string" && a.path.startsWith("src/pages/")) {
      const fileName = a.path.split("/").pop()?.replace(/\.(tsx|jsx)$/, "");
      if (!fileName || ["Index", "NotFound", "SovereignCore", "Templates"].includes(fileName)) continue;

      const routePath = "/" + fileName.replace(/([A-Z])/g, (m: string, p1: string, offset: number) =>
        offset > 0 ? `-${p1.toLowerCase()}` : p1.toLowerCase()
      );

      const lazyImport = `const ${fileName} = lazy(() => import("./pages/${fileName}.tsx"));`;
      const routeElement = `              <Route path="${routePath}" element={<${fileName} />} />`;

      routeActions.push({
        action: "edit_file",
        path: "src/App.tsx",
        search: `const SovereignCore = lazy`,
        replace: `${lazyImport}\nconst SovereignCore = lazy`,
      });

      routeActions.push({
        action: "edit_file",
        path: "src/App.tsx",
        search: `{/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}`,
        replace: `${routeElement}\n              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}`,
      });
    }
  }

  return routeActions;
}

const AIChatPanel = ({ mode, onSendMessage, onFilesGenerated, isGenerating }: AIChatPanelProps) => {
  const { lang } = useI18n();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [attachments, setAttachments] = useState<ImageAttachment[]>([]);
  const [pendingActions, setPendingActions] = useState<ValidatedAction[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [executionLogs, setExecutionLogs] = useState<LogEntry[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [historyTrigger, setHistoryTrigger] = useState(0);

  // حفظ snapshot بعد كل تنفيذ ناجح
  const saveHistorySnapshot = useCallback((description: string, type: "ai_execution" | "file_create" | "file_edit" | "file_delete", files: Record<string, string>) => {
    pushSnapshot(description, type, files);
    setCurrentSnapshot(files);
    setHistoryTrigger(t => t + 1);
  }, []);

  const handleHistoryRestore = useCallback((files: Record<string, string>) => {
    setCurrentSnapshot(files);
    onFilesGenerated?.(files);
    setHistoryTrigger(t => t + 1);
  }, [onFilesGenerated]);



  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      attachments.forEach((a) => URL.revokeObjectURL(a.preview));
    };
  }, []);

  const addLog = useCallback((entry: Omit<LogEntry, "id" | "timestamp">) => {
    setExecutionLogs(prev => [...prev, {
      ...entry,
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date(),
    }]);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newAttachments: ImageAttachment[] = [];
    for (let i = 0; i < files.length; i++) {
      if (attachments.length + newAttachments.length >= MAX_IMAGES) break;
      const file = files[i];
      if (!file.type.startsWith("image/") || file.size > MAX_FILE_SIZE) continue;
      newAttachments.push({
        id: `img-${Date.now()}-${i}`,
        file,
        preview: URL.createObjectURL(file),
      });
    }
    setAttachments((prev) => [...prev, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [attachments.length]);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => {
      const target = prev.find((a) => a.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((a) => a.id !== id);
    });
  }, []);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text && attachments.length === 0) return;

    const imagePreviews = attachments.map((a) => a.preview);
    const imageFiles = attachments.map((a) => a.file);

    const userMsg: ChatMessage = {
      id: `${mode}-${Date.now()}`,
      role: "user",
      text: text || `📎 ${attachments.length} صورة`,
      images: imagePreviews.length > 0 ? imagePreviews : undefined,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setAttachments([]);
    setIsSending(true);

    onSendMessage?.(text, mode, imageFiles.length > 0 ? imageFiles : undefined);

    const aiMessages: AIMessage[] = [
      { role: "system", content: getActionSystemPrompt() },
      ...messages.filter(m => m.text).map(m => ({
        role: (m.role === "user" ? "user" : "assistant") as AIMessage["role"],
        content: m.text,
      })),
      { role: "user" as const, content: text || "تحليل الصور المرفقة" },
    ];

    const aiMsgId = `${mode}-ai-${Date.now()}`;
    let aiContent = "";

    // Show friendly "thinking" message instead of raw AI stream
    setMessages((prev) => [...prev, {
      id: aiMsgId, role: "ai", text: friendlyStatus("thinking", lang), timestamp: new Date(),
    }]);

    sendAIMessage(aiMessages, {
      onToken: (token) => {
        aiContent += token;
        // Show friendly building status, NOT raw JSON/code
        setMessages((prev) =>
          prev.map((m) => m.id === aiMsgId ? { ...m, text: friendlyStatus("building", lang) + " ⏳" } : m)
        );
      },
      onDone: async () => {
        setIsSending(false);
        // Replace raw AI content with friendly "done" message
        setMessages((prev) =>
          prev.map((m) => m.id === aiMsgId ? { ...m, text: friendlyStatus("building", lang) } : m)
        );

        if (!aiContent) return;

        // ── STRICT VALIDATION GATE ──
        const validation = validateAIResponse(aiContent);

        if (!validation.valid) {
          // Show friendly error instead of technical JSON errors
          for (const err of validation.errors) {
            addLog({
              action: "validation",
              status: "error",
              message: friendlyLogMessage("validation", undefined, err, "error", lang),
            });
          }
          toast.error(lang === "ar" ? "⏳ أُعالج الطلب... حاول مرة أخرى" : "⏳ Processing... please try again");
          setMessages(prev => [...prev, {
            id: `${mode}-reject-${Date.now()}`,
            role: "ai",
            text: lang === "ar"
              ? "⚠️ لم أستطع فهم الطلب بالكامل. حاول وصف تطبيقك بطريقة أبسط أو أقصر."
              : "⚠️ I couldn't fully understand the request. Try describing your app more simply.",
            timestamp: new Date(),
          }]);
          return;
        }

        // Set pending actions for executor panel
        setPendingActions(validation.actions);

        // Generate auto-route actions FROM validated JSON actions only
        const routeActions = generateAutoRouteActions(validation.actions);

        const totalSteps = validation.actions.length;
        toast.success(friendlyToast(`⚡ ${totalSteps} أمر صالح`, lang));

        // Log validated actions with friendly messages
        for (let idx = 0; idx < validation.actions.length; idx++) {
          const act = validation.actions[idx];
          addLog({
            action: (act.action as any).action,
            path: (act.action as any).path,
            status: "warning",
            message: `${stepLabel(idx + 1, totalSteps, lang)} — ${friendlyLogMessage((act.action as any).action, (act.action as any).path, "", "warning", lang)}`,
          });
        }

        // ── AUTO-EXECUTE on local server (only validated actions) ──
        const serverUp = await isLocalServerRunning();
        if (serverUp) {
          // Execute validated actions via local server
          const actionObjects = validation.actions.map(a => a.action as Record<string, unknown>);
          const localResults = await Promise.all(actionObjects.map(a => executeLocal(a)));

          const successCount = localResults.filter(r => r.success).length;
          const failCount = localResults.length - successCount;

          // Log results with friendly messages
          for (let i = 0; i < localResults.length; i++) {
            const result = localResults[i];
            const act = validation.actions[i];
            addLog({
              action: (act.action as any).action,
              path: (act.action as any).path,
              status: result.success ? "success" : "error",
              message: friendlyLogMessage((act.action as any).action, (act.action as any).path, result.message || result.error || "", result.success ? "success" : "error", lang),
            });
          }

          // Execute auto-route actions
          for (const ra of routeActions) {
            try {
              const result = await executeLocal(ra);
              addLog({
                action: "auto-route",
                path: (ra as any).path,
                status: result.success ? "success" : "error",
                message: friendlyLogMessage("auto-route", (ra as any).path, "", result.success ? "success" : "error", lang),
              });
            } catch {
              addLog({
                action: "auto-route",
                path: (ra as any).path,
                status: "error",
                message: friendlyLogMessage("auto-route", (ra as any).path, "", "error", lang),
              });
            }
          }

          // ONLY send files to preview AFTER successful execution
          const fileMap: Record<string, string> = {};
          for (let i = 0; i < validation.actions.length; i++) {
            if (!localResults[i].success) continue;
            const a = validation.actions[i].action as any;
            if (["create_file", "append_file"].includes(a.action) && a.path && a.content) {
              fileMap[a.path] = a.content;
            }
          }
          if (Object.keys(fileMap).length > 0) {
            onFilesGenerated?.(fileMap);
          }

          setMessages(prev => [...prev, {
            id: `${mode}-local-${Date.now()}`,
            role: "ai",
            text: friendlyExecutionSummary(successCount, failCount, localResults.length, lang),
            timestamp: new Date(),
          }]);

          if (successCount > 0) toast.success(friendlyToast(`✅ تنفيذ ${successCount} أمر`, lang));
        } else {
          // Server offline — use virtual executor engine
          addLog({ action: "system", status: "warning", message: lang === "ar" ? "⏳ أُجهِّز البيئة..." : "⏳ Preparing environment..." });

          const virtualResults: { success: boolean; desc: string; message: string }[] = [];

          for (const va of validation.actions) {
            try {
              const result = await executeAction({ ...va, requiresApproval: false });
              const success = result.status === "success";
              virtualResults.push({ success, desc: va.description, message: result.message });
              addLog({
                action: (va.action as any).action,
                path: (va.action as any).path,
                status: success ? "success" : "error",
                message: friendlyLogMessage((va.action as any).action, (va.action as any).path, result.message, success ? "success" : "error", lang),
              });
            } catch (err) {
              virtualResults.push({ success: false, desc: va.description, message: (err as Error).message });
              addLog({
                action: (va.action as any).action,
                path: (va.action as any).path,
                status: "error",
                message: friendlyLogMessage((va.action as any).action, (va.action as any).path, (err as Error).message, "error", lang),
              });
            }
          }

          // Execute auto-route actions on virtual FS too
          for (const ra of routeActions) {
            try {
              const raValidated = { action: ra as any, requiresApproval: false, risk: "low" as const, description: "Auto-route" };
              await executeAction(raValidated);
              addLog({ action: "auto-route", path: (ra as any).path, status: "success", message: friendlyLogMessage("auto-route", (ra as any).path, "", "success", lang) });
            } catch {
              addLog({ action: "auto-route", path: (ra as any).path, status: "error", message: friendlyLogMessage("auto-route", (ra as any).path, "", "error", lang) });
            }
          }

          // Pass ALL successfully created/appended files to preview
          const fileMap: Record<string, string> = {};
          for (let i = 0; i < validation.actions.length; i++) {
            if (!virtualResults[i]?.success) continue;
            const a = validation.actions[i].action as any;
            if (["create_file", "append_file"].includes(a.action) && a.path && a.content) {
              fileMap[a.path] = a.content;
            }
          }
          if (Object.keys(fileMap).length > 0) {
            onFilesGenerated?.(fileMap);
          }

          const successCount = virtualResults.filter(r => r.success).length;
          const failCount = virtualResults.length - successCount;

          setMessages(prev => [...prev, {
            id: `${mode}-virtual-${Date.now()}`,
            role: "ai",
            text: friendlyExecutionSummary(successCount, failCount, virtualResults.length, lang),
            timestamp: new Date(),
          }]);

          if (successCount > 0) toast.success(friendlyToast(`✅ تنفيذ ${successCount} أمر`, lang));
        }
      },
      onError: (error) => {
        setIsSending(false);
        addLog({ action: "ai-error", status: "error", message: friendlyLogMessage("ai-error", undefined, error, "error", lang) });
        setMessages((prev) =>
          prev.map((m) => m.id === aiMsgId ? { ...m, text: friendlyStatus("error", lang) } : m)
        );
      },
    });
  }, [input, mode, onSendMessage, attachments, messages, addLog, onFilesGenerated, lang]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
    attachments.forEach((a) => URL.revokeObjectURL(a.preview));
    setAttachments([]);
    toast.success("تم مسح المحادثة");
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    const fakeEvent = { target: { files } } as unknown as React.ChangeEvent<HTMLInputElement>;
    handleFileSelect(fakeEvent);
  }, [handleFileSelect]);

  return (
    <>
      <div
        className="flex flex-col h-full"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/20 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Zap className="h-3.5 w-3.5 text-background" />
            </div>
            <div>
              <span className="text-sm font-semibold text-foreground">
                {lang === "ar" ? "مساعد سيرو" : "Sirou Assistant"}
              </span>
              {isSending && (
                <span className="ml-2 text-[10px] text-primary animate-pulse">
                  {lang === "ar" ? "يعمل..." : "working..."}
                </span>
              )}
            </div>
          </div>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearChat}
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
              <Bot className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                {lang === "ar" ? "مرحبًا! أنا مساعد سيرو 👋" : "Hi! I'm Sirou Assistant 👋"}
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                {lang === "ar" ? "صِف لي تطبيقك وسأبنيه لك" : "Describe your app and I'll build it for you"}
              </p>
              <div className="mt-4 space-y-1.5 text-[11px] text-muted-foreground/40">
                <p>💡 {lang === "ar" ? "\"أبغى تطبيق دردشة\"" : "\"I want a chat app\""}</p>
                <p>💡 {lang === "ar" ? "\"أبغى متجر إلكتروني\"" : "\"I want an online store\""}</p>
                <p>💡 {lang === "ar" ? "\"أبغى تطبيق مهام\"" : "\"I want a task manager\""}</p>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl text-[13px] leading-relaxed overflow-hidden ${
                  msg.role === "user"
                    ? "bg-primary/20 text-foreground rounded-br-sm"
                    : "bg-[hsl(220,20%,12%)] text-foreground rounded-bl-sm"
                }`}
              >
                {msg.images && msg.images.length > 0 && (
                  <div className="flex flex-wrap gap-1 p-2 pb-0">
                    {msg.images.map((src, idx) => (
                      <button
                        key={idx}
                        onClick={() => setPreviewImage(src)}
                        className="relative group rounded-lg overflow-hidden w-16 h-16 flex-shrink-0"
                      >
                        <img src={src} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                          <Eye className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {msg.text && (
                  <div className="px-3 py-2 whitespace-pre-wrap">
                    {msg.role === "ai" && <Sparkles className="inline h-3 w-3 mr-1 opacity-50" />}
                    {msg.text}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Executor Panel */}
        {pendingActions.length > 0 && (
          <div className="px-3 py-2 border-t border-border/20">
            <ExecutorPanel
              actions={pendingActions}
              onExecutionComplete={(results) => {
                for (const r of results) {
                  addLog({
                    action: "manual-exec",
                    status: r.message?.includes("✅") ? "success" : "error",
                    message: r.message || "تم",
                  });
                }
                const summary = results.map(r => r.message).join("\n");
                setMessages(prev => [...prev, {
                  id: `exec-${Date.now()}`,
                  role: "ai",
                  text: `📋 نتائج التنفيذ:\n${summary}`,
                  timestamp: new Date(),
                }]);
              }}
              onClear={() => setPendingActions([])}
            />
          </div>
        )}

        {/* Execution Log */}
        <ExecutionLog
          logs={executionLogs}
          onClear={() => setExecutionLogs([])}
        />

        {/* Attachments strip */}
        {attachments.length > 0 && (
          <div className="px-3 pt-1">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {attachments.map((att) => (
                <div key={att.id} className="relative group flex-shrink-0">
                  <img src={att.preview} alt="" className="w-12 h-12 rounded-lg object-cover border border-border/20" />
                  <button
                    onClick={() => removeAttachment(att.id)}
                    className="absolute -top-1 -end-1 w-4 h-4 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[8px]"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t border-border/20 flex-shrink-0">
          <div className="flex items-end gap-2 bg-[hsl(220,20%,12%)] rounded-xl p-2 border border-border/10">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={attachments.length >= MAX_IMAGES}
              className="h-8 w-8 text-muted-foreground hover:text-primary flex-shrink-0"
            >
              <ImagePlus className="h-4 w-4" />
            </Button>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={lang === "ar" ? "صِف لي تطبيقك..." : "Describe your app..."}
              rows={1}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 resize-none outline-none min-h-[36px] max-h-[120px] py-1.5"
              dir="auto"
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={(!input.trim() && attachments.length === 0) || isGenerating || isSending}
              className="h-8 w-8 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-30 flex-shrink-0"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Image preview modal */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setPreviewImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-2xl max-h-[80vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <img src={previewImage} alt="" className="max-w-full max-h-[80vh] rounded-xl object-contain shadow-2xl" />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPreviewImage(null)}
                className="absolute -top-3 -end-3 h-8 w-8 rounded-full bg-foreground/20 text-white hover:bg-foreground/40"
              >
                <X className="h-4 w-4" />
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChatPanel;
