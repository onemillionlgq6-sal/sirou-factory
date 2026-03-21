import { motion } from "framer-motion";
import sovereignImg from "@/assets/sovereign-icon.png";

interface SovereignIconProps {
  size?: "sm" | "md" | "lg" | "xl";
  glowing?: boolean;
}

const SovereignIcon = ({ size = "md", glowing = true }: SovereignIconProps) => {
  const dims = { sm: 36, md: 48, lg: 64, xl: 120 }[size];

  return (
    <motion.div
      className="relative shrink-0"
      style={{ width: dims, height: dims }}
      whileHover={{ scale: 1.06 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      {glowing && (
        <div
          className="absolute inset-[-15%] rounded-full opacity-40 blur-lg pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, hsla(200,80%,60%,0.4) 0%, transparent 70%)",
          }}
        />
      )}
      <img
        src={sovereignImg}
        alt="Sirou Factory"
        className="w-full h-full object-contain"
        draggable={false}
      />
    </motion.div>
  );
};

export default SovereignIcon;
