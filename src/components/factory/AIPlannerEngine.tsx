import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Loader2, CheckCircle2, Shield, Sparkles, ArrowDown, Camera, MapPin, QrCode, Mic, Bell, Bluetooth } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { detectThemeFromDescription, type AppTheme } from "@/lib/design-theme-engine";

export interface BlueprintEntity {
  name: string;
  fields: string[];
}

export interface BlueprintPage {
  name: string;
  route: string;
  components: string[];
}

export interface BlueprintFeature {
  name: string;
  category: "core" | "plugin" | "external";
  approved: boolean;
  risk: "safe" | "caution" | "danger";
}

export interface AppBlueprint {
  appName: string;
  description: string;
  entities: BlueprintEntity[];
  pages: BlueprintPage[];
  features: BlueprintFeature[];
  plugins: string[];
  hardwareNeeds?: string[];
  suggestions?: string[];
}

// ─── Keyword-based app type detection ───
const APP_PROFILES: Record<string, {
  keywords: string[];
  entities: BlueprintEntity[];
  pages: BlueprintPage[];
  features: BlueprintFeature[];
  hardware: string[];
  suggestions: string[];
}> = {
  delivery: {
    keywords: ["delivery", "توصيل", "deliver", "courier", "shipping", "شحن"],
    entities: [
      { name: "users", fields: ["id", "name", "email", "phone", "address", "role", "avatar_url", "created_at"] },
      { name: "orders", fields: ["id", "customer_id", "driver_id", "status", "pickup_address", "delivery_address", "total", "created_at"] },
      { name: "products", fields: ["id", "name", "price", "category", "image_url", "available", "restaurant_id"] },
      { name: "reviews", fields: ["id", "order_id", "user_id", "rating", "comment", "created_at"] },
    ],
    pages: [
      { name: "Home", route: "/", components: ["Hero", "FeaturedRestaurants", "CategoryFilter"] },
      { name: "Menu", route: "/menu", components: ["ProductGrid", "Cart", "SearchBar"] },
      { name: "Checkout", route: "/checkout", components: ["AddressForm", "PaymentMethod", "OrderSummary"] },
      { name: "Tracking", route: "/tracking", components: ["LiveMap", "OrderStatus", "DriverInfo"] },
      { name: "Profile", route: "/profile", components: ["UserInfo", "OrderHistory", "Settings"] },
    ],
    features: [
      { name: "User Login & Signup", category: "core", approved: true, risk: "safe" },
      { name: "Product Catalog", category: "core", approved: true, risk: "safe" },
      { name: "Shopping Cart", category: "core", approved: true, risk: "safe" },
      { name: "Order Tracking", category: "core", approved: true, risk: "safe" },
      { name: "Privacy Vault", category: "core", approved: true, risk: "safe" },
      { name: "Live Location", category: "plugin", approved: true, risk: "caution" },
      { name: "Push Alerts", category: "plugin", approved: true, risk: "caution" },
      { name: "Payment Gateway", category: "external", approved: false, risk: "danger" },
    ],
    hardware: ["GPS", "Notifications"],
    suggestions: [
      "📊 Add a Sales Dashboard to track orders and revenue in real-time",
      "💬 Add a Live Chat between customer and driver for better communication",
      "⭐ Add a Rating & Review system so customers can rate their experience",
    ],
  },
  ecommerce: {
    keywords: ["shop", "store", "ecommerce", "متجر", "product", "sell", "بيع", "market"],
    entities: [
      { name: "users", fields: ["id", "name", "email", "phone", "address", "avatar_url", "created_at"] },
      { name: "products", fields: ["id", "name", "description", "price", "category", "image_url", "stock", "rating"] },
      { name: "orders", fields: ["id", "user_id", "items", "total", "status", "shipping_address", "created_at"] },
      { name: "categories", fields: ["id", "name", "icon", "parent_id"] },
      { name: "wishlist", fields: ["id", "user_id", "product_id", "created_at"] },
    ],
    pages: [
      { name: "Home", route: "/", components: ["Hero", "FeaturedProducts", "Categories", "Promotions"] },
      { name: "Products", route: "/products", components: ["FilterBar", "ProductGrid", "Pagination"] },
      { name: "Product Detail", route: "/product/:id", components: ["ImageGallery", "Details", "Reviews", "Related"] },
      { name: "Cart", route: "/cart", components: ["CartItems", "PriceSummary", "PromoCode"] },
      { name: "Checkout", route: "/checkout", components: ["ShippingForm", "PaymentForm", "Confirmation"] },
      { name: "Profile", route: "/profile", components: ["OrderHistory", "Wishlist", "Settings"] },
    ],
    features: [
      { name: "User Accounts", category: "core", approved: true, risk: "safe" },
      { name: "Product Catalog", category: "core", approved: true, risk: "safe" },
      { name: "Search & Filters", category: "core", approved: true, risk: "safe" },
      { name: "Shopping Cart", category: "core", approved: true, risk: "safe" },
      { name: "Wishlist", category: "core", approved: true, risk: "safe" },
      { name: "Privacy Vault", category: "core", approved: true, risk: "safe" },
      { name: "Image Scanner", category: "plugin", approved: true, risk: "caution" },
      { name: "Push Alerts", category: "plugin", approved: true, risk: "caution" },
      { name: "Payment Gateway", category: "external", approved: false, risk: "danger" },
    ],
    hardware: ["Camera", "Notifications"],
    suggestions: [
      "📈 Add an Analytics Dashboard to monitor sales and traffic",
      "🤖 Add an AI Chatbot to help customers find products faster",
      "🎁 Add a Loyalty Points system to reward repeat customers",
    ],
  },
  social: {
    keywords: ["social", "chat", "message", "دردشة", "community", "مجتمع", "forum", "feed", "post"],
    entities: [
      { name: "users", fields: ["id", "username", "display_name", "bio", "avatar_url", "followers_count", "created_at"] },
      { name: "posts", fields: ["id", "author_id", "content", "media_url", "likes_count", "comments_count", "created_at"] },
      { name: "comments", fields: ["id", "post_id", "author_id", "content", "created_at"] },
      { name: "messages", fields: ["id", "sender_id", "receiver_id", "content", "read", "created_at"] },
      { name: "follows", fields: ["id", "follower_id", "following_id", "created_at"] },
    ],
    pages: [
      { name: "Feed", route: "/", components: ["PostList", "CreatePost", "Stories"] },
      { name: "Profile", route: "/profile", components: ["UserHeader", "PostGrid", "Stats"] },
      { name: "Messages", route: "/messages", components: ["ConversationList", "ChatWindow"] },
      { name: "Explore", route: "/explore", components: ["TrendingPosts", "SuggestedUsers", "SearchBar"] },
      { name: "Settings", route: "/settings", components: ["AccountSettings", "PrivacySettings", "NotificationSettings"] },
    ],
    features: [
      { name: "User Profiles", category: "core", approved: true, risk: "safe" },
      { name: "News Feed", category: "core", approved: true, risk: "safe" },
      { name: "Direct Messaging", category: "core", approved: true, risk: "safe" },
      { name: "Privacy Vault", category: "core", approved: true, risk: "safe" },
      { name: "Photo Sharing", category: "plugin", approved: true, risk: "caution" },
      { name: "Push Alerts", category: "plugin", approved: true, risk: "caution" },
      { name: "Location Sharing", category: "plugin", approved: false, risk: "caution" },
    ],
    hardware: ["Camera", "Notifications", "GPS"],
    suggestions: [
      "🔒 Add End-to-End Privacy for direct messages",
      "📹 Add Video Stories that disappear after 24 hours",
      "🎯 Add Smart Recommendations to suggest content users will love",
    ],
  },
  task: {
    keywords: ["task", "todo", "project", "مهام", "board", "kanban", "productivity", "إنتاجية"],
    entities: [
      { name: "users", fields: ["id", "name", "email", "avatar_url", "role", "created_at"] },
      { name: "projects", fields: ["id", "name", "description", "owner_id", "status", "created_at"] },
      { name: "tasks", fields: ["id", "title", "description", "project_id", "assignee_id", "status", "priority", "due_date", "created_at"] },
      { name: "comments", fields: ["id", "task_id", "author_id", "content", "created_at"] },
    ],
    pages: [
      { name: "Dashboard", route: "/", components: ["TaskSummary", "RecentActivity", "ProjectList"] },
      { name: "Board", route: "/board", components: ["KanbanBoard", "TaskCards", "FilterBar"] },
      { name: "Task Detail", route: "/task/:id", components: ["TaskInfo", "Comments", "Attachments"] },
      { name: "Calendar", route: "/calendar", components: ["CalendarView", "EventList"] },
      { name: "Settings", route: "/settings", components: ["TeamMembers", "Preferences"] },
    ],
    features: [
      { name: "Team Accounts", category: "core", approved: true, risk: "safe" },
      { name: "Task Management", category: "core", approved: true, risk: "safe" },
      { name: "Drag & Drop Board", category: "core", approved: true, risk: "safe" },
      { name: "Privacy Vault", category: "core", approved: true, risk: "safe" },
      { name: "File Attachments", category: "plugin", approved: true, risk: "caution" },
      { name: "Push Alerts", category: "plugin", approved: true, risk: "caution" },
    ],
    hardware: ["Camera", "Notifications"],
    suggestions: [
      "📅 Add Calendar Sync so tasks appear in Google Calendar",
      "📊 Add a Productivity Analytics dashboard with charts",
      "🤖 Add AI Task Suggestions to auto-prioritize your work",
    ],
  },
};

// Fallback for unrecognized prompts
const FALLBACK_PROFILE = {
  entities: [
    { name: "users", fields: ["id", "name", "email", "avatar_url", "created_at"] },
    { name: "items", fields: ["id", "title", "description", "category", "user_id", "status", "created_at"] },
    { name: "settings", fields: ["id", "user_id", "theme", "language", "notifications_enabled"] },
  ],
  pages: [
    { name: "Home", route: "/", components: ["Hero", "FeatureGrid", "QuickActions"] },
    { name: "Dashboard", route: "/dashboard", components: ["StatsCards", "DataTable", "Charts"] },
    { name: "Profile", route: "/profile", components: ["UserInfo", "Preferences", "ActivityLog"] },
    { name: "Settings", route: "/settings", components: ["AppSettings", "SecuritySettings"] },
  ],
  features: [
    { name: "User Login & Signup", category: "core" as const, approved: true, risk: "safe" as const },
    { name: "Data Management", category: "core" as const, approved: true, risk: "safe" as const },
    { name: "Search & Filters", category: "core" as const, approved: true, risk: "safe" as const },
    { name: "Privacy Vault", category: "core" as const, approved: true, risk: "safe" as const },
    { name: "File Storage", category: "plugin" as const, approved: false, risk: "caution" as const },
    { name: "Push Alerts", category: "plugin" as const, approved: false, risk: "caution" as const },
  ],
  hardware: ["Notifications"],
  suggestions: [
    "📊 Add an Analytics Dashboard to visualize your data",
    "🔔 Add Smart Notifications to keep users engaged",
    "🌍 Add Multi-Language support for a global audience",
  ],
};

function detectAppProfile(idea: string) {
  const lower = idea.toLowerCase();
  for (const [, profile] of Object.entries(APP_PROFILES)) {
    if (profile.keywords.some(kw => lower.includes(kw))) return profile;
  }
  return null;
}

function detectHardware(idea: string): string[] {
  const lower = idea.toLowerCase();
  const hw: string[] = [];
  if (["camera", "photo", "scan", "كاميرا", "صورة", "تصوير"].some(k => lower.includes(k))) hw.push("Camera");
  if (["gps", "location", "map", "track", "موقع", "خريطة", "تتبع"].some(k => lower.includes(k))) hw.push("GPS");
  if (["qr", "barcode", "باركود"].some(k => lower.includes(k))) hw.push("QR Scanner");
  if (["notification", "alert", "إشعار", "تنبيه"].some(k => lower.includes(k))) hw.push("Notifications");
  if (["bluetooth", "بلوتوث", "ble"].some(k => lower.includes(k))) hw.push("Bluetooth");
  if (["audio", "record", "mic", "voice", "صوت", "تسجيل"].some(k => lower.includes(k))) hw.push("Microphone");
  return hw;
}

interface AIPlannerEngineProps {
  idea: string;
  onBlueprintReady: (blueprint: AppBlueprint) => void;
  isPlanning: boolean;
  setIsPlanning: (v: boolean) => void;
}

const AIPlannerEngine = ({ idea, onBlueprintReady, isPlanning, setIsPlanning }: AIPlannerEngineProps) => {
  const { t } = useI18n();
  const [currentStep, setCurrentStep] = useState(0);

  const steps = useMemo(() => [
    "🔍 Understanding your idea...",
    "📐 Designing screens & navigation...",
    "🗄️ Building data structure...",
    "🔒 Adding privacy & security...",
    "🎨 Applying premium design...",
    "📱 Connecting device features...",
    "✅ Finalizing your app blueprint...",
  ], []);

  const runPlanner = useCallback(async () => {
    setIsPlanning(true);
    setCurrentStep(0);

    const appName = idea.split(" ").slice(0, 4).join(" ");

    for (let i = 0; i < steps.length; i++) {
      await new Promise((r) => setTimeout(r, 500 + Math.random() * 300));
      setCurrentStep(i + 1);
    }

    // Smart detection
    const profile = detectAppProfile(idea);
    const detectedHW = detectHardware(idea);

    const base = profile || FALLBACK_PROFILE;
    const mergedHW = Array.from(new Set([...(base.hardware || []), ...detectedHW]));

    // Auto-add hardware features
    const hwFeatures: BlueprintFeature[] = [];
    if (mergedHW.includes("Camera")) hwFeatures.push({ name: "Camera & Photos", category: "plugin", approved: true, risk: "caution" });
    if (mergedHW.includes("GPS")) hwFeatures.push({ name: "Live Location", category: "plugin", approved: true, risk: "caution" });
    if (mergedHW.includes("QR Scanner")) hwFeatures.push({ name: "QR & Barcode Scanner", category: "plugin", approved: true, risk: "caution" });
    if (mergedHW.includes("Microphone")) hwFeatures.push({ name: "Voice Recording", category: "plugin", approved: true, risk: "caution" });

    // Deduplicate features
    const allFeatures = [...base.features];
    for (const hf of hwFeatures) {
      if (!allFeatures.some(f => f.name === hf.name)) allFeatures.push(hf);
    }

    // Production-ready features always included
    const proFeatures: BlueprintFeature[] = [
      { name: "Splash Screen & App Icon", category: "core", approved: true, risk: "safe" },
      { name: "Form Validation", category: "core", approved: true, risk: "safe" },
      { name: "Error Handling", category: "core", approved: true, risk: "safe" },
      { name: "Smooth Animations", category: "core", approved: true, risk: "safe" },
    ];
    for (const pf of proFeatures) {
      if (!allFeatures.some(f => f.name === pf.name)) allFeatures.push(pf);
    }

    const blueprint: AppBlueprint = {
      appName,
      description: idea,
      entities: base.entities,
      pages: base.pages,
      features: allFeatures,
      plugins: ["Authentication", "File Storage", "Sovereign Vault"],
      hardwareNeeds: mergedHW,
      suggestions: base.suggestions || FALLBACK_PROFILE.suggestions,
    };

    onBlueprintReady(blueprint);
    setIsPlanning(false);
  }, [idea, onBlueprintReady, setIsPlanning, steps.length]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sf-glass rounded-2xl p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Brain className="h-5 w-5 text-accent" />
        <h2 className="text-lg font-semibold text-foreground">{t("planner.title")}</h2>
      </div>

      {!isPlanning && currentStep === 0 && (
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground mb-4">{t("planner.ready")}</p>
          <Button
            onClick={runPlanner}
            disabled={!idea.trim()}
            className="sf-gradient-bg text-primary-foreground font-semibold rounded-xl px-8 h-12 hover:opacity-90 transition-opacity"
          >
            <Sparkles className="h-5 w-5 me-2" />
            {t("planner.start")}
          </Button>
        </div>
      )}

      {(isPlanning || currentStep > 0) && (
        <div className="space-y-3">
          {steps.map((step, i) => {
            const done = currentStep > i;
            const active = currentStep === i + 1 && isPlanning;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  done ? "sf-glass-subtle" : active ? "sf-glass-strong sf-glow-green" : "opacity-40"
                }`}
              >
                {done ? (
                  <CheckCircle2 className="h-5 w-5 text-sf-safe shrink-0" />
                ) : active ? (
                  <Loader2 className="h-5 w-5 text-accent animate-spin shrink-0" />
                ) : (
                  <div className="h-5 w-5 rounded-full border border-foreground/20 shrink-0" />
                )}
                <span className={`text-sm font-medium ${done ? "text-foreground" : active ? "text-accent" : "text-foreground/50"}`}>
                  {step}
                </span>
              </motion.div>
            );
          })}
        </div>
      )}

      {currentStep >= steps.length && !isPlanning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 flex items-center justify-center gap-2 text-sf-safe text-sm font-medium"
        >
          <Shield className="h-4 w-4" />
          {t("planner.complete")}
          <ArrowDown className="h-4 w-4 animate-bounce" />
        </motion.div>
      )}
    </motion.div>
  );
};

export default AIPlannerEngine;
