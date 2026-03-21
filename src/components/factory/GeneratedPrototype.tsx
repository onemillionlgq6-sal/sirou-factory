import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { THEMES, type AppTheme } from "@/lib/design-theme-engine";
import {
  Home, Settings, User, Bell, Search, ShoppingCart, Heart, Star,
  ChevronRight, Menu, BarChart3, Camera, MapPin, QrCode, Mic,
  Plus, Trash2, Check, X, ArrowLeft, Send, Image, Package,
  LogIn, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2,
  Shield, Users, KeyRound, Activity, Ban, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import type { AppBlueprint } from "./AIPlannerEngine";

interface GeneratedPrototypeProps {
  appName: string;
  blueprint: AppBlueprint | null;
}

type Screen = "splash" | "login" | "home" | "dashboard" | "profile" | "cart" | "detail" | "camera" | "settings" | "admin-users" | "admin-vault";

// ═══ DEV MODE: Auto-login as Super Admin ═══
const IS_DEV_MODE = true;

interface MockUser {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user";
  status: "active" | "suspended";
  lastLogin: string;
}

const MOCK_USERS: MockUser[] = [
  { id: 1, name: "Root Admin (You)", email: "root@sirou.app", role: "admin", status: "active", lastLogin: "Just now" },
  { id: 2, name: "Sarah Engineer", email: "sarah@company.com", role: "admin", status: "active", lastLogin: "2h ago" },
  { id: 3, name: "Omar User", email: "omar@email.com", role: "user", status: "active", lastLogin: "1d ago" },
  { id: 4, name: "Lina Tester", email: "lina@test.io", role: "user", status: "suspended", lastLogin: "5d ago" },
  { id: 5, name: "Dev Bot", email: "bot@sirou.app", role: "user", status: "active", lastLogin: "3h ago" },
];

const GeneratedPrototype = ({ appName, blueprint }: GeneratedPrototypeProps) => {
  const theme = useMemo<AppTheme>(() => blueprint?.theme || THEMES.sovereign, [blueprint?.theme]);
  const grad = `linear-gradient(135deg, ${theme.primary}, ${theme.primaryEnd})`;

  // Dev mode: skip splash/login, start as Root Admin
  const [screen, setScreen] = useState<Screen>(IS_DEV_MODE ? "home" : "splash");
  const [items, setItems] = useState([
    { id: 1, name: "Premium Feature", done: false },
    { id: 2, name: "Analytics Module", done: false },
    { id: 3, name: "User Settings", done: false },
  ]);
  const [cartCount, setCartCount] = useState(0);
  const [likes, setLikes] = useState<Set<number>>(new Set());
  const [newItem, setNewItem] = useState("");
  const [notifCount, setNotifCount] = useState(3);
  const [isRecording, setIsRecording] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [email, setEmail] = useState(IS_DEV_MODE ? "root@sirou.app" : "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [userRole, setUserRole] = useState<"user" | "admin">(IS_DEV_MODE ? "admin" : "user");
  const [managedUsers, setManagedUsers] = useState(MOCK_USERS);
  const [splashDone, setSplashDone] = useState(IS_DEV_MODE);

  useState(() => {
    if (!IS_DEV_MODE) {
      setTimeout(() => { setSplashDone(true); setScreen("login"); }, 2500);
    }
  });

  const navigateTo = useCallback((s: Screen) => setScreen(s), []);

  const handleLogin = useCallback(() => {
    setLoginError("");
    if (!email.trim()) { setLoginError("Please enter your email"); return; }
    if (!email.includes("@")) { setLoginError("Please enter a valid email"); return; }
    if (password.length < 4) { setLoginError("Password must be at least 4 characters"); return; }
    setIsLoggingIn(true);
    setTimeout(() => {
      setIsLoggingIn(false);
      setScreen("home");
      toast.success("Welcome! You're now logged in 🎉");
    }, 1200);
  }, [email, password]);

  const toggleItem = useCallback((id: number) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, done: !i.done } : i));
    toast.success("Status updated");
  }, []);

  const addItem = useCallback(() => {
    if (!newItem.trim()) { toast.error("Please enter a name first"); return; }
    setItems(prev => [...prev, { id: Date.now(), name: newItem.trim(), done: false }]);
    setNewItem("");
    toast.success("Item added successfully");
  }, [newItem]);

  const removeItem = useCallback((id: number) => {
    setItems(prev => prev.filter(i => i.id !== id));
    toast("Item removed");
  }, []);

  const toggleLike = useCallback((id: number) => {
    setLikes(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); toast("Removed from favorites"); }
      else { next.add(id); toast.success("Added to favorites ❤️"); }
      return next;
    });
  }, []);

  const addToCart = useCallback(() => { setCartCount(c => c + 1); toast.success("Added to cart 🛒"); }, []);
  const clearNotifs = useCallback(() => { setNotifCount(0); toast("Notifications cleared"); }, []);

  const handleCamera = useCallback(async () => {
    try {
      const input = document.createElement("input");
      input.type = "file"; input.accept = "image/*";
      input.setAttribute("capture", "environment");
      input.onchange = () => {
        const file = input.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => { setPhotoPreview(reader.result as string); setScreen("camera"); toast.success("Photo captured!"); };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } catch { toast("📷 Camera not available in this browser"); }
  }, []);

  const handleGPS = useCallback(() => {
    if ("geolocation" in navigator) {
      toast("📍 Acquiring location...");
      navigator.geolocation.getCurrentPosition(
        (pos) => toast.success(`📍 ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`),
        () => toast.error("📍 Location permission denied")
      );
    } else { toast("📍 GPS not available"); }
  }, []);

  const handleQR = useCallback(() => {
    const content = window.prompt("QR Scanner — Enter content (browser fallback):");
    if (content) toast.success(`QR Scanned: ${content}`);
    else toast("QR scan cancelled");
  }, []);

  const handleMic = useCallback(async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setIsRecording(true);
        toast("🎙️ Recording...");
        setTimeout(() => { stream.getTracks().forEach(t => t.stop()); setIsRecording(false); toast.success("🎙️ Recording saved (3s)"); }, 3000);
      } catch { toast("🎙️ Microphone not available"); }
    } else { setIsRecording(false); toast("🎙️ Stopped"); }
  }, [isRecording]);

  // ─── Admin: toggle user role ───
  const toggleUserRole = useCallback((userId: number) => {
    setManagedUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, role: u.role === "admin" ? "user" as const : "admin" as const } : u
    ));
    toast.success("Role updated");
  }, []);

  const toggleUserStatus = useCallback((userId: number) => {
    setManagedUsers(prev => prev.map(u =>
      u.id === userId ? { ...u, status: u.status === "active" ? "suspended" as const : "active" as const } : u
    ));
    toast.success("Status updated");
  }, []);

  // ─── Status Bar ───
  const StatusBar = () => (
    <div className="flex items-center justify-between px-4 py-1.5 text-[10px] text-[hsl(210,10%,55%)]">
      <span>9:41</span>
      <div className="flex items-center gap-1">
        {IS_DEV_MODE && userRole === "admin" && (
          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-[hsl(55,90%,50%)]/20 text-[hsl(55,90%,55%)]">
            🛡️ ROOT
          </span>
        )}
        <div className="w-4 h-2 rounded-sm border border-[hsl(210,10%,55%)]">
          <div className="w-3 h-1.5 rounded-[1px] bg-[hsl(90,60%,50%)] m-[0.5px]" />
        </div>
      </div>
    </div>
  );

  const AppHeader = ({ title, showBack }: { title: string; showBack?: boolean }) => (
    <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(220,20%,16%)]">
      {showBack ? (
        <button onClick={() => navigateTo("home")}><ArrowLeft className="h-5 w-5 text-[hsl(55,90%,55%)]" /></button>
      ) : (
        <button onClick={() => toast("Menu")}><Menu className="h-5 w-5 text-[hsl(210,10%,55%)]" /></button>
      )}
      <h1 className="text-sm font-bold tracking-wide">{title}</h1>
      <div className="flex items-center gap-3">
        {userRole === "admin" && (
          <button onClick={() => navigateTo("admin-users")} className="relative">
            <Shield className="h-4 w-4 text-[hsl(55,90%,55%)]" />
          </button>
        )}
        <button onClick={() => toast("Search: Coming soon")}><Search className="h-4 w-4 text-[hsl(210,10%,55%)]" /></button>
        <button onClick={clearNotifs} className="relative">
          <Bell className="h-4 w-4 text-[hsl(210,10%,55%)]" />
          {notifCount > 0 && (
            <span className="absolute -top-1 -end-1 w-3.5 h-3.5 rounded-full bg-[hsl(0,72%,55%)] text-[8px] text-white flex items-center justify-center font-bold">{notifCount}</span>
          )}
        </button>
      </div>
    </div>
  );

  const BottomNav = () => (
    <div className="flex items-center justify-around py-2.5 border-t border-[hsl(220,20%,16%)] bg-[hsl(220,20%,10%)]">
      {([
        { icon: Home, label: "Home", s: "home" as Screen },
        { icon: Heart, label: "Saved", s: "home" as Screen },
        { icon: ShoppingCart, label: "Cart", s: "cart" as Screen },
        { icon: User, label: "Profile", s: "profile" as Screen },
      ]).map(({ icon: Icon, label, s }) => (
        <button key={label} onClick={() => navigateTo(s)} className="flex flex-col items-center gap-0.5">
          <div className="relative">
            <Icon className={`h-5 w-5 ${screen === s ? "text-[hsl(55,90%,55%)]" : "text-[hsl(210,10%,40%)]"}`} />
            {label === "Cart" && cartCount > 0 && (
              <span className="absolute -top-1 -end-1 w-3.5 h-3.5 rounded-full bg-[hsl(0,72%,55%)] text-[8px] text-white flex items-center justify-center font-bold">{cartCount}</span>
            )}
          </div>
          <span className={`text-[10px] ${screen === s ? "text-[hsl(55,90%,55%)] font-medium" : "text-[hsl(210,10%,40%)]"}`}>{label}</span>
        </button>
      ))}
    </div>
  );

  // ─── Splash Screen ───
  const SplashScreen = () => (
    <div className="h-full flex flex-col items-center justify-center"
      style={{ background: "linear-gradient(180deg, hsl(220,25%,8%) 0%, hsl(220,30%,12%) 100%)" }}>
      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6, ease: "easeOut" }}>
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4 mx-auto"
          style={{ background: "linear-gradient(135deg, hsl(55,90%,50%), hsl(90,60%,45%))" }}>
          <Package className="h-10 w-10 text-[hsl(220,25%,8%)]" />
        </div>
      </motion.div>
      <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="text-lg font-bold">{appName || "My App"}</motion.p>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
        className="text-xs text-[hsl(210,10%,55%)] mt-1">Powered by Sirou Factory</motion.p>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="mt-6">
        <Loader2 className="h-5 w-5 text-[hsl(55,90%,55%)] animate-spin" />
      </motion.div>
    </div>
  );

  // ─── Login Screen ───
  const LoginScreen = () => (
    <div className="flex-1 overflow-auto p-6 flex flex-col justify-center">
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
          style={{ background: "linear-gradient(135deg, hsl(55,90%,50%), hsl(90,60%,45%))" }}>
          <LogIn className="h-7 w-7 text-[hsl(220,25%,8%)]" />
        </div>
        <p className="text-lg font-bold">Welcome Back</p>
        <p className="text-xs text-[hsl(210,10%,55%)] mt-1">Sign in to continue</p>
      </div>
      <div className="space-y-3">
        <div className="relative">
          <Mail className="absolute start-3 top-3 h-4 w-4 text-[hsl(210,10%,40%)]" />
          <input value={email} onChange={e => { setEmail(e.target.value); setLoginError(""); }}
            placeholder="Email address" type="email"
            className="w-full bg-[hsl(220,20%,12%)] border border-[hsl(220,20%,18%)] rounded-xl ps-10 pe-3 py-2.5 text-sm text-white placeholder:text-[hsl(210,10%,40%)] outline-none focus:border-[hsl(55,90%,55%)]" />
        </div>
        <div className="relative">
          <Lock className="absolute start-3 top-3 h-4 w-4 text-[hsl(210,10%,40%)]" />
          <input value={password} onChange={e => { setPassword(e.target.value); setLoginError(""); }}
            placeholder="Password" type={showPassword ? "text" : "password"}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            className="w-full bg-[hsl(220,20%,12%)] border border-[hsl(220,20%,18%)] rounded-xl ps-10 pe-10 py-2.5 text-sm text-white placeholder:text-[hsl(210,10%,40%)] outline-none focus:border-[hsl(55,90%,55%)]" />
          <button onClick={() => setShowPassword(!showPassword)} className="absolute end-3 top-3">
            {showPassword ? <EyeOff className="h-4 w-4 text-[hsl(210,10%,40%)]" /> : <Eye className="h-4 w-4 text-[hsl(210,10%,40%)]" />}
          </button>
        </div>
        {loginError && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-[hsl(0,72%,60%)] text-xs px-1">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" /><span>{loginError}</span>
          </motion.div>
        )}
        <button onClick={handleLogin} disabled={isLoggingIn}
          className="w-full py-3 rounded-xl text-sm font-bold text-[hsl(220,25%,8%)] active:scale-[0.98] transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, hsl(55,90%,50%), hsl(90,60%,45%))" }}>
          {isLoggingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isLoggingIn ? "Signing in..." : "Sign In"}
        </button>
        <button onClick={() => toast("Password reset: Feature coming soon")}
          className="w-full text-center text-xs text-[hsl(55,90%,55%)] mt-2">Forgot password?</button>
      </div>
    </div>
  );

  // ─── Home Screen ───
  const HomeScreen = () => (
    <div className="flex-1 overflow-auto p-4 space-y-4">
      {/* Admin banner */}
      {userRole === "admin" && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-2.5 rounded-xl bg-[hsl(55,90%,50%)]/10 border border-[hsl(55,90%,50%)]/20">
          <Shield className="h-4 w-4 text-[hsl(55,90%,55%)]" />
          <span className="text-[10px] font-bold text-[hsl(55,90%,55%)]">SUPER ADMIN MODE</span>
          <span className="text-[10px] text-[hsl(210,10%,55%)] ms-auto">root@sirou.app</span>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-xl p-4 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, hsl(55,90%,45%), hsl(90,60%,40%))" }}>
        <p className="text-xs font-semibold text-[hsl(220,25%,8%)] opacity-70">WELCOME BACK</p>
        <p className="text-lg font-bold text-[hsl(220,25%,8%)] mt-1">Dashboard</p>
        <p className="text-xs text-[hsl(220,25%,8%)] opacity-60 mt-1">{notifCount} new notifications</p>
      </motion.div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: BarChart3, label: "Sales", val: "1.2K" },
          { icon: User, label: "Users", val: "847" },
          { icon: Star, label: "Rating", val: "4.9" },
        ].map(({ icon: Icon, label, val }) => (
          <button key={label} onClick={() => { navigateTo("dashboard"); toast(`${label} details`); }}
            className="rounded-lg p-3 bg-[hsl(220,20%,12%)] border border-[hsl(220,20%,18%)] text-center active:scale-95 transition-transform">
            <Icon className="h-4 w-4 mx-auto text-[hsl(55,90%,55%)] mb-1" />
            <p className="text-xs text-[hsl(210,10%,55%)]">{label}</p>
            <p className="text-sm font-bold">{val}</p>
          </button>
        ))}
      </div>

      {/* Admin quick-access panel */}
      {userRole === "admin" && (
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => navigateTo("admin-users")}
            className="flex items-center gap-2 p-3 rounded-xl bg-[hsl(220,20%,12%)] border border-[hsl(55,90%,50%)]/20 active:scale-95 transition-transform">
            <Users className="h-5 w-5 text-[hsl(55,90%,55%)]" />
            <div className="text-start">
              <p className="text-xs font-bold">User Manager</p>
              <p className="text-[10px] text-[hsl(210,10%,55%)]">{managedUsers.length} accounts</p>
            </div>
          </button>
          <button onClick={() => navigateTo("admin-vault")}
            className="flex items-center gap-2 p-3 rounded-xl bg-[hsl(220,20%,12%)] border border-[hsl(55,90%,50%)]/20 active:scale-95 transition-transform">
            <KeyRound className="h-5 w-5 text-[hsl(55,90%,55%)]" />
            <div className="text-start">
              <p className="text-xs font-bold">Vault & Keys</p>
              <p className="text-[10px] text-[hsl(210,10%,55%)]">AES-256-GCM</p>
            </div>
          </button>
        </div>
      )}

      <div className="space-y-2">
        {items.map((item) => (
          <motion.div key={item.id} layout
            className="flex items-center justify-between p-3 rounded-lg bg-[hsl(220,20%,12%)] border border-[hsl(220,20%,18%)]">
            <div className="flex items-center gap-3">
              <button onClick={() => toggleItem(item.id)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${item.done ? "bg-[hsl(90,60%,45%)]" : ""}`}
                style={!item.done ? { background: "linear-gradient(135deg, hsl(55,90%,50%), hsl(90,60%,45%))" } : undefined}>
                {item.done ? <Check className="h-4 w-4 text-[hsl(220,25%,8%)]" /> : <Settings className="h-4 w-4 text-[hsl(220,25%,8%)]" />}
              </button>
              <span className={`text-sm font-medium ${item.done ? "line-through opacity-50" : ""}`}>{item.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => toggleLike(item.id)}>
                <Heart className={`h-4 w-4 transition-colors ${likes.has(item.id) ? "text-red-400 fill-red-400" : "text-[hsl(210,10%,55%)]"}`} />
              </button>
              <button onClick={() => removeItem(item.id)}>
                <Trash2 className="h-4 w-4 text-[hsl(210,10%,40%)] hover:text-red-400 transition-colors" />
              </button>
              <button onClick={() => { navigateTo("detail"); toast(`Details: ${item.name}`); }}>
                <ChevronRight className="h-4 w-4 text-[hsl(210,10%,55%)]" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex gap-2">
        <input value={newItem} onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => e.key === "Enter" && addItem()}
          placeholder="Add new item..."
          className="flex-1 bg-[hsl(220,20%,12%)] border border-[hsl(220,20%,18%)] rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-[hsl(210,10%,40%)] outline-none focus:border-[hsl(55,90%,55%)]" />
        <button onClick={addItem}
          className="px-4 rounded-xl text-sm font-bold text-[hsl(220,25%,8%)] active:scale-95 transition-transform"
          style={{ background: "linear-gradient(135deg, hsl(55,90%,50%), hsl(90,60%,45%))" }}>
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {[
          { icon: Camera, label: "Camera", handler: handleCamera },
          { icon: MapPin, label: "GPS", handler: handleGPS },
          { icon: QrCode, label: "QR Scan", handler: handleQR },
          { icon: Mic, label: isRecording ? "Stop" : "Record", handler: handleMic },
        ].map(({ icon: Icon, label, handler }) => (
          <button key={label} onClick={handler}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all active:scale-95 ${
              label === "Stop" ? "bg-red-500/20 border-red-500/30" : "bg-[hsl(220,20%,12%)] border-[hsl(220,20%,18%)]"
            }`}>
            <Icon className={`h-5 w-5 ${label === "Stop" ? "text-red-400" : "text-[hsl(55,90%,55%)]"}`} />
            <span className="text-[10px] text-[hsl(210,10%,55%)]">{label}</span>
          </button>
        ))}
      </div>

      <button onClick={addToCart}
        className="w-full py-3 rounded-xl text-sm font-bold text-[hsl(220,25%,8%)] active:scale-[0.98] transition-transform"
        style={{ background: "linear-gradient(135deg, hsl(55,90%,50%), hsl(90,60%,45%))" }}>
        Add to Cart
      </button>
    </div>
  );

  // ═══ ADMIN: User Management Screen ═══
  const AdminUsersScreen = () => (
    <div className="flex-1 overflow-auto p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold">User Accounts</p>
        <span className="text-[10px] px-2 py-1 rounded-full bg-[hsl(55,90%,50%)]/15 text-[hsl(55,90%,55%)] font-bold">
          {managedUsers.length} total
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 rounded-lg bg-[hsl(220,20%,12%)] border border-[hsl(220,20%,18%)]">
          <p className="text-lg font-bold text-[hsl(90,60%,50%)]">{managedUsers.filter(u => u.status === "active").length}</p>
          <p className="text-[10px] text-[hsl(210,10%,55%)]">Active</p>
        </div>
        <div className="p-2 rounded-lg bg-[hsl(220,20%,12%)] border border-[hsl(220,20%,18%)]">
          <p className="text-lg font-bold text-[hsl(55,90%,55%)]">{managedUsers.filter(u => u.role === "admin").length}</p>
          <p className="text-[10px] text-[hsl(210,10%,55%)]">Admins</p>
        </div>
        <div className="p-2 rounded-lg bg-[hsl(220,20%,12%)] border border-[hsl(220,20%,18%)]">
          <p className="text-lg font-bold text-[hsl(0,72%,60%)]">{managedUsers.filter(u => u.status === "suspended").length}</p>
          <p className="text-[10px] text-[hsl(210,10%,55%)]">Suspended</p>
        </div>
      </div>

      {managedUsers.map(u => (
        <motion.div key={u.id} layout
          className={`p-3 rounded-xl border ${u.status === "suspended" ? "bg-[hsl(0,20%,12%)] border-[hsl(0,30%,20%)] opacity-60" : "bg-[hsl(220,20%,12%)] border-[hsl(220,20%,18%)]"}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${
                u.role === "admin" ? "bg-[hsl(55,90%,50%)]/20 text-[hsl(55,90%,55%)]" : "bg-[hsl(210,50%,50%)]/20 text-[hsl(210,60%,65%)]"
              }`}>
                {u.name.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-bold">{u.name}</p>
                <p className="text-[10px] text-[hsl(210,10%,55%)]">{u.email}</p>
              </div>
            </div>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
              u.role === "admin" ? "bg-[hsl(55,90%,50%)]/15 text-[hsl(55,90%,55%)]" : "bg-[hsl(210,50%,50%)]/15 text-[hsl(210,60%,65%)]"
            }`}>
              {u.role.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[hsl(210,10%,45%)]">Last: {u.lastLogin}</span>
            {u.id !== 1 && (
              <div className="flex gap-1.5">
                <button onClick={() => toggleUserRole(u.id)}
                  className="text-[10px] px-2 py-1 rounded-lg bg-[hsl(220,20%,16%)] text-[hsl(55,90%,55%)] active:scale-95 transition-transform">
                  {u.role === "admin" ? "Demote" : "Promote"}
                </button>
                <button onClick={() => toggleUserStatus(u.id)}
                  className={`text-[10px] px-2 py-1 rounded-lg active:scale-95 transition-transform ${
                    u.status === "active" ? "bg-[hsl(0,50%,15%)] text-[hsl(0,72%,60%)]" : "bg-[hsl(90,30%,15%)] text-[hsl(90,60%,50%)]"
                  }`}>
                  {u.status === "active" ? <Ban className="h-3 w-3 inline" /> : <CheckCircle2 className="h-3 w-3 inline" />}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );

  // ═══ ADMIN: Vault & Encryption Dashboard ═══
  const AdminVaultScreen = () => (
    <div className="flex-1 overflow-auto p-4 space-y-3">
      <p className="text-sm font-bold">Encrypted Vault</p>

      <div className="p-4 rounded-xl bg-[hsl(220,20%,12%)] border border-[hsl(55,90%,50%)]/20">
        <div className="flex items-center gap-2 mb-3">
          <KeyRound className="h-5 w-5 text-[hsl(55,90%,55%)]" />
          <span className="text-xs font-bold">Encryption Status</span>
        </div>
        {[
          { label: "Algorithm", value: "AES-256-GCM", ok: true },
          { label: "Key Derivation", value: "PBKDF2 · 100K iter", ok: true },
          { label: "Vault State", value: "Initialized", ok: true },
          { label: "Events Encrypted", value: "All payloads", ok: true },
        ].map(({ label, value, ok }) => (
          <div key={label} className="flex items-center justify-between py-1.5 border-b border-[hsl(220,20%,18%)] last:border-0">
            <span className="text-[11px] text-[hsl(210,10%,55%)]">{label}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-mono font-bold">{value}</span>
              {ok && <CheckCircle2 className="h-3 w-3 text-[hsl(90,60%,50%)]" />}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-xl bg-[hsl(220,20%,12%)] border border-[hsl(220,20%,18%)]">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="h-5 w-5 text-[hsl(210,60%,65%)]" />
          <span className="text-xs font-bold">Hardware Bridge</span>
        </div>
        {[
          { label: "Camera API", status: "Ready" },
          { label: "GPS / Location", status: "Ready" },
          { label: "QR Scanner", status: "Ready" },
          { label: "Microphone", status: "Ready" },
          { label: "Biometric Auth", status: "Standby" },
        ].map(({ label, status }) => (
          <div key={label} className="flex items-center justify-between py-1.5 border-b border-[hsl(220,20%,18%)] last:border-0">
            <span className="text-[11px] text-[hsl(210,10%,55%)]">{label}</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              status === "Ready" ? "bg-[hsl(90,60%,50%)]/15 text-[hsl(90,60%,50%)]" : "bg-[hsl(55,90%,50%)]/15 text-[hsl(55,90%,55%)]"
            }`}>{status}</span>
          </div>
        ))}
      </div>

      <button onClick={() => { toast.success("🔐 Vault test: Encrypt → Decrypt cycle passed"); }}
        className="w-full py-3 rounded-xl text-sm font-bold text-[hsl(220,25%,8%)] active:scale-[0.98] transition-transform"
        style={{ background: "linear-gradient(135deg, hsl(55,90%,50%), hsl(90,60%,45%))" }}>
        Test Vault Encryption
      </button>
    </div>
  );

  const ProfileScreen = () => (
    <div className="flex-1 overflow-auto p-4 space-y-4">
      <div className="flex flex-col items-center py-6">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-3" style={{ background: grad }}>
          <User className="h-10 w-10" style={{ color: theme.accentText }} />
        </div>
        <p className="font-bold text-lg">{userRole === "admin" ? "Root Admin" : "User Profile"}</p>
        <p className="text-xs" style={{ color: theme.textMuted }}>{email || "user@sirou.app"}</p>
        <span className={`mt-2 text-[10px] font-bold px-3 py-1 rounded-full ${
          userRole === "admin" ? "bg-[hsl(55,90%,50%)]/20 text-[hsl(55,90%,55%)]" : "bg-[hsl(210,50%,50%)]/20 text-[hsl(210,60%,65%)]"
        }`}>
          {userRole === "admin" ? "🛡️ SUPER ADMIN" : "👤 USER"}
        </span>
      </div>

      <div className="flex gap-2">
        <button onClick={() => { setUserRole("user"); toast("Switched to User role"); }}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${userRole === "user" ? "text-white" : "border border-[hsl(220,20%,18%)]"}`}
          style={userRole === "user" ? { background: grad, color: theme.accentText } : undefined}>
          👤 User
        </button>
        <button onClick={() => { setUserRole("admin"); toast("Switched to Admin role"); }}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${userRole === "admin" ? "text-white" : "border border-[hsl(220,20%,18%)]"}`}
          style={userRole === "admin" ? { background: grad, color: theme.accentText } : undefined}>
          🛡️ Admin
        </button>
      </div>

      {["Edit Profile", "Preferences", "Security"].map(item => (
        <button key={item} onClick={() => toast(`${item}: Coming soon`)}
          className="w-full flex items-center justify-between p-3 rounded-lg active:scale-[0.98] transition-transform"
          style={{ background: theme.surface, borderColor: theme.surfaceBorder, borderWidth: 1, borderStyle: "solid" }}>
          <span className="text-sm font-medium">{item}</span>
          <ChevronRight className="h-4 w-4" style={{ color: theme.textMuted }} />
        </button>
      ))}

      {userRole === "admin" ? (
        <div className="space-y-2">
          <p className="text-xs font-bold" style={{ color: theme.accent }}>🔐 Admin Panel</p>
          {[
            { label: "User Management", screen: "admin-users" as Screen },
            { label: "Vault & Encryption", screen: "admin-vault" as Screen },
            { label: "Sovereign Core", screen: "dashboard" as Screen },
            { label: "Audit Logs", screen: "dashboard" as Screen },
          ].map(item => (
            <button key={item.label} onClick={() => { navigateTo(item.screen); toast(`${item.label}: Access granted`); }}
              className="w-full flex items-center justify-between p-3 rounded-lg active:scale-[0.98] transition-transform"
              style={{ background: theme.surface, borderColor: theme.accent + "33", borderWidth: 1, borderStyle: "solid" }}>
              <span className="text-sm font-medium">{item.label}</span>
              <ChevronRight className="h-4 w-4" style={{ color: theme.accent }} />
            </button>
          ))}
        </div>
      ) : (
        <button onClick={() => toast.error("🔒 Access denied — Admin privileges required")}
          className="w-full flex items-center justify-between p-3 rounded-lg opacity-50 active:scale-[0.98] transition-transform"
          style={{ background: theme.surface, borderColor: theme.surfaceBorder, borderWidth: 1, borderStyle: "solid" }}>
          <span className="text-sm font-medium">🔒 Admin Panel</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">Restricted</span>
        </button>
      )}

      <button onClick={() => { setScreen("login"); setEmail(""); setPassword(""); setUserRole("user"); toast("Logged out"); }}
        className="w-full py-3 rounded-xl text-sm font-bold border border-[hsl(0,72%,55%)]/30 text-[hsl(0,72%,60%)] active:scale-[0.98] transition-transform">
        Sign Out
      </button>
    </div>
  );

  const CartScreen = () => (
    <div className="flex-1 overflow-auto p-4 space-y-4">
      <p className="text-lg font-bold">Shopping Cart</p>
      {cartCount === 0 ? (
        <div className="text-center py-10">
          <ShoppingCart className="h-12 w-12 mx-auto text-[hsl(210,10%,30%)] mb-3" />
          <p className="text-sm text-[hsl(210,10%,55%)]">Cart is empty</p>
          <button onClick={() => navigateTo("home")}
            className="mt-4 px-6 py-2 rounded-xl text-sm font-bold text-[hsl(220,25%,8%)]"
            style={{ background: "linear-gradient(135deg, hsl(55,90%,50%), hsl(90,60%,45%))" }}>Browse Items</button>
        </div>
      ) : (
        <>
          <div className="p-3 rounded-lg bg-[hsl(220,20%,12%)] border border-[hsl(220,20%,18%)]">
            <div className="flex justify-between"><span className="text-sm">Items</span><span className="text-sm font-bold">{cartCount}</span></div>
            <div className="flex justify-between mt-2"><span className="text-sm">Total</span><span className="text-sm font-bold text-[hsl(55,90%,55%)]">${(cartCount * 29.99).toFixed(2)}</span></div>
          </div>
          <button onClick={() => { setCartCount(0); toast.success("Order placed! 🎉"); }}
            className="w-full py-3 rounded-xl text-sm font-bold text-[hsl(220,25%,8%)] active:scale-[0.98] transition-transform"
            style={{ background: "linear-gradient(135deg, hsl(55,90%,50%), hsl(90,60%,45%))" }}>Checkout</button>
        </>
      )}
    </div>
  );

  const CameraScreen = () => (
    <div className="flex-1 overflow-auto p-4 space-y-4">
      {photoPreview ? (
        <>
          <img src={photoPreview} alt="Captured" className="w-full rounded-xl" />
          <div className="flex gap-2">
            <button onClick={() => { setPhotoPreview(null); navigateTo("home"); toast.success("Photo saved"); }}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-[hsl(220,25%,8%)]"
              style={{ background: "linear-gradient(135deg, hsl(55,90%,50%), hsl(90,60%,45%))" }}>Save</button>
            <button onClick={() => { setPhotoPreview(null); navigateTo("home"); }}
              className="flex-1 py-3 rounded-xl text-sm font-bold border border-[hsl(220,20%,18%)] text-[hsl(210,10%,55%)]">Discard</button>
          </div>
        </>
      ) : (
        <div className="text-center py-10">
          <Camera className="h-12 w-12 mx-auto text-[hsl(210,10%,30%)] mb-3" />
          <p className="text-sm text-[hsl(210,10%,55%)]">No photo captured</p>
        </div>
      )}
    </div>
  );

  const SettingsScreen = () => (
    <div className="flex-1 overflow-auto p-4 space-y-4">
      <p className="text-lg font-bold">Settings</p>
      {["Notifications", "Privacy", "Theme", "Language", "About App"].map(item => (
        <button key={item} onClick={() => toast(`${item}: Coming soon`)}
          className="w-full flex items-center justify-between p-3 rounded-lg bg-[hsl(220,20%,12%)] border border-[hsl(220,20%,18%)] active:scale-[0.98] transition-transform">
          <span className="text-sm font-medium">{item}</span>
          <ChevronRight className="h-4 w-4 text-[hsl(210,10%,55%)]" />
        </button>
      ))}
    </div>
  );

  const screenTitle: Record<Screen, string> = {
    splash: appName || "App",
    login: "Welcome",
    home: appName || "App",
    dashboard: "Dashboard",
    profile: "Profile",
    cart: "Cart",
    detail: "Details",
    camera: "Camera",
    settings: "Settings",
    "admin-users": "👥 User Manager",
    "admin-vault": "🔐 Vault",
  };

  const showNav = !["splash", "login"].includes(screen);
  const showHeader = !["splash", "login"].includes(screen);

  return (
    <div className="h-[500px] flex flex-col bg-[hsl(220,25%,8%)] text-[hsl(210,15%,92%)] overflow-hidden">
      {screen !== "splash" && <StatusBar />}
      {showHeader && <AppHeader title={screenTitle[screen]} showBack={!["home"].includes(screen)} />}
      <AnimatePresence mode="wait">
        <motion.div key={screen} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }} className="flex-1 flex flex-col overflow-hidden">
          {screen === "splash" && <SplashScreen />}
          {screen === "login" && <LoginScreen />}
          {screen === "home" && <HomeScreen />}
          {screen === "profile" && <ProfileScreen />}
          {screen === "cart" && <CartScreen />}
          {screen === "camera" && <CameraScreen />}
          {screen === "settings" && <SettingsScreen />}
          {screen === "admin-users" && <AdminUsersScreen />}
          {screen === "admin-vault" && <AdminVaultScreen />}
          {(screen === "dashboard" || screen === "detail") && <HomeScreen />}
        </motion.div>
      </AnimatePresence>
      {showNav && <BottomNav />}
    </div>
  );
};

export default GeneratedPrototype;
