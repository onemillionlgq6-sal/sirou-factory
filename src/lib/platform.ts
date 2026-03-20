/**
 * Platform detection & adaptive UI utilities.
 * Detects Android/iOS/Web and provides theme + haptics helpers.
 */

import { getPlatform, hapticFeedback } from "@/lib/native-bridge";

export type Platform = "web" | "ios" | "android";
export type VisualStyle = "flat" | "material" | "custom";

const THEME_KEY = "sirou_visual_style";
const REMOTE_CONFIG_KEY = "sirou_remote_config";

// ── Platform detection ──────────────────────────────────────────────

let _cachedPlatform: Platform | null = null;

export const detectPlatform = (): Platform => {
  if (_cachedPlatform) return _cachedPlatform;
  _cachedPlatform = getPlatform();
  return _cachedPlatform;
};

export const isAndroid = () => detectPlatform() === "android";
export const isIOS = () => detectPlatform() === "ios";
export const isMobile = () => detectPlatform() !== "web";

// ── Visual Style Engine ─────────────────────────────────────────────

export const getVisualStyle = (): VisualStyle => {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "flat" || stored === "material" || stored === "custom") return stored;
  } catch { /* fallback */ }
  // Default: material on Android, flat on web/iOS
  return isAndroid() ? "material" : "flat";
};

export const setVisualStyle = (style: VisualStyle) => {
  localStorage.setItem(THEME_KEY, style);
  applyVisualStyle(style);
};

export const applyVisualStyle = (style: VisualStyle) => {
  const root = document.documentElement;
  root.setAttribute("data-visual-style", style);
};

// ── Remote Config ───────────────────────────────────────────────────

export interface RemoteConfig {
  primaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  borderRadius?: string;
  customCSS?: string;
}

export const getRemoteConfig = (): RemoteConfig | null => {
  try {
    const raw = localStorage.getItem(REMOTE_CONFIG_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const applyRemoteConfig = (config: RemoteConfig) => {
  localStorage.setItem(REMOTE_CONFIG_KEY, JSON.stringify(config));
  const root = document.documentElement;
  if (config.primaryColor) root.style.setProperty("--primary", config.primaryColor);
  if (config.accentColor) root.style.setProperty("--accent", config.accentColor);
  if (config.fontFamily) root.style.setProperty("--font-sans", config.fontFamily);
  if (config.borderRadius) root.style.setProperty("--radius", config.borderRadius);
};

// ── Haptic wrappers (convenience) ───────────────────────────────────

export const hapticTap = () => hapticFeedback("light");
export const hapticPress = () => hapticFeedback("medium");
export const hapticHeavy = () => hapticFeedback("heavy");

// ── Touch-friendly sizing ───────────────────────────────────────────

/** Returns min touch target class based on platform */
export const touchTarget = (): string =>
  isMobile() ? "min-h-[48px] min-w-[48px]" : "min-h-[36px] min-w-[36px]";

// ── Init ────────────────────────────────────────────────────────────

export const initPlatformUI = () => {
  const platform = detectPlatform();
  const style = getVisualStyle();
  document.documentElement.setAttribute("data-platform", platform);
  applyVisualStyle(style);

  const remoteConfig = getRemoteConfig();
  if (remoteConfig) applyRemoteConfig(remoteConfig);
};
