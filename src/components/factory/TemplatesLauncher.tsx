import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Blocks,
  ChevronRight,
  ChevronDown,
  ShoppingCart,
  UtensilsCrossed,
  Users,
  GraduationCap,
  Dumbbell,
  Home,
  Star,
  Zap,
  Check,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import SovereignIcon from "./SovereignIcon";

import ecommerceImg from "@/assets/templates/ecommerce-preview.png";
import restaurantImg from "@/assets/templates/restaurant-preview.png";
import socialImg from "@/assets/templates/social-preview.png";
import educationImg from "@/assets/templates/education-preview.png";
import fitnessImg from "@/assets/templates/fitness-preview.png";
import realestateImg from "@/assets/templates/realestate-preview.png";

interface QuickTemplate {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  icon: React.ElementType;
  image: string;
  features: string[];
  featuresAr: string[];
  popular?: boolean;
}

const quickTemplates: QuickTemplate[] = [
  {
    id: "ecommerce",
    name: "E-Commerce Store",
    nameAr: "متجر إلكتروني",
    description: "Complete online store with product catalog, shopping cart, checkout, and payment integration.",
    icon: ShoppingCart,
    image: ecommerceImg,
    features: ["Product Catalog", "Shopping Cart", "Checkout", "Payments"],
    featuresAr: ["كتالوج المنتجات", "سلة التسوق", "عملية الشراء", "الدفع"],
    popular: true,
  },
  {
    id: "restaurant",
    name: "Restaurant & Delivery",
    nameAr: "مطعم وتوصيل",
    description: "Restaurant app with digital menu, online ordering, delivery tracking, and table reservations.",
    icon: UtensilsCrossed,
    image: restaurantImg,
    features: ["Digital Menu", "Ordering", "Delivery", "Reservations"],
    featuresAr: ["قائمة رقمية", "طلب أونلاين", "توصيل", "حجوزات"],
    popular: true,
  },
  {
    id: "social",
    name: "Social Network",
    nameAr: "شبكة اجتماعية",
    description: "Social media platform with profiles, posts, comments, likes, and real-time messaging.",
    icon: Users,
    image: socialImg,
    features: ["Profiles", "Posts", "Chat", "Notifications"],
    featuresAr: ["ملفات شخصية", "منشورات", "دردشة", "إشعارات"],
  },
  {
    id: "education",
    name: "Education Platform",
    nameAr: "منصة تعليمية",
    description: "E-learning platform with video courses, progress tracking, quizzes, and certificates.",
    icon: GraduationCap,
    image: educationImg,
    features: ["Courses", "Quizzes", "Certificates", "Dashboard"],
    featuresAr: ["دورات", "اختبارات", "شهادات", "لوحة تحكم"],
  },
  {
    id: "fitness",
    name: "Fitness & Health",
    nameAr: "لياقة وصحة",
    description: "Fitness app with workout plans, calorie tracking, health stats, and personal trainer features.",
    icon: Dumbbell,
    image: fitnessImg,
    features: ["Workouts", "Calories", "Stats", "Trainer"],
    featuresAr: ["تمارين", "سعرات", "إحصائيات", "مدرب"],
  },
  {
    id: "realestate",
    name: "Real Estate",
    nameAr: "عقارات",
    description: "Property listing platform with search, filters, map view, virtual tours, and agent contact.",
    icon: Home,
    image: realestateImg,
    features: ["Listings", "Search", "Map", "Tours"],
    featuresAr: ["قوائم", "بحث", "خريطة", "جولات"],
  },
];

const TemplatesLauncher = () => {
  const { lang } = useI18n();
  const navigate = useNavigate();
  const isRTL = lang === "ar";
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleUseTemplate = (template: QuickTemplate) => {
    toast.success(
      isRTL
        ? `تم اختيار "${template.nameAr}" — جاري التحضير...`
        : `"${template.name}" selected — preparing...`
    );
    setTimeout(() => {
      navigate("/", { state: { templateIdea: template.description } });
    }, 600);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="sf-glass rounded-2xl overflow-hidden transition-all"
    >
      {/* Header — Toggle */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full p-5 text-start group transition-all hover:bg-foreground/5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <SovereignIcon size="sm" glowing={false} />
            <div>
              <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                {isRTL ? "قوالب التطبيقات" : "App Templates"}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isRTL
                  ? "قوالب جاهزة · متجر · مطعم · شبكة اجتماعية · والمزيد"
                  : "Ready-made · Store · Restaurant · Social · and more"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <Blocks className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] font-semibold tracking-wider text-primary whitespace-nowrap uppercase">
                {isRTL ? "6 قوالب" : "6 Templates"}
              </span>
            </div>
            {isOpen ? (
              <ChevronDown className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            ) : (
              <ChevronRight
                className={`h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors ${isRTL ? "rotate-180" : ""}`}
              />
            )}
          </div>
        </div>
      </button>

      {/* Expandable Grid */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-1">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {quickTemplates.map((template, i) => {
                  const Icon = template.icon;
                  const isHovered = hoveredId === template.id;

                  return (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onMouseEnter={() => setHoveredId(template.id)}
                      onMouseLeave={() => setHoveredId(null)}
                      className="relative group"
                    >
                      <div className="sf-glass-subtle rounded-xl border border-foreground/10 hover:border-primary/40 overflow-hidden transition-all hover:shadow-md hover:shadow-primary/10 cursor-pointer">
                        {/* Preview */}
                        <div className="relative h-24 overflow-hidden bg-gradient-to-br from-foreground/5 to-foreground/10">
                          <img
                            src={template.image}
                            alt={template.name}
                            className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-500"
                          />
                          {template.popular && (
                            <div className="absolute top-1.5 end-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-500/90 text-white text-[8px] font-bold">
                              <Star className="h-2.5 w-2.5" fill="currentColor" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="p-2.5">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="text-[11px] font-bold text-foreground truncate">
                              {isRTL ? template.nameAr : template.name}
                            </span>
                          </div>

                          {/* Features on hover */}
                          <AnimatePresence>
                            {isHovered && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="flex flex-wrap gap-1 mb-2 mt-1">
                                  {(isRTL ? template.featuresAr : template.features).slice(0, 3).map((f) => (
                                    <span
                                      key={f}
                                      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[8px] font-medium"
                                    >
                                      <Check className="h-2 w-2" />
                                      {f}
                                    </span>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <Button
                            size="sm"
                            className="w-full h-7 text-[10px] gap-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUseTemplate(template);
                            }}
                          >
                            <Zap className="h-3 w-3" />
                            {isRTL ? "استخدام" : "Use"}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* See all link */}
              <div className="mt-3 text-center">
                <button
                  onClick={() => navigate("/templates")}
                  className="text-xs text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  {isRTL ? "عرض جميع القوالب بالتفصيل ←" : "→ View all templates in detail"}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TemplatesLauncher;
