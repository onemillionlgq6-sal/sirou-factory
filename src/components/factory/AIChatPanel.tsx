/**
 * AIChatPanel — Persistent AI communication input.
 * Two modes: "app" (for app generation) and "factory" (for factory development).
 * Each mode maintains its own independent message history.
 */

import { useState, useCallback, useRef, useEffect } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type ChatMode = "app" | "factory";

interface ChatMessage {
  id: string;
  role: "user" | "ai";
  text: string;
  timestamp: Date;
}

interface AIChatPanelProps {
  mode: ChatMode;
  onSendMessage?: (message: string, mode: ChatMode) => void;
  isGenerating?: boolean;
}

const MODE_CONFIG = {
  app: {
    icon: Smartphone,
    title: "App AI",
    subtitle: "Generate & Iterate",
    placeholder: "صف التطبيق أو التعديل المطلوب...",
    accentClass: "from-amber-500 to-yellow-600",
    dotClass: "bg-amber-400",
  },
  factory: {
    icon: Wrench,
    title: "Factory AI",
    subtitle: "Develop & Optimize",
    placeholder: "اكتب طلب تطوير المصنع...",
    accentClass: "from-cyan-500 to-blue-600",
    dotClass: "bg-cyan-400",
  },
};

const AIChatPanel = ({ mode, onSendMessage, isGenerating }: AIChatPanelProps) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const config = MODE_CONFIG[mode];
  const Icon = config.icon;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `${mode}-${Date.now()}`,
      role: "user",
      text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    onSendMessage?.(text, mode);

    // Simulate AI response
    setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: `${mode}-ai-${Date.now()}`,
        role: "ai",
        text:
          mode === "app"
            ? `✅ تم استلام طلبك. جاري تحليل: "${text.slice(0, 50)}${text.length > 50 ? "..." : ""}"...`
            : `🔧 تم تسجيل طلب تطوير المصنع. جاري المعالجة...`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    }, 800);
  }, [input, mode, onSendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([]);
    toast.success(mode === "app" ? "تم مسح محادثة التطبيق" : "تم مسح محادثة المصنع");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="sf-glass rounded-2xl overflow-hidden border border-foreground/10"
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
            <div className="max-h-[200px] overflow-y-auto px-4 py-2 space-y-2 scrollbar-thin">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <Bot className="h-8 w-8 text-muted-foreground/40 mb-2" />
                  <p className="text-xs text-muted-foreground/60">
                    {mode === "app"
                      ? "ابدأ بوصف التطبيق الذي تريد بناءه..."
                      : "اكتب أي تعديل تريده على المصنع نفسه..."}
                  </p>
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
                    className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                      msg.role === "user"
                        ? `bg-gradient-to-br ${config.accentClass} text-white`
                        : "sf-glass-subtle text-foreground"
                    }`}
                  >
                    {msg.role === "ai" && (
                      <Sparkles className="inline h-3 w-3 mr-1 opacity-70" />
                    )}
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="px-3 pb-3 pt-1">
              <div className="flex items-end gap-2 sf-glass-subtle rounded-xl p-2">
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
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    onClick={handleSend}
                    disabled={!input.trim() || isGenerating}
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
  );
};

export default AIChatPanel;
