/**
 * KimiConsultant — AI Consultant panel with Chat, History & Analysis tabs.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { X, Send, Search, Trash2, MessageSquare, History, BarChart3, Plus } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { sendAIMessage, type AIMessage } from "@/lib/ai-provider";
import {
  type KimiConversation,
  type KimiMessage,
  loadConversations,
  createConversation,
  saveConversation,
  deleteConversation,
  generateTitle,
} from "@/lib/kimi-store";

interface Props {
  onClose: () => void;
  generatedFiles?: Record<string, string>;
}

const SYSTEM_PROMPT = `أنت "Kimi" — مستشار برمجة ذكي وودود. تشرح الكود بلغة بسيطة جداً.
إذا أعطاك المستخدم كوداً، حلّله وشرحه ببساطة. أجب دائماً بالعربية.`;

export default function KimiConsultant({ onClose, generatedFiles }: Props) {
  const [activeTab, setActiveTab] = useState("chat");
  const [conversations, setConversations] = useState<KimiConversation[]>(loadConversations);
  const [current, setCurrent] = useState<KimiConversation>(() => {
    const all = loadConversations();
    return all.length > 0 ? all[0] : createConversation();
  });
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [analyses, setAnalyses] = useState<{ text: string; date: string }[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [current.messages]);

  const refreshConversations = useCallback(() => {
    setConversations(loadConversations());
  }, []);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");

    const userMsg: KimiMessage = { sender: "user", text, timestamp: new Date().toISOString() };
    const updated = { ...current, messages: [...current.messages, userMsg], messageCount: current.messageCount + 1 };

    // Auto-title from first user message
    if (updated.messages.filter((m) => m.sender === "user").length === 1) {
      updated.title = generateTitle(text);
    }

    setCurrent(updated);
    saveConversation(updated);
    refreshConversations();

    // Build AI messages
    const aiMessages: AIMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...updated.messages.map((m) => ({
        role: (m.sender === "user" ? "user" : "assistant") as "user" | "assistant",
        content: m.text,
      })),
    ];

    setIsStreaming(true);
    let responseText = "";
    const controller = new AbortController();
    abortRef.current = controller;

    await sendAIMessage(
      aiMessages,
      {
        onToken: (token) => {
          responseText += token;
          const kimiMsg: KimiMessage = { sender: "kimi", text: responseText, timestamp: new Date().toISOString() };
          setCurrent((prev) => {
            const msgs = [...prev.messages];
            if (msgs.length > 0 && msgs[msgs.length - 1].sender === "kimi") {
              msgs[msgs.length - 1] = kimiMsg;
            } else {
              msgs.push(kimiMsg);
            }
            return { ...prev, messages: msgs, messageCount: msgs.length };
          });
        },
        onDone: () => {
          setIsStreaming(false);
          setCurrent((prev) => {
            saveConversation(prev);
            refreshConversations();
            return prev;
          });
        },
        onError: (err) => {
          setIsStreaming(false);
          const errMsg: KimiMessage = { sender: "kimi", text: `⚠️ ${err}`, timestamp: new Date().toISOString() };
          setCurrent((prev) => {
            const updated2 = { ...prev, messages: [...prev.messages, errMsg], messageCount: prev.messageCount + 1 };
            saveConversation(updated2);
            refreshConversations();
            return updated2;
          });
        },
      },
      controller.signal
    );
  }, [input, isStreaming, current, refreshConversations]);

  const handleNewChat = useCallback(() => {
    const newConvo = createConversation();
    setCurrent(newConvo);
    setActiveTab("chat");
  }, []);

  const handleSelectConversation = useCallback((convo: KimiConversation) => {
    setCurrent(convo);
    setActiveTab("chat");
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      deleteConversation(id);
      refreshConversations();
      if (current.id === id) {
        const remaining = loadConversations();
        setCurrent(remaining.length > 0 ? remaining[0] : createConversation());
      }
    },
    [current.id, refreshConversations]
  );

  const handleAnalyze = useCallback(() => {
    const codeSnippet = generatedFiles
      ? Object.entries(generatedFiles)
          .slice(0, 3)
          .map(([name, code]) => `// ${name}\n${code.slice(0, 300)}`)
          .join("\n\n")
      : "";

    if (!codeSnippet) {
      setAnalyses((prev) => [
        { text: "لا يوجد كود حالياً للتحليل. أنشئ مشروعاً أولاً من المحرر.", date: new Date().toLocaleString("ar-EG") },
        ...prev,
      ]);
      return;
    }

    const prompt = `حلّل هذا الكود بلغة بسيطة جداً:\n\n${codeSnippet}`;
    setIsStreaming(true);
    let result = "";

    sendAIMessage(
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      {
        onToken: (t) => {
          result += t;
          setAnalyses((prev) => {
            const copy = [...prev];
            if (copy.length > 0 && copy[0].date === "جاري...") {
              copy[0] = { text: result, date: "جاري..." };
            } else {
              copy.unshift({ text: result, date: "جاري..." });
            }
            return copy;
          });
        },
        onDone: () => {
          setIsStreaming(false);
          setAnalyses((prev) => {
            const copy = [...prev];
            if (copy.length > 0) copy[0] = { ...copy[0], date: new Date().toLocaleString("ar-EG") };
            return copy;
          });
        },
        onError: (err) => {
          setIsStreaming(false);
          setAnalyses((prev) => [{ text: `⚠️ ${err}`, date: new Date().toLocaleString("ar-EG") }, ...prev]);
        },
      }
    );
  }, [generatedFiles]);

  // Filter conversations for search
  const filtered = searchQuery
    ? conversations.filter(
        (c) =>
          c.title.includes(searchQuery) ||
          c.messages.some((m) => m.text.includes(searchQuery))
      )
    : conversations;

  // Group by date
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  const groups: { label: string; items: KimiConversation[] }[] = [];
  const todayItems = filtered.filter((c) => c.date === today);
  const yesterdayItems = filtered.filter((c) => c.date === yesterday);
  const olderItems = filtered.filter((c) => c.date !== today && c.date !== yesterday);
  if (todayItems.length) groups.push({ label: "اليوم", items: todayItems });
  if (yesterdayItems.length) groups.push({ label: "الأمس", items: yesterdayItems });
  if (olderItems.length) groups.push({ label: "أقدم", items: olderItems });

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      className="h-full flex flex-col bg-[hsl(220,20%,8%)] border-r border-border/20"
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/20">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <h2 className="text-sm font-bold text-foreground">استشر Kimi</h2>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNewChat} title="محادثة جديدة">
            <Plus className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="mx-3 mt-2 bg-[hsl(220,20%,12%)]">
          <TabsTrigger value="chat" className="flex-1 gap-1 text-xs">
            <MessageSquare className="h-3 w-3" /> الدردشة
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-1 gap-1 text-xs">
            <History className="h-3 w-3" /> السجل
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex-1 gap-1 text-xs">
            <BarChart3 className="h-3 w-3" /> التحليل
          </TabsTrigger>
        </TabsList>

        {/* ─── Chat Tab ─── */}
        <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden m-0 p-0">
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {current.messages.length === 0 && (
              <div className="text-center text-muted-foreground text-xs mt-8">
                <p className="text-2xl mb-2">🤖</p>
                <p>مرحباً! أنا Kimi، مستشارك البرمجي.</p>
                <p className="mt-1">اسألني أي سؤال عن الكود!</p>
              </div>
            )}
            {current.messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.sender === "user" ? "justify-start" : "justify-end"}`}>
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-primary/20 text-foreground"
                      : "bg-[hsl(220,20%,14%)] text-foreground"
                  }`}
                >
                  <span className="font-bold text-[10px] block mb-0.5 text-muted-foreground">
                    {msg.sender === "user" ? "👤 أنت" : "🤖 Kimi"}
                  </span>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border/20">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="اكتب سؤالك هنا..."
                className="flex-1 bg-[hsl(220,20%,12%)] text-foreground text-xs rounded-lg px-3 py-2 border border-border/20 focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground"
                disabled={isStreaming}
              />
              <Button size="icon" className="h-8 w-8 shrink-0" onClick={handleSend} disabled={isStreaming || !input.trim()}>
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* ─── History Tab ─── */}
        <TabsContent value="history" className="flex-1 flex flex-col overflow-hidden m-0 p-0">
          <div className="p-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث في المحادثات..."
                className="w-full bg-[hsl(220,20%,12%)] text-foreground text-xs rounded-lg pr-8 pl-3 py-2 border border-border/20 focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-3">
            {groups.length === 0 && (
              <p className="text-center text-muted-foreground text-xs mt-8">لا توجد محادثات محفوظة</p>
            )}
            {groups.map((group) => (
              <div key={group.label}>
                <h3 className="text-[10px] font-bold text-muted-foreground mb-1.5">{group.label}</h3>
                <div className="space-y-1">
                  {group.items.map((convo) => (
                    <div
                      key={convo.id}
                      className={`group flex items-center justify-between rounded-lg px-3 py-2 cursor-pointer transition-colors ${
                        convo.id === current.id
                          ? "bg-primary/20 border border-primary/30"
                          : "bg-[hsl(220,20%,12%)] hover:bg-[hsl(220,20%,16%)]"
                      }`}
                      onClick={() => handleSelectConversation(convo)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{convo.title}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {convo.messageCount} رسالة · {convo.time}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(convo.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-destructive transition-all"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ─── Analysis Tab ─── */}
        <TabsContent value="analysis" className="flex-1 flex flex-col overflow-hidden m-0 p-0">
          <div className="p-3">
            <Button size="sm" className="w-full text-xs gap-1.5" onClick={handleAnalyze} disabled={isStreaming}>
              <BarChart3 className="h-3 w-3" />
              تحليل الكود الحالي
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-3">
            {analyses.length === 0 && (
              <p className="text-center text-muted-foreground text-xs mt-8">اضغط "تحليل الكود" لبدء التحليل</p>
            )}
            {analyses.map((a, i) => (
              <div key={i} className="bg-[hsl(220,20%,12%)] rounded-lg p-3 border border-border/20">
                <p className="text-[10px] text-muted-foreground mb-2">📅 {a.date}</p>
                <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">{a.text}</p>
                <button
                  onClick={() => {
                    setInput("لدي سؤال عن التحليل السابق");
                    setActiveTab("chat");
                  }}
                  className="mt-2 text-[10px] text-primary hover:underline"
                >
                  هل لديك سؤال؟ ← للدردشة
                </button>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
