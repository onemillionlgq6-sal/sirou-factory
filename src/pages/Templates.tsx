import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, ShoppingCart, UtensilsCrossed, Users, GraduationCap, Dumbbell, Home, Search, Star, Zap, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import factoryBg from "@/assets/factory-bg.jpg";

import ecommerceImg from "@/assets/templates/ecommerce-preview.png";
import restaurantImg from "@/assets/templates/restaurant-preview.png";
import socialImg from "@/assets/templates/social-preview.png";
import educationImg from "@/assets/templates/education-preview.png";
import fitnessImg from "@/assets/templates/fitness-preview.png";
import realestateImg from "@/assets/templates/realestate-preview.png";

interface AppTemplate {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  category: string;
  categoryAr: string;
  icon: React.ElementType;
  image: string;
  features: string[];
  featuresAr: string[];
  difficulty: "easy" | "medium" | "advanced";
  popular?: boolean;
}

const templates: AppTemplate[] = [
  {
    id: "ecommerce",
    name: "E-Commerce Store",
    nameAr: "متجر إلكتروني",
    description: "Complete online store with product catalog, shopping cart, checkout, and payment integration.",
    descriptionAr: "متجر إلكتروني كامل مع كتالوج المنتجات، سلة التسوق، الدفع، وربط بوابات الدفع.",
    category: "Commerce",
    categoryAr: "تجارة",
    icon: ShoppingCart,
    image: ecommerceImg,
    features: ["Product Catalog", "Shopping Cart", "Checkout Flow", "Payment Gateway", "Order Tracking", "Admin Dashboard"],
    featuresAr: ["كتالوج المنتجات", "سلة التسوق", "عملية الشراء", "بوابة الدفع", "تتبع الطلبات", "لوحة الإدارة"],
    difficulty: "medium",
    popular: true,
  },
  {
    id: "restaurant",
    name: "Restaurant & Delivery",
    nameAr: "مطعم وتوصيل طعام",
    description: "Restaurant app with digital menu, online ordering, delivery tracking, and table reservations.",
    descriptionAr: "تطبيق مطعم مع قائمة رقمية، طلب أونلاين، تتبع التوصيل، وحجز الطاولات.",
    category: "Food & Beverage",
    categoryAr: "طعام ومشروبات",
    icon: UtensilsCrossed,
    image: restaurantImg,
    features: ["Digital Menu", "Online Ordering", "Delivery Tracking", "Table Booking", "Reviews", "Push Notifications"],
    featuresAr: ["قائمة رقمية", "طلب أونلاين", "تتبع التوصيل", "حجز طاولات", "تقييمات", "إشعارات فورية"],
    difficulty: "medium",
    popular: true,
  },
  {
    id: "social",
    name: "Social Network",
    nameAr: "شبكة اجتماعية",
    description: "Social media platform with profiles, posts, comments, likes, and real-time messaging.",
    descriptionAr: "منصة تواصل اجتماعي مع ملفات شخصية، منشورات، تعليقات، إعجابات، ومراسلة فورية.",
    category: "Social",
    categoryAr: "اجتماعي",
    icon: Users,
    image: socialImg,
    features: ["User Profiles", "News Feed", "Comments & Likes", "Real-time Chat", "Notifications", "Media Upload"],
    featuresAr: ["ملفات شخصية", "آخر الأخبار", "تعليقات وإعجابات", "دردشة فورية", "إشعارات", "رفع وسائط"],
    difficulty: "advanced",
  },
  {
    id: "education",
    name: "Education & Learning",
    nameAr: "تعليم ودورات",
    description: "E-learning platform with video courses, progress tracking, quizzes, and certificates.",
    descriptionAr: "منصة تعليم إلكتروني مع دورات فيديو، تتبع التقدم، اختبارات، وشهادات.",
    category: "Education",
    categoryAr: "تعليم",
    icon: GraduationCap,
    image: educationImg,
    features: ["Video Courses", "Progress Tracking", "Quizzes", "Certificates", "Student Dashboard", "Instructor Panel"],
    featuresAr: ["دورات فيديو", "تتبع التقدم", "اختبارات", "شهادات", "لوحة الطالب", "لوحة المدرب"],
    difficulty: "medium",
  },
  {
    id: "fitness",
    name: "Fitness & Health",
    nameAr: "لياقة وصحة",
    description: "Fitness app with workout plans, calorie tracking, health stats, and personal trainer features.",
    descriptionAr: "تطبيق لياقة مع خطط تمارين، تتبع السعرات، إحصائيات صحية، ومدرب شخصي.",
    category: "Health",
    categoryAr: "صحة",
    icon: Dumbbell,
    image: fitnessImg,
    features: ["Workout Plans", "Calorie Tracker", "Health Stats", "Progress Charts", "Personal Trainer", "Reminders"],
    featuresAr: ["خطط تمارين", "تتبع السعرات", "إحصائيات صحية", "رسوم التقدم", "مدرب شخصي", "تذكيرات"],
    difficulty: "easy",
  },
  {
    id: "realestate",
    name: "Real Estate",
    nameAr: "عقارات",
    description: "Property listing platform with search, filters, map view, virtual tours, and agent contact.",
    descriptionAr: "منصة عقارات مع بحث، فلاتر، عرض خريطة، جولات افتراضية، وتواصل مع الوكيل.",
    category: "Real Estate",
    categoryAr: "عقارات",
    icon: Home,
    image: realestateImg,
    features: ["Property Listings", "Advanced Search", "Map View", "Virtual Tours", "Agent Contact", "Favorites"],
    featuresAr: ["قوائم العقارات", "بحث متقدم", "عرض خريطة", "جولات افتراضية", "تواصل مع الوكيل", "المفضلة"],
    difficulty: "medium",
  },
];

const difficultyColors = {
  easy: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  advanced: "bg-rose-500/20 text-rose-400 border-rose-500/30",
};

const difficultyLabels = {
  easy: { en: "Easy", ar: "سهل" },
  medium: { en: "Medium", ar: "متوسط" },
  advanced: { en: "Advanced", ar: "متقدم" },
};

const Templates = () => {
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const isRTL = lang === "ar";
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const categories = [...new Set(templates.map((tp) => tp.category))];

  const filtered = templates.filter((tp) => {
    const matchSearch =
      !search ||
      tp.name.toLowerCase().includes(search.toLowerCase()) ||
      tp.nameAr.includes(search) ||
      tp.category.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !selectedCategory || tp.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  const handleUseTemplate = (template: AppTemplate) => {
    toast.success(
      isRTL
        ? `تم اختيار قالب "${template.nameAr}" — جاري التحضير...`
        : `Template "${template.name}" selected — preparing...`
    );
    setTimeout(() => {
      navigate("/", { state: { templateIdea: template.description } });
    }, 800);
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{ backgroundImage: `url(${factoryBg})` }}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="min-h-screen bg-black/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/")}
              className="gap-2 bg-white/10 border-white/25 text-white hover:bg-white/20 backdrop-blur-md text-xs w-fit"
            >
              <BackArrow className="h-4 w-4" />
              {isRTL ? "رجوع" : "Back"}
            </Button>

            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white">
                {isRTL ? "قوالب التطبيقات الجاهزة" : "App Templates"}
              </h1>
              <p className="text-sm text-white/70 mt-1">
                {isRTL
                  ? "اختر قالباً جاهزاً وابدأ بناء تطبيقك فوراً"
                  : "Choose a ready-made template and start building instantly"}
              </p>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 start-3" />
              <Input
                placeholder={isRTL ? "ابحث عن قالب..." : "Search templates..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 ps-10"
              />
            </div>
          </motion.div>

          {/* Category filters */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap gap-2 mb-8"
          >
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                !selectedCategory
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-white/10 text-white/70 border-white/20 hover:bg-white/20"
              }`}
            >
              {isRTL ? "الكل" : "All"}
            </button>
            {categories.map((cat) => {
              const tp = templates.find((t) => t.category === cat);
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                    selectedCategory === cat
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-white/10 text-white/70 border-white/20 hover:bg-white/20"
                  }`}
                >
                  {isRTL ? tp?.categoryAr : cat}
                </button>
              );
            })}
          </motion.div>

          {/* Template grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
            <AnimatePresence mode="popLayout">
              {filtered.map((template, i) => {
                const Icon = template.icon;
                const isExpanded = expandedId === template.id;

                return (
                  <motion.div
                    key={template.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.07 }}
                    className="group"
                  >
                    <div
                      className="sf-glass rounded-2xl overflow-hidden border border-white/10 hover:border-primary/40 transition-all hover:shadow-lg hover:shadow-primary/10 cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : template.id)}
                    >
                      {/* Preview image */}
                      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-white/5 to-white/10">
                        <img
                          src={template.image}
                          alt={template.name}
                          className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                        />
                        {template.popular && (
                          <div className="absolute top-3 end-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/90 text-white text-[10px] font-bold uppercase">
                            <Star className="h-3 w-3" fill="currentColor" />
                            {isRTL ? "شائع" : "Popular"}
                          </div>
                        )}
                        <div className="absolute top-3 start-3">
                          <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${difficultyColors[template.difficulty]}`}>
                            {isRTL ? difficultyLabels[template.difficulty].ar : difficultyLabels[template.difficulty].en}
                          </div>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-5">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center shrink-0">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-foreground text-sm truncate">
                              {isRTL ? template.nameAr : template.name}
                            </h3>
                            <p className="text-[11px] text-muted-foreground">
                              {isRTL ? template.categoryAr : template.category}
                            </p>
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">
                          {isRTL ? template.descriptionAr : template.description}
                        </p>

                        {/* Expanded features */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="border-t border-white/10 pt-3 mb-3">
                                <p className="text-[10px] uppercase font-semibold text-muted-foreground mb-2 tracking-wider">
                                  {isRTL ? "الميزات المضمنة" : "Included Features"}
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {(isRTL ? template.featuresAr : template.features).map((f) => (
                                    <span
                                      key={f}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-medium"
                                    >
                                      <Check className="h-2.5 w-2.5" />
                                      {f}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Action */}
                        <Button
                          size="sm"
                          className="w-full gap-2 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUseTemplate(template);
                          }}
                        >
                          <Zap className="h-3.5 w-3.5" />
                          {isRTL ? "استخدم هذا القالب" : "Use Template"}
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-20">
              <Search className="h-12 w-12 mx-auto text-white/30 mb-4" />
              <p className="text-white/50 text-lg">
                {isRTL ? "لا توجد قوالب مطابقة للبحث" : "No templates match your search"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Templates;
