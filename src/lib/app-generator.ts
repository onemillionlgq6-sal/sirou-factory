/**
 * App Generator — Template-based React code generator for built-in mode.
 * Converts natural language descriptions into valid JSON Actions with real React TSX code.
 * Used when no external AI API key is configured.
 */

interface GeneratedAction {
  action: string;
  path: string;
  content?: string;
  search?: string;
  replace?: string;
}

interface AppTemplate {
  keywords: string[];
  generate: (description: string) => GeneratedAction[];
}

// ─── Utility: Generate a page component ───

function makePage(name: string, jsx: string, imports: string = ""): string {
  return `import { useState } from "react";
${imports}
const ${name} = () => {
${jsx}
};

export default ${name};`;
}

// ─── Utility: Add route to App.tsx ───

function makeRouteAction(pageName: string): GeneratedAction {
  const routePath = "/" + pageName.replace(/([A-Z])/g, (m, p1, offset) =>
    offset > 0 ? `-${p1.toLowerCase()}` : p1.toLowerCase()
  );
  return {
    action: "edit_file",
    path: "src/App.tsx",
    search: `{/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}`,
    replace: `<Route path="${routePath}" element={<${pageName} />} />\n              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}`,
  };
}

// ─── App Templates ───

const templates: AppTemplate[] = [
  {
    keywords: ["دردشة", "شات", "chat", "messaging", "محادثة"],
    generate: (desc) => {
      const actions: GeneratedAction[] = [];
      actions.push({
        action: "create_file",
        path: "src/pages/ChatApp.tsx",
        content: makePage("ChatApp", `
  const [messages, setMessages] = useState<{id: number; text: string; sender: string; time: string}[]>([
    { id: 1, text: "مرحباً! كيف حالك؟", sender: "أحمد", time: "10:30" },
    { id: 2, text: "أهلاً، الحمد لله بخير", sender: "أنت", time: "10:31" },
    { id: 3, text: "هل أنت جاهز للاجتماع؟", sender: "أحمد", time: "10:32" },
  ]);
  const [input, setInput] = useState("");
  const [activeChat, setActiveChat] = useState("أحمد");

  const contacts = ["أحمد", "سارة", "محمد", "فاطمة"];

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, {
      id: Date.now(),
      text: input,
      sender: "أنت",
      time: new Date().toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" }),
    }]);
    setInput("");
  };

  return (
    <div className="flex h-screen bg-gray-100" dir="rtl">
      {/* Sidebar */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-4 bg-emerald-600 text-white">
          <h1 className="text-xl font-bold">💬 المحادثات</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {contacts.map(name => (
            <button
              key={name}
              onClick={() => setActiveChat(name)}
              className={\`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition border-b border-gray-100 \${activeChat === name ? "bg-emerald-50" : ""}\`}
            >
              <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-lg">
                {name[0]}
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-800">{name}</p>
                <p className="text-sm text-gray-500">آخر رسالة...</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 bg-white border-b border-gray-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold">
            {activeChat[0]}
          </div>
          <div>
            <p className="font-semibold text-gray-800">{activeChat}</p>
            <p className="text-xs text-emerald-500">متصل الآن</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-[#e5ddd5]">
          {messages.map(msg => (
            <div key={msg.id} className={\`flex \${msg.sender === "أنت" ? "justify-start" : "justify-end"}\`}>
              <div className={\`max-w-xs px-4 py-2 rounded-2xl shadow-sm \${
                msg.sender === "أنت"
                  ? "bg-emerald-100 text-gray-800 rounded-br-none"
                  : "bg-white text-gray-800 rounded-bl-none"
              }\`}>
                <p className="text-sm">{msg.text}</p>
                <p className="text-[10px] text-gray-400 mt-1">{msg.time}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-white border-t border-gray-200 flex gap-3">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
            placeholder="اكتب رسالة..."
            className="flex-1 px-4 py-3 rounded-full bg-gray-100 outline-none text-gray-800 placeholder-gray-400"
          />
          <button
            onClick={sendMessage}
            className="px-6 py-3 bg-emerald-500 text-white rounded-full font-semibold hover:bg-emerald-600 transition"
          >
            إرسال
          </button>
        </div>
      </div>
    </div>
  );`),
      });
      return actions;
    },
  },

  {
    keywords: ["توصيل", "delivery", "طلبات", "سائق", "driver", "order"],
    generate: (desc) => {
      const actions: GeneratedAction[] = [];
      actions.push({
        action: "create_file",
        path: "src/pages/DeliveryApp.tsx",
        content: makePage("DeliveryApp", `
  const [activeTab, setActiveTab] = useState<"home" | "orders" | "track" | "profile">("home");
  const [orders, setOrders] = useState([
    { id: 1001, item: "وجبة برجر دبل", status: "جاري التوصيل", driver: "خالد", time: "15 دقيقة", price: "45 ر.س" },
    { id: 1002, item: "بيتزا كبيرة", status: "قيد التحضير", driver: "---", time: "30 دقيقة", price: "65 ر.س" },
    { id: 1003, item: "شاورما عربي", status: "تم التوصيل", driver: "أحمد", time: "تم", price: "25 ر.س" },
  ]);

  const statusColors: Record<string, string> = {
    "جاري التوصيل": "bg-blue-100 text-blue-700",
    "قيد التحضير": "bg-yellow-100 text-yellow-700",
    "تم التوصيل": "bg-green-100 text-green-700",
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-l from-orange-500 to-red-500 text-white p-6 pb-12 rounded-b-3xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-orange-100 text-sm">مرحباً</p>
            <h1 className="text-2xl font-bold">محمد 👋</h1>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl">🛵</div>
        </div>
        <div className="bg-white/20 backdrop-blur rounded-2xl p-4 flex items-center gap-3">
          <span className="text-xl">📍</span>
          <div>
            <p className="text-sm text-orange-100">التوصيل إلى</p>
            <p className="font-semibold">شارع الملك فهد، الرياض</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-6 -mt-6">
        <div className="bg-white rounded-2xl shadow-lg p-4 grid grid-cols-4 gap-3">
          {[
            { icon: "🍔", label: "مطاعم" },
            { icon: "🛒", label: "بقالة" },
            { icon: "💊", label: "صيدلية" },
            { icon: "📦", label: "طرود" },
          ].map(item => (
            <button key={item.label} className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-orange-50 transition">
              <span className="text-3xl">{item.icon}</span>
              <span className="text-xs font-medium text-gray-600">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Orders */}
      <div className="px-6 mt-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">📋 طلباتك</h2>
        <div className="space-y-3">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">{order.item}</h3>
                <span className={\`text-xs px-3 py-1 rounded-full font-medium \${statusColors[order.status] || "bg-gray-100 text-gray-600"}\`}>
                  {order.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>🧑‍✈️ {order.driver}</span>
                <span>⏱️ {order.time}</span>
                <span className="font-bold text-orange-600">{order.price}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-around">
        {[
          { id: "home" as const, icon: "🏠", label: "الرئيسية" },
          { id: "orders" as const, icon: "📋", label: "طلباتي" },
          { id: "track" as const, icon: "📍", label: "التتبع" },
          { id: "profile" as const, icon: "👤", label: "حسابي" },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={\`flex flex-col items-center gap-1 transition \${activeTab === tab.id ? "text-orange-600" : "text-gray-400"}\`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );`),
      });
      return actions;
    },
  },

  {
    keywords: ["متجر", "store", "shop", "ecommerce", "تسوق", "منتجات", "products"],
    generate: (desc) => [{
      action: "create_file",
      path: "src/pages/StoreApp.tsx",
      content: makePage("StoreApp", `
  const [cart, setCart] = useState<number[]>([]);
  const products = [
    { id: 1, name: "سماعات لاسلكية", price: 299, image: "🎧", rating: 4.8 },
    { id: 2, name: "ساعة ذكية", price: 599, image: "⌚", rating: 4.5 },
    { id: 3, name: "حقيبة ظهر", price: 189, image: "🎒", rating: 4.3 },
    { id: 4, name: "كاميرا احترافية", price: 2499, image: "📷", rating: 4.9 },
    { id: 5, name: "لابتوب خفيف", price: 3999, image: "💻", rating: 4.7 },
    { id: 6, name: "شاحن سريع", price: 99, image: "🔌", rating: 4.2 },
  ];

  const toggleCart = (id: number) => {
    setCart(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="bg-gradient-to-l from-indigo-600 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">🛍️ المتجر</h1>
          <div className="relative">
            <span className="text-2xl">🛒</span>
            {cart.length > 0 && (
              <span className="absolute -top-2 -left-2 w-5 h-5 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold">
                {cart.length}
              </span>
            )}
          </div>
        </div>
        <input
          placeholder="ابحث عن منتج..."
          className="w-full px-4 py-3 rounded-xl bg-white/20 text-white placeholder-white/60 outline-none backdrop-blur"
        />
      </div>

      <div className="p-6 grid grid-cols-2 gap-4">
        {products.map(p => (
          <div key={p.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col">
            <div className="text-5xl text-center mb-3 py-4 bg-gray-50 rounded-xl">{p.image}</div>
            <h3 className="font-semibold text-gray-800 text-sm">{p.name}</h3>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-yellow-500 text-xs">⭐ {p.rating}</span>
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className="font-bold text-indigo-600">{p.price} ر.س</span>
              <button
                onClick={() => toggleCart(p.id)}
                className={\`px-3 py-1.5 rounded-lg text-xs font-semibold transition \${
                  cart.includes(p.id)
                    ? "bg-red-100 text-red-600"
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                }\`}
              >
                {cart.includes(p.id) ? "إزالة" : "أضف"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );`),
    }],
  },
];

// ─── Default template for any description ───

function generateDefault(description: string): GeneratedAction[] {
  const safeName = "GeneratedApp";
  return [{
    action: "create_file",
    path: `src/pages/${safeName}.tsx`,
    content: makePage(safeName, `
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-6" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full text-center">
        <div className="text-6xl mb-6">🚀</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-3">تطبيقك جاهز!</h1>
        <p className="text-gray-500 mb-6 leading-relaxed">${description.replace(/"/g, '\\"').slice(0, 200)}</p>
        <div className="bg-gray-50 rounded-2xl p-6 mb-6">
          <p className="text-5xl font-bold text-indigo-600 mb-2">{count}</p>
          <p className="text-sm text-gray-400">عداد تفاعلي</p>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => setCount(c => c + 1)}
            className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
          >
            + زيادة
          </button>
          <button
            onClick={() => setCount(0)}
            className="px-8 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition"
          >
            إعادة تعيين
          </button>
        </div>
      </div>
    </div>
  );`),
  }];
}

// ─── Main Generator ───

export function generateAppFromDescription(description: string): string {
  const lower = description.toLowerCase();

  // Find matching template
  let actions: GeneratedAction[] | null = null;
  for (const template of templates) {
    if (template.keywords.some(kw => lower.includes(kw))) {
      actions = template.generate(description);
      break;
    }
  }

  if (!actions) {
    actions = generateDefault(description);
  }

  // Wrap in JSON Actions format
  const jsonActions = JSON.stringify(actions, null, 2);
  return `\`\`\`json\n${jsonActions}\n\`\`\``;
}
