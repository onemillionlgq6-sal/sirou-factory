import { motion } from "framer-motion";

interface SovereignIconProps {
  size?: "sm" | "md" | "lg" | "xl";
  glowing?: boolean;
}

/**
 * Premium Sovereign Tech Icon — Hexagonal shield with circuit traces,
 * core gem, and abstracted integration modules (email, media, network).
 * All English text is hardcoded and never translated.
 */
const SovereignIcon = ({ size = "md", glowing = true }: SovereignIconProps) => {
  const dims = { sm: 36, md: 48, lg: 64, xl: 120 }[size];

  return (
    <motion.div
      className="relative shrink-0"
      style={{ width: dims, height: dims }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      {/* Neon halo glow */}
      {glowing && (
        <div
          className="absolute inset-[-20%] rounded-full opacity-40 blur-xl pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, hsla(45,100%,60%,0.5) 0%, hsla(210,100%,55%,0.3) 50%, transparent 70%)",
          }}
        />
      )}

      <svg
        viewBox="0 0 200 200"
        className="absolute inset-0 w-full h-full"
        style={{
          filter: glowing
            ? "drop-shadow(0 0 8px hsla(45,100%,55%,0.35)) drop-shadow(0 0 20px hsla(210,100%,60%,0.2))"
            : undefined,
        }}
      >
        <defs>
          {/* Metallic gold-to-blue gradient */}
          <linearGradient id="si-metal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(45, 100%, 65%)" />
            <stop offset="35%" stopColor="hsl(38, 90%, 55%)" />
            <stop offset="65%" stopColor="hsl(210, 80%, 55%)" />
            <stop offset="100%" stopColor="hsl(220, 90%, 50%)" />
          </linearGradient>

          {/* Brushed metallic inner fill */}
          <linearGradient id="si-inner" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(220, 25%, 14%)" />
            <stop offset="50%" stopColor="hsl(225, 20%, 18%)" />
            <stop offset="100%" stopColor="hsl(215, 25%, 12%)" />
          </linearGradient>

          {/* Core gem radial */}
          <radialGradient id="si-gem" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(45, 100%, 75%)" />
            <stop offset="40%" stopColor="hsl(35, 95%, 55%)" />
            <stop offset="100%" stopColor="hsl(210, 90%, 50%)" />
          </radialGradient>

          {/* Data point glow */}
          <radialGradient id="si-dot" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(160, 80%, 55%)" />
            <stop offset="100%" stopColor="hsl(160, 80%, 55%)" stopOpacity="0" />
          </radialGradient>

          {/* Circuit trace color */}
          <linearGradient id="si-circuit" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsla(45, 100%, 65%, 0.6)" />
            <stop offset="100%" stopColor="hsla(210, 100%, 60%, 0.6)" />
          </linearGradient>
        </defs>

        {/* ── Outer hexagonal shield ── */}
        <polygon
          points="100,5 185,30 185,120 150,175 100,195 50,175 15,120 15,30"
          fill="url(#si-metal)"
          opacity="0.95"
        />
        {/* Inner dark face */}
        <polygon
          points="100,14 177,36 177,117 146,168 100,186 54,168 23,117 23,36"
          fill="url(#si-inner)"
        />

        {/* ── Circuit trace pattern ── */}
        <g stroke="url(#si-circuit)" strokeWidth="0.8" fill="none" opacity="0.7">
          {/* Horizontal traces */}
          <line x1="35" y1="60" x2="70" y2="60" />
          <line x1="130" y1="60" x2="165" y2="60" />
          <line x1="35" y1="140" x2="70" y2="140" />
          <line x1="130" y1="140" x2="165" y2="140" />
          {/* Vertical traces */}
          <line x1="60" y1="35" x2="60" y2="55" />
          <line x1="140" y1="35" x2="140" y2="55" />
          <line x1="60" y1="145" x2="60" y2="165" />
          <line x1="140" y1="145" x2="140" y2="165" />
          {/* Diagonal connectors */}
          <line x1="70" y1="60" x2="85" y2="75" />
          <line x1="130" y1="60" x2="115" y2="75" />
          <line x1="70" y1="140" x2="85" y2="125" />
          <line x1="130" y1="140" x2="115" y2="125" />
          {/* Inner ring traces */}
          <circle cx="100" cy="100" r="32" strokeDasharray="4 6" />
          <circle cx="100" cy="100" r="46" strokeDasharray="2 8" />
        </g>

        {/* Circuit junction dots */}
        <g fill="hsla(45, 100%, 65%, 0.8)">
          <circle cx="35" cy="60" r="2" />
          <circle cx="165" cy="60" r="2" />
          <circle cx="35" cy="140" r="2" />
          <circle cx="165" cy="140" r="2" />
          <circle cx="60" cy="35" r="2" />
          <circle cx="140" cy="35" r="2" />
          <circle cx="60" cy="165" r="2" />
          <circle cx="140" cy="165" r="2" />
        </g>

        {/* ── Core gem ── */}
        <circle cx="100" cy="100" r="18" fill="url(#si-gem)" opacity="0.95" />
        <circle cx="100" cy="100" r="20" fill="none" stroke="hsla(45,100%,70%,0.5)" strokeWidth="1" />

        {/* Inner lock keyhole */}
        <circle cx="100" cy="96" r="4" fill="hsl(220, 25%, 12%)" />
        <rect x="98" y="98" width="4" height="8" rx="1" fill="hsl(220, 25%, 12%)" />

        {/* ── Radiating data points from core ── */}
        <g>
          <circle cx="100" cy="65" r="3" fill="url(#si-dot)" />
          <circle cx="130" cy="78" r="2.5" fill="url(#si-dot)" />
          <circle cx="130" cy="122" r="2.5" fill="url(#si-dot)" />
          <circle cx="100" cy="135" r="3" fill="url(#si-dot)" />
          <circle cx="70" cy="122" r="2.5" fill="url(#si-dot)" />
          <circle cx="70" cy="78" r="2.5" fill="url(#si-dot)" />
        </g>

        {/* ── Abstracted integration modules ── */}

        {/* Email module (top-left) */}
        <g transform="translate(32, 72)">
          <rect x="0" y="0" width="16" height="12" rx="2" fill="none" stroke="hsla(45,100%,65%,0.5)" strokeWidth="0.8" />
          <polyline points="0,0 8,6 16,0" fill="none" stroke="hsla(45,100%,65%,0.5)" strokeWidth="0.8" />
        </g>

        {/* Media/Play module (top-right) */}
        <g transform="translate(150, 72)">
          <rect x="0" y="0" width="16" height="12" rx="2" fill="none" stroke="hsla(210,100%,60%,0.5)" strokeWidth="0.8" />
          <polygon points="5,2 5,10 13,6" fill="hsla(210,100%,60%,0.4)" />
        </g>

        {/* Network node module (bottom-center) */}
        <g transform="translate(90, 155)">
          <circle cx="10" cy="0" r="3" fill="hsla(160,80%,55%,0.5)" />
          <circle cx="0" cy="10" r="2" fill="hsla(160,80%,55%,0.4)" />
          <circle cx="20" cy="10" r="2" fill="hsla(160,80%,55%,0.4)" />
          <line x1="10" y1="3" x2="2" y2="8" stroke="hsla(160,80%,55%,0.4)" strokeWidth="0.6" />
          <line x1="10" y1="3" x2="18" y2="8" stroke="hsla(160,80%,55%,0.4)" strokeWidth="0.6" />
        </g>

        {/* ── Hardcoded English tech labels ── */}
        <g fontFamily="Orbitron, Inter, system-ui, sans-serif" fill="hsla(210,100%,70%,0.45)" fontSize="5" letterSpacing="1.5" fontWeight="500">
          <text x="42" y="52" textAnchor="start">SECURE CORE</text>
          <text x="158" y="52" textAnchor="end">V5 ENGINE</text>
          <text x="100" y="182" textAnchor="middle">API V2.1</text>
        </g>

        {/* Corner reference markers */}
        <g fontFamily="Inter, system-ui, sans-serif" fill="hsla(45,100%,65%,0.3)" fontSize="4" letterSpacing="0.8">
          <text x="25" y="28">S:01</text>
          <text x="160" y="28" textAnchor="end">R:07</text>
        </g>
      </svg>
    </motion.div>
  );
};

export default SovereignIcon;
