/**
 * Native Bridge — Capacitor abstraction layer with graceful fallbacks.
 * All native feature access goes through this module.
 * If a plugin is unavailable (e.g., running in browser), fallback behavior activates.
 */

export interface NativeCapabilities {
  camera: boolean;
  biometrics: boolean;
  notifications: boolean;
  haptics: boolean;
  filesystem: boolean;
  share: boolean;
}

let _platform: 'web' | 'ios' | 'android' = 'web';

/**
 * Detect current platform
 */
export const getPlatform = (): 'web' | 'ios' | 'android' => {
  try {
    const cap = (window as any).Capacitor;
    if (cap?.isNativePlatform?.()) {
      return cap.getPlatform?.() === 'ios' ? 'ios' : 'android';
    }
  } catch {
    // fallback
  }
  return 'web';
};

/**
 * Check which native features are available
 */
export const checkCapabilities = async (): Promise<NativeCapabilities> => {
  _platform = getPlatform();
  const isNative = _platform !== 'web';

  return {
    camera: isNative,
    biometrics: isNative,
    notifications: isNative || ('Notification' in window),
    haptics: isNative || ('vibrate' in navigator),
    filesystem: isNative,
    share: isNative || ('share' in navigator),
  };
};

/**
 * Safe wrapper for native plugin calls with fallback
 */
export const safeNativeCall = async <T>(
  pluginName: string,
  method: string,
  args?: any,
  fallback?: () => T | Promise<T>
): Promise<{ success: boolean; data?: T; error?: string; usedFallback: boolean }> => {
  try {
    const cap = (window as any).Capacitor;
    if (cap?.isNativePlatform?.()) {
      const plugins = (window as any).Capacitor?.Plugins;
      const plugin = plugins?.[pluginName];
      if (plugin && typeof plugin[method] === 'function') {
        const result = await plugin[method](args);
        return { success: true, data: result, usedFallback: false };
      }
    }
    // Plugin not available — try fallback
    if (fallback) {
      const data = await fallback();
      return { success: true, data, usedFallback: true };
    }
    return { success: false, error: `${pluginName}.${method} not available`, usedFallback: false };
  } catch (err: any) {
    if (fallback) {
      try {
        const data = await fallback();
        return { success: true, data, usedFallback: true };
      } catch {
        // fallback also failed
      }
    }
    return { success: false, error: err?.message || 'Native call failed', usedFallback: false };
  }
};

/**
 * Request notification permission with web fallback
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  const result = await safeNativeCall<boolean>(
    'PushNotifications',
    'requestPermissions',
    undefined,
    async () => {
      if ('Notification' in window) {
        const perm = await Notification.requestPermission();
        return perm === 'granted';
      }
      return false;
    }
  );
  return result.data ?? false;
};

/**
 * Trigger haptic feedback with web fallback
 */
export const hapticFeedback = async (style: 'light' | 'medium' | 'heavy' = 'medium') => {
  await safeNativeCall(
    'Haptics',
    'impact',
    { style },
    () => {
      if ('vibrate' in navigator) {
        navigator.vibrate(style === 'light' ? 10 : style === 'medium' ? 20 : 40);
      }
    }
  );
};

/**
 * Share content with native share sheet or Web Share API fallback
 */
export const shareContent = async (opts: { title: string; text?: string; url?: string }) => {
  return safeNativeCall(
    'Share',
    'share',
    opts,
    async () => {
      if ('share' in navigator) {
        await navigator.share(opts);
        return true;
      }
      // Last resort: copy to clipboard
      if ((navigator as any).clipboard) {
        await (navigator as any).clipboard.writeText(opts.url || opts.text || '');
      }
      return true;
    }
  );
};

/**
 * Check if running as installed PWA
 */
export const isInstalledPWA = (): boolean => {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
};

/**
 * Check if running inside Capacitor native shell
 */
export const isNativeApp = (): boolean => {
  try {
    return (window as any).Capacitor?.isNativePlatform?.() ?? false;
  } catch {
    return false;
  }
};
