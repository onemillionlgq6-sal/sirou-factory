/**
 * AIChatPanel — Persistent AI communication input.
 * Two modes: "app" (for app generation with image attachments) and "factory" (for factory development).
 * Each mode maintains its own independent message history.
 * Integrates with Executor Layer for actionable AI responses.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { sendAIMessage, hasActiveAPIKey, getActiveProvider, type AIMessage } from "@/lib/ai-provider";
import { parseAIResponse, getActionSystemPrompt, type ValidatedAction } from "@/lib/executor";
import { handleAIExecution, isLocalServerRunning } from "@/lib/local-executor";
import ExecutorPanel from "@/components/factory/ExecutorPanel";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Bot,
  Smartphone,
  Wrench,
  ChevronDown,
  ChevronUp,
  Sparkles,
  X,
  ImagePlus,
  Eye,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
  images?: string[]; // base64 or object URLs
  timestamp: Date;
}

interface AIChatPanelProps {
  mode: ChatMode;
  onSendMessage?: (message: string, mode: ChatMode, images?: File[]) => void;
  isGenerating?: boolean;
}

const MODE_CONFIG = {
  app: {
    icon: Smartphone,
    title: "App AI",
    subtitle: "Generate & Iterate",
    placeholder: "صف التطبيق أو أرفق صورة تصميم مرجعي...",
    accentClass: "from-amber-500 to-yellow-600",
    dotClass: "bg-amber-400",
    allowImages: true,
  },
  factory: {
    icon: Wrench,
    title: "Factory AI",
    subtitle: "Develop & Optimize",
    placeholder: "اكتب طلب تطوير المصنع...",
    accentClass: "from-cyan-500 to-blue-600",
    dotClass: "bg-cyan-400",
    allowImages: false,
  },
};

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const AIChatPanel = ({ mode, onSendMessage, isGenerating }: AIChatPanelProps) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [attachments, setAttachments] = useState<ImageAttachment[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [pendingActions, setPendingActions] = useState<ValidatedAction[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const config = MODE_CONFIG[mode];
  const Icon = config.icon;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      attachments.forEach((a) => URL.revokeObjectURL(a.preview));
    };
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: ImageAttachment[] = [];
    for (let i = 0; i < files.length; i++) {
      if (attachments.length + newAttachments.length >= MAX_IMAGES) {
        toast.error(`الحد الأقصى ${MAX_IMAGES} صور`);
        break;
      }
      const file = files[i];
      if (!file.type.startsWith("image/")) {
        toast.error(`"${file.name}" ليس ملف صورة`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`"${file.name}" أكبر من 10MB`);
        continue;
      }
      newAttachments.push({
        id: `img-${Date.now()}-${i}`,
        file,
        preview: URL.createObjectURL(file),
      });
    }

    setAttachments((prev) => [...prev, ...newAttachments]);
    // Reset file input
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
      text: text || (attachments.length > 0 ? `📎 ${attachments.length} صورة مرفقة` : ""),
      images: imagePreviews.length > 0 ? imagePreviews : undefined,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setAttachments([]);

    onSendMessage?.(text, mode, imageFiles.length > 0 ? imageFiles : undefined);

    // Build AI message history
    const aiMessages: AIMessage[] = [
      {
        role: "system",
        content: mode === "app"
          ? "أنت مساعد ذكي متخصص في بناء التطبيقات. ساعد المستخدم في تصميم وبناء تطبيقه. أجب بالعربية. كن مختصراً ومفيداً."
          : "أنت مساعد متخصص في تطوير وتحسين المصنع البرمجي. أجب بالعربية. كن تقنياً ودقيقاً.",
      },
      ...messages.filter(m => m.text).map(m => ({
        role: (m.role === "user" ? "user" : "assistant") as AIMessage["role"],
        content: m.text,
      })),
      { role: "user" as const, content: text || "تحليل الصور المرفقة" },
    ];

    // Create streaming AI response
    const aiMsgId = `${mode}-ai-${Date.now()}`;
    let aiContent = "";

    setMessages((prev) => [...prev, {
      id: aiMsgId,
      role: "ai",
      text: "▍",
      timestamp: new Date(),
    }]);

    sendAIMessage(aiMessages, {
      onToken: (token) => {
        aiContent += token;
        setMessages((prev) =>
          prev.map((m) => m.id === aiMsgId ? { ...m, text: aiContent + " ▍" } : m)
        );
      },
      onDone: () => {
        setMessages((prev) =>
          prev.map((m) => m.id === aiMsgId ? { ...m, text: aiContent || "✅ تم." } : m)
        );
        // Parse AI response for executable actions
        if (aiContent) {
          const parsed = parseAIResponse(aiContent);
          if (parsed.actions.length > 0) {
            setPendingActions(parsed.actions);
            toast.success(`🔧 تم اكتشاف ${parsed.actions.length} أمر قابل للتنفيذ`);
          }
        }
      },
      onError: (error) => {
        setMessages((prev) =>
          prev.map((m) => m.id === aiMsgId ? { ...m, text: `⚠️ ${error}` } : m)
        );
      },
    });
  }, [input, mode, onSendMessage, attachments, messages]);

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
    toast.success(mode === "app" ? "تم مسح محادثة التطبيق" : "تم مسح محادثة المصنع");
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!config.allowImages) return;

    const files = e.dataTransfer.files;
    const fakeEvent = { target: { files } } as unknown as React.ChangeEvent<HTMLInputElement>;
    handleFileSelect(fakeEvent);
  }, [config.allowImages, handleFileSelect]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="sf-glass rounded-2xl overflow-hidden border border-foreground/10"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {/* Header */}
        <button
          onClick={() => setIsExpanded((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-foreground/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl bg-gradient-to-br ${config.accentClass} flex items-center justify-center shadow-lg`}
            >
              <Icon className="h-4 w-4 text-white" />
            </div>
            <div className="text-start">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">{config.title}</span>
                <span className={`w-2 h-2 rounded-full ${config.dotClass} animate-pulse`} />
              </div>
              <span className="text-[10px] text-muted-foreground">{config.subtitle}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-foreground/10 text-muted-foreground">
                {messages.length}
              </span>
            )}
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Messages */}
              <div className="max-h-[240px] overflow-y-auto px-4 py-2 space-y-2 scrollbar-thin">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <Bot className="h-8 w-8 text-muted-foreground/40 mb-2" />
                    <p className="text-xs text-muted-foreground/60">
                      {mode === "app"
                        ? "ابدأ بوصف التطبيق أو أرفق صورة تصميم مرجعي..."
                        : "اكتب أي تعديل تريده على المصنع نفسه..."}
                    </p>
                    {mode === "app" && (
                      <p className="text-[10px] text-muted-foreground/40 mt-1">
                        📎 يمكنك سحب وإسقاط الصور أو استخدام زر الإرفاق
                      </p>
                    )}
                  </div>
                )}

                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-xl text-xs leading-relaxed overflow-hidden ${
                        msg.role === "user"
                          ? `bg-gradient-to-br ${config.accentClass} text-white`
                          : "sf-glass-subtle text-foreground"
                      }`}
                    >
                      {/* Image thumbnails */}
                      {msg.images && msg.images.length > 0 && (
                        <div className="flex flex-wrap gap-1 p-2 pb-0">
                          {msg.images.map((src, idx) => (
                            <button
                              key={idx}
                              onClick={() => setPreviewImage(src)}
                              className="relative group rounded-lg overflow-hidden w-16 h-16 flex-shrink-0"
                            >
                              <img
                                src={src}
                                alt={`مرفق ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                <Eye className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      {msg.text && (
                        <div className="px-3 py-2">
                          {msg.role === "ai" && (
                            <Sparkles className="inline h-3 w-3 mr-1 opacity-70" />
                          )}
                          {msg.text}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Executor Panel — shows parsed actions */}
              {pendingActions.length > 0 && (
                <div className="px-3 py-2">
                  <ExecutorPanel
                    actions={pendingActions}
                    onExecutionComplete={(results) => {
                      const summary = results.map(r => r.message).join("\n");
                      setMessages(prev => [...prev, {
                        id: `${mode}-exec-${Date.now()}`,
                        role: "ai",
                        text: `📋 نتائج التنفيذ:\n${summary}`,
                        timestamp: new Date(),
                      }]);
                    }}
                    onClear={() => setPendingActions([])}
                  />
                </div>
              )}

              {/* Attachment Preview Strip */}
              <AnimatePresence>
                {attachments.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-3 pt-1"
                  >
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                      {attachments.map((att) => (
                        <motion.div
                          key={att.id}
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          className="relative group flex-shrink-0"
                        >
                          <img
                            src={att.preview}
                            alt="مرفق"
                            className="w-14 h-14 rounded-lg object-cover border-2 border-foreground/10"
                          />
                          <button
                            onClick={() => removeAttachment(att.id)}
                            className="absolute -top-1.5 -end-1.5 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                          >
                            <X className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => setPreviewImage(att.preview)}
                            className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 rounded-lg transition-colors"
                          >
                            <Eye className="h-4 w-4 text-white opacity-0 group-hover:opacity-60 transition-opacity" />
                          </button>
                        </motion.div>
                      ))}
                      <span className="text-[10px] text-muted-foreground/50 flex-shrink-0">
                        {attachments.length}/{MAX_IMAGES}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input Area */}
              <div className="px-3 pb-3 pt-1">
                <div className="flex items-end gap-2 sf-glass-subtle rounded-xl p-2">
                  {/* Image attach button (app mode only) */}
                  {config.allowImages && (
                    <>
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
                        className="h-8 w-8 text-muted-foreground hover:text-amber-400 flex-shrink-0 disabled:opacity-30"
                        title="إرفاق صورة تصميم مرجعي"
                      >
                        <ImagePlus className="h-4 w-4" />
                      </Button>
                    </>
                  )}

                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={config.placeholder}
                    rows={1}
                    className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 resize-none outline-none min-h-[36px] max-h-[80px] py-1.5 px-2"
                    dir="auto"
                  />
                  <div className="flex items-center gap-1">
                    {messages.length > 0 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={clearChat}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      onClick={handleSend}
                      disabled={(!input.trim() && attachments.length === 0) || isGenerating}
                      className={`h-8 w-8 rounded-lg bg-gradient-to-br ${config.accentClass} text-white hover:opacity-90 disabled:opacity-30`}
                    >
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Full-screen Image Preview Modal */}
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
              <img
                src={previewImage}
                alt="معاينة الصورة"
                className="max-w-full max-h-[80vh] rounded-xl object-contain shadow-2xl"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPreviewImage(null)}
                className="absolute -top-3 -end-3 h-8 w-8 rounded-full bg-foreground/20 text-white hover:bg-foreground/40"
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="absolute bottom-3 start-3 text-[10px] text-white/60 sf-glass-subtle px-2 py-1 rounded-lg">
                🎨 Design Reference
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChatPanel;
