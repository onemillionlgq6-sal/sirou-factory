import { useState, useEffect, useCallback } from "react";
import {
  detectPlatform,
  getVisualStyle,
  setVisualStyle,
  hapticTap,
  hapticPress,
  isMobile,
  type Platform,
  type VisualStyle,
} from "@/lib/platform";

/**
 * Hook providing platform detection, visual style switching, and haptic helpers.
 */
export function usePlatform() {
  const [platform] = useState<Platform>(detectPlatform);
  const [visualStyle, _setVisualStyle] = useState<VisualStyle>(getVisualStyle);

  const changeStyle = useCallback((style: VisualStyle) => {
    setVisualStyle(style);
    _setVisualStyle(style);
  }, []);

  return {
    platform,
    isAndroid: platform === "android",
    isIOS: platform === "ios",
    isMobile: platform !== "web",
    visualStyle,
    setVisualStyle: changeStyle,
    hapticTap,
    hapticPress,
  };
}
