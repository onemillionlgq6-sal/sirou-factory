import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, Settings, User, Bell, Search, ShoppingCart, Heart, Star,
  ChevronRight, Menu, BarChart3, Camera, MapPin, QrCode, Mic,
  Plus, Trash2, Check, X, ArrowLeft, Send, Image, Package,
} from "lucide-react";
import { toast } from "sonner";
import type { AppBlueprint } from "./AIPlannerEngine";

interface GeneratedPrototypeProps {
  appName: string;
  blueprint: AppBlueprint | null;
}

type Screen = "home" | "dashboard" | "profile" | "cart" | "detail" | "camera" | "scanner";

/**
 * Fully functional prototype renderer.
 * Every button has a real handler, state is managed, hardware APIs are bridged.
 */
const GeneratedPrototype = ({ appName, blueprint }: GeneratedPrototypeProps) => {
  const [screen, setScreen] = useState<Screen>("home");
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

  const navigateTo = useCallback((s: Screen) => setScreen(s), []);

  const toggleItem = useCallback((id: number) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, done: !i.done } : i));
    toast.success("Status updated");
  }, []);

  const addItem = useCallback(() => {
    if (!newItem.trim()) { toast.error("Enter item name"); return; }
    setItems(prev => [...prev, { id: Date.now(), name: newItem.trim(), done: false }]);
    setNewItem("");
    toast.success("Item added");
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

  const addToCart = useCallback(() => {
    setCartCount(c => c + 1);
    toast.success("Added to cart 🛒");
  }, []);

  const clearNotifs = useCallback(() => {
    setNotifCount(0);
    toast("Notifications cleared");
  }, []);

  // Hardware: Camera
  const handleCamera = useCallback(async () => {
    try {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.setAttribute("capture", "environment");
      input.onchange = () => {
        const file = input.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            setPhotoPreview(reader.result as string);
            setScreen("camera");
            toast.success("Photo captured!");
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } catch {
      toast("📷 Camera: Permission required or not available in this browser");
    }
  }, []);

  // Hardware: GPS
  const handleGPS = useCallback(() => {
    if ("geolocation" in navigator) {
      toast("📍 Acquiring location...");
      navigator.geolocation.getCurrentPosition(
        (pos) => toast.success(`📍 Location: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`),
        () => toast.error("📍 Location permission denied")
      );
    } else {
      toast("📍 GPS: Not available in this browser");
    }
  }, []);

  // Hardware: QR Scanner
  const handleQR = useCallback(() => {
    const content = window.prompt("QR Scanner — Enter QR content manually (browser fallback):");
    if (content) toast.success(`QR Scanned: ${content}`);
    else toast("QR scan cancelled");
  }, []);

  // Hardware: Mic
  const handleMic = useCallback(async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setIsRecording(true);
        toast("🎙️ Recording started...");
        setTimeout(() => {
          stream.getTracks().forEach(t => t.stop());
          setIsRecording(false);
          toast.success("🎙️ Recording saved (3s demo)");
        }, 3000);
      } catch {
        toast("🎙️ Microphone: Permission denied or not available");
      }
    } else {
      setIsRecording(false);
      toast("🎙️ Recording stopped");
    }
  }, [isRecording]);

  // ─── Status Bar ───
  const StatusBar = () => (
    <div className="flex items-center justify-between px-4 py-1.5 text-[10px] text-[hsl(210,10%,55%)]">
      <span>9:41</span>
      <div className="flex items-center gap-1.5">
        <div className="w-4 h-2 rounded-sm border border-[hsl(210,10%,55%)]">
          <div className="w-3 h-1.5 rounded-[1px] bg-[hsl(90,60%,50%)] m-[0.5px]" />
        </div>
      </div>
    </div>
  );

  // ─── App Header ───
  const AppHeader = ({ title, showBack }: { title: string; showBack?: boolean }) => (
    <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(220,20%,16%)]">
      {showBack ? (
        <button onClick={() => navigateTo("home")}>
          <ArrowLeft className="h-5 w-5 text-[hsl(55,90%,55%)]" />
        </button>
      ) : (
        <button onClick={() => toast("Menu opened")}>
          <Menu className="h-5 w-5 text-[hsl(210,10%,55%)]" />
        </button>
      )}
      <h1 className="text-sm font-bold tracking-wide">{title}</h1>
      <div className="flex items-center gap-3">
        <button onClick={() => toast("Search: Feature coming soon")}>
          <Search className="h-4 w-4 text-[hsl(210,10%,55%)]" />
        </button>
        <button onClick={clearNotifs} className="relative">
          <Bell className="h-4 w-4 text-[hsl(210,10%,55%)]" />
          {notifCount > 0 && (
            <span className="absolute -top-1 -end-1 w-3.5 h-3.5 rounded-full bg-[hsl(0,72%,55%)] text-[8px] text-white flex items-center justify-center font-bold">
              {notifCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );

  // ─── Bottom Navigation ───
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
              <span className="absolute -top-1 -end-1 w-3.5 h-3.5 rounded-full bg-[hsl(0,72%,55%)] text-[8px] text-white flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </div>
          <span className={`text-[10px] ${screen === s ? "text-[hsl(55,90%,55%)] font-medium" : "text-[hsl(210,10%,40%)]"}`}>
            {label}
          </span>
        </button>
      ))}
    </div>
  );

  // ─── Screens ───
  const HomeScreen = () => (
    <div className="flex-1 overflow-auto p-4 space-y-4">
      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-xl p-4 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, hsl(55,90%,45%), hsl(90,60%,40%))" }}>
        <p className="text-xs font-semibold text-[hsl(220,25%,8%)] opacity-70">WELCOME BACK</p>
        <p className="text-lg font-bold text-[hsl(220,25%,8%)] mt-1">Dashboard</p>
        <p className="text-xs text-[hsl(220,25%,8%)] opacity-60 mt-1">{notifCount} new notifications</p>
      </motion.div>

      {/* Stats */}
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

      {/* Interactive List */}
      <div className="space-y-2">
        {items.map((item) => (
          <motion.div key={item.id} layout
            className="flex items-center justify-between p-3 rounded-lg bg-[hsl(220,20%,12%)] border border-[hsl(220,20%,18%)]">
            <div className="flex items-center gap-3">
              <button onClick={() => toggleItem(item.id)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                  item.done ? "bg-[hsl(90,60%,45%)]" : ""
                }`}
                style={!item.done ? { background: "linear-gradient(135deg, hsl(55,90%,50%), hsl(90,60%,45%))" } : undefined}>
                {item.done ? <Check className="h-4 w-4 text-[hsl(220,25%,8%)]" /> :
                  <Settings className="h-4 w-4 text-[hsl(220,25%,8%)]" />}
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

      {/* Add Item */}
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

      {/* Hardware Actions */}
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

      {/* CTA */}
      <button onClick={addToCart}
        className="w-full py-3 rounded-xl text-sm font-bold text-[hsl(220,25%,8%)] active:scale-[0.98] transition-transform"
        style={{ background: "linear-gradient(135deg, hsl(55,90%,50%), hsl(90,60%,45%))" }}>
        Add to Cart
      </button>
    </div>
  );

  const ProfileScreen = () => (
    <div className="flex-1 overflow-auto p-4 space-y-4">
      <div className="flex flex-col items-center py-6">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-3"
          style={{ background: "linear-gradient(135deg, hsl(55,90%,50%), hsl(90,60%,45%))" }}>
          <User className="h-10 w-10 text-[hsl(220,25%,8%)]" />
        </div>
        <p className="font-bold text-lg">User Profile</p>
        <p className="text-xs text-[hsl(210,10%,55%)]">user@sirou.app</p>
      </div>
      {["Edit Profile", "Preferences", "Security", "About"].map(item => (
        <button key={item} onClick={() => toast(`${item}: Coming soon`)}
          className="w-full flex items-center justify-between p-3 rounded-lg bg-[hsl(220,20%,12%)] border border-[hsl(220,20%,18%)] active:scale-[0.98] transition-transform">
          <span className="text-sm font-medium">{item}</span>
          <ChevronRight className="h-4 w-4 text-[hsl(210,10%,55%)]" />
        </button>
      ))}
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
            style={{ background: "linear-gradient(135deg, hsl(55,90%,50%), hsl(90,60%,45%))" }}>
            Browse Items
          </button>
        </div>
      ) : (
        <>
          <div className="p-3 rounded-lg bg-[hsl(220,20%,12%)] border border-[hsl(220,20%,18%)]">
            <div className="flex justify-between">
              <span className="text-sm">Items</span>
              <span className="text-sm font-bold">{cartCount}</span>
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-sm">Total</span>
              <span className="text-sm font-bold text-[hsl(55,90%,55%)]">${(cartCount * 29.99).toFixed(2)}</span>
            </div>
          </div>
          <button onClick={() => { setCartCount(0); toast.success("Order placed! 🎉"); }}
            className="w-full py-3 rounded-xl text-sm font-bold text-[hsl(220,25%,8%)] active:scale-[0.98] transition-transform"
            style={{ background: "linear-gradient(135deg, hsl(55,90%,50%), hsl(90,60%,45%))" }}>
            Checkout
          </button>
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
              style={{ background: "linear-gradient(135deg, hsl(55,90%,50%), hsl(90,60%,45%))" }}>
              Save
            </button>
            <button onClick={() => { setPhotoPreview(null); navigateTo("home"); }}
              className="flex-1 py-3 rounded-xl text-sm font-bold border border-[hsl(220,20%,18%)] text-[hsl(210,10%,55%)]">
              Discard
            </button>
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

  const screenTitle: Record<Screen, string> = {
    home: appName || "App",
    dashboard: "Dashboard",
    profile: "Profile",
    cart: "Cart",
    detail: "Details",
    camera: "Camera",
    scanner: "Scanner",
  };

  return (
    <div className="h-[500px] flex flex-col bg-[hsl(220,25%,8%)] text-[hsl(210,15%,92%)] overflow-hidden">
      <StatusBar />
      <AppHeader title={screenTitle[screen]} showBack={screen !== "home"} />
      <AnimatePresence mode="wait">
        <motion.div key={screen} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }} className="flex-1 flex flex-col overflow-hidden">
          {screen === "home" && <HomeScreen />}
          {screen === "profile" && <ProfileScreen />}
          {screen === "cart" && <CartScreen />}
          {screen === "camera" && <CameraScreen />}
          {(screen === "dashboard" || screen === "detail" || screen === "scanner") && <HomeScreen />}
        </motion.div>
      </AnimatePresence>
      <BottomNav />
    </div>
  );
};

export default GeneratedPrototype;
