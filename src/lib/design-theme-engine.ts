/**
 * Design Theme Engine
 * Analyzes user descriptions and reference images to extract design parameters.
 * Falls back to Sovereign Gold/Dark when no style is specified.
 */

export interface AppTheme {
  name: string;
  primary: string;       // HSL gradient start
  primaryEnd: string;    // HSL gradient end
  background: string;    // Main bg
  surface: string;       // Card bg
  surfaceBorder: string; // Card border
  text: string;          // Primary text
  textMuted: string;     // Secondary text
  accent: string;        // Accent color
  accentText: string;    // Text on accent bg
  statusBar: string;     // Status bar text
  navBg: string;         // Bottom nav bg
  navBorder: string;     // Nav border
}

// ─── Built-in Themes ───
export const THEMES: Record<string, AppTheme> = {
  sovereign: {
    name: "Sovereign Gold/Dark",
    primary: "hsl(55,90%,50%)",
    primaryEnd: "hsl(90,60%,45%)",
    background: "hsl(220,25%,8%)",
    surface: "hsl(220,20%,12%)",
    surfaceBorder: "hsl(220,20%,18%)",
    text: "hsl(210,15%,92%)",
    textMuted: "hsl(210,10%,55%)",
    accent: "hsl(55,90%,55%)",
    accentText: "hsl(220,25%,8%)",
    statusBar: "hsl(210,10%,55%)",
    navBg: "hsl(220,20%,10%)",
    navBorder: "hsl(220,20%,16%)",
  },
  ocean: {
    name: "Ocean Blue",
    primary: "hsl(210,90%,55%)",
    primaryEnd: "hsl(190,80%,45%)",
    background: "hsl(215,30%,8%)",
    surface: "hsl(215,25%,13%)",
    surfaceBorder: "hsl(215,20%,20%)",
    text: "hsl(210,20%,93%)",
    textMuted: "hsl(210,15%,55%)",
    accent: "hsl(200,90%,60%)",
    accentText: "hsl(215,30%,8%)",
    statusBar: "hsl(210,15%,55%)",
    navBg: "hsl(215,25%,10%)",
    navBorder: "hsl(215,20%,18%)",
  },
  sunset: {
    name: "Sunset Warm",
    primary: "hsl(15,90%,55%)",
    primaryEnd: "hsl(40,85%,50%)",
    background: "hsl(20,20%,8%)",
    surface: "hsl(20,15%,13%)",
    surfaceBorder: "hsl(20,12%,20%)",
    text: "hsl(30,15%,92%)",
    textMuted: "hsl(20,10%,55%)",
    accent: "hsl(25,90%,60%)",
    accentText: "hsl(20,20%,8%)",
    statusBar: "hsl(20,10%,55%)",
    navBg: "hsl(20,15%,10%)",
    navBorder: "hsl(20,12%,18%)",
  },
  forest: {
    name: "Forest Green",
    primary: "hsl(140,60%,40%)",
    primaryEnd: "hsl(160,50%,35%)",
    background: "hsl(150,20%,7%)",
    surface: "hsl(150,15%,12%)",
    surfaceBorder: "hsl(150,12%,18%)",
    text: "hsl(140,10%,92%)",
    textMuted: "hsl(140,8%,55%)",
    accent: "hsl(140,60%,50%)",
    accentText: "hsl(150,20%,7%)",
    statusBar: "hsl(140,8%,55%)",
    navBg: "hsl(150,15%,9%)",
    navBorder: "hsl(150,12%,16%)",
  },
  royal: {
    name: "Royal Purple",
    primary: "hsl(270,70%,55%)",
    primaryEnd: "hsl(290,60%,50%)",
    background: "hsl(265,25%,8%)",
    surface: "hsl(265,20%,13%)",
    surfaceBorder: "hsl(265,18%,20%)",
    text: "hsl(270,10%,93%)",
    textMuted: "hsl(265,10%,55%)",
    accent: "hsl(270,70%,60%)",
    accentText: "hsl(265,25%,8%)",
    statusBar: "hsl(265,10%,55%)",
    navBg: "hsl(265,20%,10%)",
    navBorder: "hsl(265,18%,18%)",
  },
  minimal: {
    name: "Minimal Light",
    primary: "hsl(0,0%,15%)",
    primaryEnd: "hsl(0,0%,25%)",
    background: "hsl(0,0%,98%)",
    surface: "hsl(0,0%,100%)",
    surfaceBorder: "hsl(0,0%,90%)",
    text: "hsl(0,0%,10%)",
    textMuted: "hsl(0,0%,45%)",
    accent: "hsl(0,0%,15%)",
    accentText: "hsl(0,0%,98%)",
    statusBar: "hsl(0,0%,45%)",
    navBg: "hsl(0,0%,97%)",
    navBorder: "hsl(0,0%,90%)",
  },
  rose: {
    name: "Rose Pink",
    primary: "hsl(340,75%,55%)",
    primaryEnd: "hsl(320,65%,50%)",
    background: "hsl(335,20%,8%)",
    surface: "hsl(335,15%,13%)",
    surfaceBorder: "hsl(335,12%,20%)",
    text: "hsl(340,10%,93%)",
    textMuted: "hsl(335,10%,55%)",
    accent: "hsl(340,75%,60%)",
    accentText: "hsl(335,20%,8%)",
    statusBar: "hsl(335,10%,55%)",
    navBg: "hsl(335,15%,10%)",
    navBorder: "hsl(335,12%,18%)",
  },
};

// ─── Theme Detection from Description ───
const THEME_KEYWORDS: Record<string, string[]> = {
  ocean: ["blue", "ocean", "sea", "marine", "aqua", "water", "أزرق", "بحر", "محيط"],
  sunset: ["orange", "warm", "sunset", "fire", "red", "برتقالي", "غروب", "دافئ"],
  forest: ["green", "forest", "nature", "eco", "organic", "أخضر", "طبيعة", "غابة"],
  royal: ["purple", "royal", "luxury", "elegant", "violet", "بنفسجي", "ملكي", "فاخر"],
  minimal: ["minimal", "light", "clean", "simple", "white", "بسيط", "أبيض", "نظيف"],
  rose: ["pink", "rose", "feminine", "beauty", "وردي", "جمال"],
};

/**
 * Detect theme from user's description text.
 * Returns the matching theme or the default Sovereign theme.
 */
export function detectThemeFromDescription(description: string): AppTheme {
  const lower = description.toLowerCase();
  for (const [themeId, keywords] of Object.entries(THEME_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return THEMES[themeId];
    }
  }
  return THEMES.sovereign; // Default
}

/**
 * Get theme by ID, with fallback to sovereign.
 */
export function getThemeById(id: string): AppTheme {
  return THEMES[id] || THEMES.sovereign;
}

/**
 * Get all available theme IDs.
 */
export function getThemeIds(): string[] {
  return Object.keys(THEMES);
}
