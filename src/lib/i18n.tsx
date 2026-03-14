import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

type Lang = "en" | "ar";

const translations = {
  en: {
    // Header
    "app.title": "Sirou Factory",
    "app.subtitle": "Application Builder Expert",
    "sovereign.online": "Sovereign Mode: Online",
    "sovereign.offline": "Sovereign Mode: Offline",
    "oversight.active": "Human Oversight Active",

    // App Idea
    "idea.title": "App Idea",
    "idea.tooltip": "Describe what you want to build. Be specific about features, design style, and target audience for best results.",
    "idea.placeholder": "Describe your application idea in detail...",
    "idea.generate": "Generate App",
    "idea.generating": "Generating...",
    "idea.suggestion1": "A task manager with drag-and-drop boards",
    "idea.suggestion2": "An e-commerce store with product filtering",
    "idea.suggestion3": "A real-time chat application with rooms",
    "idea.suggestion4": "A personal portfolio with blog section",

    // Transparency Center
    "transparency.title": "Transparency & Sovereignty Center",
    "transparency.tooltip": "Every action is classified by risk. Red actions need your explicit approval before execution.",
    "transparency.safe": "Safe",
    "transparency.caution": "Needs Review",
    "transparency.danger": "Sensitive",
    "transparency.empty": "No actions yet. Generate an app to see the action plan.",
    "transparency.approve": "Approve",
    "transparency.reject": "Reject",
    "transparency.approved": "✓ Approved",
    "transparency.rejected": "✗ Rejected",

    // Preview
    "preview.title": "Live Preview",
    "preview.tooltip": "See your app before building. Switch between device sizes to test responsiveness.",
    "preview.empty": "Your app preview will appear here",
    "preview.hint": "Enter an idea and click Generate",

    // Factory Controls
    "controls.title": "Factory Controls",
    "controls.publish": "Publish App",
    "controls.publish.tooltip": "Deploy your app to production with one click",
    "controls.export": "Full System Export",
    "controls.export.tooltip": "Export code, Docker files, and Nginx config for self-hosting",
    "controls.apikeys": "API Keys",
    "controls.apikeys.tooltip": "Securely manage OpenAI, Anthropic, and other API keys",
    "controls.plugins": "Plugins",
    "controls.plugins.tooltip": "Add Auth, Payments, Maps, Analytics, and more",
    "controls.backend": "Backend",
    "controls.backend.connected": "Backend ✓",
    "controls.backend.tooltip.connected": "Connected — click to manage",
    "controls.backend.tooltip.disconnected": "Connect your Supabase backend",
    "controls.settings": "Settings",
    "controls.settings.tooltip": "Factory preferences and learning log",

    // Backend Modal
    "backend.title": "Backend Connection",
    "backend.description": "Connect your Supabase project to enable database, auth, and storage.",
    "backend.url": "Project URL",
    "backend.url.placeholder": "https://your-project.supabase.co",
    "backend.key": "Anon Key",
    "backend.key.placeholder": "eyJhbGciOiJIUzI1NiIs...",
    "backend.key.hint": "Found in Supabase → Settings → API → anon public key",
    "backend.connect": "Connect",
    "backend.reconnect": "Reconnect",
    "backend.connecting": "Connecting...",
    "backend.disconnect": "Disconnect",

    // Toasts
    "toast.plan.generated": "Action plan generated! Review actions below.",
    "toast.approved": "Action approved ✓",
    "toast.rejected": "Action rejected — it will be skipped.",
    "toast.pending": "action(s) still need your approval before publishing.",
    "toast.published": "App published successfully! 🚀",
    "toast.exported": "Export package prepared: code, Docker, and Nginx configs included.",
    "toast.connected": "Backend connected — Sovereign Mode: Online 🟢",
    "toast.connect.failed": "Connection failed. Check your credentials.",
    "toast.disconnected": "Backend disconnected.",
    "toast.creds.missing": "Please provide both Project URL and Anon Key.",

    // Action plan items
    "plan.scaffold.title": "Create project scaffold",
    "plan.scaffold.desc": "Initialize React + TypeScript project structure for:",
    "plan.tailwind.title": "Apply Tailwind design system",
    "plan.tailwind.desc": "Set up professional color palette, typography, and spacing tokens.",
    "plan.db.title": "Create database schema",
    "plan.db.desc": "Will create tables and RLS policies in Supabase for data isolation.",
    "plan.auth.title": "Set up authentication",
    "plan.auth.desc": "Configure Supabase Auth with email/password. No external providers without approval.",
    "plan.api.title": "External API integration detected",
    "plan.api.desc": "Your idea may require third-party APIs. No data will be sent without your explicit approval.",
  },
  ar: {
    "app.title": "مصنع سيرو",
    "app.subtitle": "خبير بناء التطبيقات",
    "sovereign.online": "وضع السيادة: متصل",
    "sovereign.offline": "وضع السيادة: غير متصل",
    "oversight.active": "الإشراف البشري نشط",

    "idea.title": "فكرة التطبيق",
    "idea.tooltip": "صف ما تريد بناءه. كن محددًا بشأن الميزات وأسلوب التصميم والجمهور المستهدف للحصول على أفضل النتائج.",
    "idea.placeholder": "صف فكرة تطبيقك بالتفصيل...",
    "idea.generate": "توليد التطبيق",
    "idea.generating": "جاري التوليد...",
    "idea.suggestion1": "مدير مهام مع لوحات سحب وإفلات",
    "idea.suggestion2": "متجر إلكتروني مع تصفية المنتجات",
    "idea.suggestion3": "تطبيق دردشة فوري مع غرف",
    "idea.suggestion4": "معرض أعمال شخصي مع قسم مدونة",

    "transparency.title": "مركز الشفافية والسيادة",
    "transparency.tooltip": "يتم تصنيف كل إجراء حسب المخاطر. الإجراءات الحمراء تحتاج موافقتك الصريحة قبل التنفيذ.",
    "transparency.safe": "آمن",
    "transparency.caution": "يحتاج مراجعة",
    "transparency.danger": "حساس",
    "transparency.empty": "لا توجد إجراءات بعد. أنشئ تطبيقًا لرؤية خطة العمل.",
    "transparency.approve": "موافقة",
    "transparency.reject": "رفض",
    "transparency.approved": "✓ تمت الموافقة",
    "transparency.rejected": "✗ تم الرفض",

    "preview.title": "معاينة مباشرة",
    "preview.tooltip": "شاهد تطبيقك قبل البناء. بدّل بين أحجام الأجهزة لاختبار الاستجابة.",
    "preview.empty": "ستظهر معاينة تطبيقك هنا",
    "preview.hint": "أدخل فكرة وانقر على توليد",

    "controls.title": "أدوات التحكم بالمصنع",
    "controls.publish": "نشر التطبيق",
    "controls.publish.tooltip": "انشر تطبيقك للإنتاج بنقرة واحدة",
    "controls.export": "تصدير النظام الكامل",
    "controls.export.tooltip": "تصدير الكود وملفات Docker وإعدادات Nginx للاستضافة الذاتية",
    "controls.apikeys": "مفاتيح API",
    "controls.apikeys.tooltip": "إدارة مفاتيح OpenAI و Anthropic وغيرها بأمان",
    "controls.plugins": "الإضافات",
    "controls.plugins.tooltip": "إضافة المصادقة والمدفوعات والخرائط والتحليلات والمزيد",
    "controls.backend": "قاعدة البيانات",
    "controls.backend.connected": "قاعدة البيانات ✓",
    "controls.backend.tooltip.connected": "متصل — انقر للإدارة",
    "controls.backend.tooltip.disconnected": "اربط مشروع Supabase الخاص بك",
    "controls.settings": "الإعدادات",
    "controls.settings.tooltip": "تفضيلات المصنع وسجل التعلم",

    "backend.title": "اتصال قاعدة البيانات",
    "backend.description": "اربط مشروع Supabase الخاص بك لتفعيل قاعدة البيانات والمصادقة والتخزين.",
    "backend.url": "رابط المشروع",
    "backend.url.placeholder": "https://your-project.supabase.co",
    "backend.key": "مفتاح Anon",
    "backend.key.placeholder": "eyJhbGciOiJIUzI1NiIs...",
    "backend.key.hint": "موجود في Supabase ← الإعدادات ← API ← المفتاح العام",
    "backend.connect": "اتصال",
    "backend.reconnect": "إعادة الاتصال",
    "backend.connecting": "جاري الاتصال...",
    "backend.disconnect": "قطع الاتصال",

    "toast.plan.generated": "تم توليد خطة العمل! راجع الإجراءات أدناه.",
    "toast.approved": "تمت الموافقة على الإجراء ✓",
    "toast.rejected": "تم رفض الإجراء — سيتم تخطيه.",
    "toast.pending": "إجراء(ات) لا تزال بحاجة لموافقتك قبل النشر.",
    "toast.published": "تم نشر التطبيق بنجاح! 🚀",
    "toast.exported": "تم تجهيز حزمة التصدير: الكود وملفات Docker وإعدادات Nginx.",
    "toast.connected": "تم الاتصال بقاعدة البيانات — وضع السيادة: متصل 🟢",
    "toast.connect.failed": "فشل الاتصال. تحقق من بياناتك.",
    "toast.disconnected": "تم قطع الاتصال بقاعدة البيانات.",
    "toast.creds.missing": "يرجى تقديم رابط المشروع ومفتاح Anon.",

    "plan.scaffold.title": "إنشاء هيكل المشروع",
    "plan.scaffold.desc": "تهيئة هيكل مشروع React + TypeScript لـ:",
    "plan.tailwind.title": "تطبيق نظام تصميم Tailwind",
    "plan.tailwind.desc": "إعداد لوحة ألوان احترافية وأنماط الخطوط والمسافات.",
    "plan.db.title": "إنشاء مخطط قاعدة البيانات",
    "plan.db.desc": "سيتم إنشاء جداول وسياسات RLS في Supabase لعزل البيانات.",
    "plan.auth.title": "إعداد المصادقة",
    "plan.auth.desc": "تكوين مصادقة Supabase بالبريد الإلكتروني وكلمة المرور. لا موفرين خارجيين بدون موافقة.",
    "plan.api.title": "تم اكتشاف تكامل API خارجي",
    "plan.api.desc": "قد تتطلب فكرتك واجهات برمجة خارجية. لن يتم إرسال أي بيانات بدون موافقتك الصريحة.",
  },
} as const;

type TranslationKey = keyof typeof translations.en;

interface I18nContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
  dir: "ltr" | "rtl";
}

const I18nContext = createContext<I18nContextType | null>(null);

const LANG_KEY = "sirou_language";

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      const stored = localStorage.getItem(LANG_KEY);
      return stored === "ar" ? "ar" : "en";
    } catch {
      return "en";
    }
  });

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang);
    localStorage.setItem(LANG_KEY, newLang);
  }, []);

  const dir = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.setAttribute("dir", dir);
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.style.fontFamily =
      lang === "ar"
        ? "'Cairo', 'Tajawal', sans-serif"
        : "'Inter', sans-serif";
  }, [lang, dir]);

  const t = useCallback(
    (key: TranslationKey): string => {
      return translations[lang][key] || translations.en[key] || key;
    },
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, t, dir }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
};
