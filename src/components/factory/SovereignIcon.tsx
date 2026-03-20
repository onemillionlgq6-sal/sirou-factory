import { motion } from "framer-motion";

interface SovereignIconProps {
  size?: "sm" | "md" | "lg";
  glowing?: boolean;
}

/**
 * Hexagonal shield icon with circuit-chip center and neon glow.
 * Premium 'Cyber-Core' branding element for Sirou Factory.
 */
const SovereignIcon = ({ size = "md", glowing = true }: SovereignIconProps) => {
  const dims = { sm: 36, md: 48, lg: 64 }[size];
  const chipSize = dims * 0.38;

  return (
    <motion.div
      className="relative shrink-0"
      style={{ width: dims, height: dims }}
      whileHover={{ scale: 1.06 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      {/* Glow layer */}
      {glowing && (
        <div
          className="absolute inset-0 rounded-2xl opacity-50 blur-lg"
          style={{
            background: "linear-gradient(135deg, hsl(45 100% 55%), hsl(210 100% 60%))",
          }}
        />
      )}

      {/* Hexagon SVG */}
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full drop-shadow-lg"
        style={{ filter: glowing ? "drop-shadow(0 0 6px hsla(45,100%,55%,0.4))" : undefined }}
      >
        <defs>
          <linearGradient id="sirou-hex-fill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(45, 100%, 55%)" />
            <stop offset="50%" stopColor="hsl(30, 90%, 50%)" />
            <stop offset="100%" stopColor="hsl(210, 100%, 55%)" />
          </linearGradient>
          <linearGradient id="sirou-hex-border" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsla(45, 100%, 70%, 0.9)" />
            <stop offset="100%" stopColor="hsla(210, 100%, 70%, 0.6)" />
          </linearGradient>
        </defs>
        {/* Outer hexagon (border) */}
        <polygon
          points="50,2 93,25 93,75 50,98 7,75 7,25"
          fill="url(#sirou-hex-border)"
        />
        {/* Inner hexagon (fill) */}
        <polygon
          points="50,6 89,27 89,73 50,94 11,73 11,27"
          fill="url(#sirou-hex-fill)"
        />
      </svg>

      {/* Central lock / chip icon */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ zIndex: 2 }}
      >
        <svg
          width={chipSize}
          height={chipSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="hsl(220, 25%, 10%)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          <circle cx="12" cy="16" r="1.5" fill="hsl(220, 25%, 10%)" />
          <line x1="1" y1="15" x2="3" y2="15" strokeWidth="1.5" />
          <line x1="21" y1="15" x2="23" y2="15" strokeWidth="1.5" />
          <line x1="1" y1="18" x2="3" y2="18" strokeWidth="1.5" />
          <line x1="21" y1="18" x2="23" y2="18" strokeWidth="1.5" />
        </svg>
      </div>
    </motion.div>
  );
};

export default SovereignIcon;
