/**
 * Smart Permission Manager
 * Just-in-time permission requests with user-friendly rationale dialogs.
 * Compliant with Google Play standards.
 */

import { isNativeApp } from "@/lib/native-bridge";

export type PermissionType = "camera" | "location" | "notifications" | "storage" | "microphone";

export type PermissionStatus = "granted" | "denied" | "prompt" | "unavailable";

export interface PermissionRationale {
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  icon: string;
}

/** Rationale messages for each permission type */
const RATIONALES: Record<PermissionType, PermissionRationale> = {
  camera: {
    title: "Camera Access Required",
    titleAr: "مطلوب الوصول للكاميرا",
    description: "This feature needs camera access to capture photos and scan QR codes. Your photos stay on your device.",
    descriptionAr: "تحتاج هذه الميزة إلى الكاميرا لالتقاط الصور ومسح رموز QR. صورك تبقى على جهازك فقط.",
    icon: "📷",
  },
  location: {
    title: "Location Access Required",
    titleAr: "مطلوب الوصول للموقع",
    description: "This feature uses your location for mapping and local services. Location data is stored locally first.",
    descriptionAr: "تستخدم هذه الميزة موقعك للخرائط والخدمات المحلية. بيانات الموقع تُخزن محلياً أولاً.",
    icon: "📍",
  },
  notifications: {
    title: "Notification Permission",
    titleAr: "إذن الإشعارات",
    description: "Allow notifications to receive real-time alerts and updates. You can disable them anytime.",
    descriptionAr: "اسمح بالإشعارات لتلقي التنبيهات والتحديثات الفورية. يمكنك تعطيلها في أي وقت.",
    icon: "🔔",
  },
  storage: {
    title: "Storage Access Required",
    titleAr: "مطلوب الوصول للتخزين",
    description: "This feature needs storage access to save and load files securely on your device.",
    descriptionAr: "تحتاج هذه الميزة إلى التخزين لحفظ وتحميل الملفات بأمان على جهازك.",
    icon: "💾",
  },
  microphone: {
    title: "Microphone Access Required",
    titleAr: "مطلوب الوصول للميكروفون",
    description: "This feature needs microphone access for audio recording. Recordings stay on your device.",
    descriptionAr: "تحتاج هذه الميزة إلى الميكروفون لتسجيل الصوت. التسجيلات تبقى على جهازك.",
    icon: "🎤",
  },
};

/** Get rationale for a permission type */
export function getRationale(type: PermissionType): PermissionRationale {
  return RATIONALES[type];
}

/**
 * Check current permission status without requesting
 */
export async function checkPermission(type: PermissionType): Promise<PermissionStatus> {
  if (isNativeApp()) {
    const pluginMap: Record<PermissionType, { plugin: string; method: string }> = {
      camera: { plugin: "Camera", method: "checkPermissions" },
      location: { plugin: "Geolocation", method: "checkPermissions" },
      notifications: { plugin: "PushNotifications", method: "checkPermissions" },
      storage: { plugin: "Filesystem", method: "checkPermissions" },
      microphone: { plugin: "Microphone", method: "checkPermissions" },
    };

    const { plugin, method } = pluginMap[type];
    try {
      const cap = (window as any).Capacitor?.Plugins?.[plugin];
      if (cap?.[method]) {
        const result = await cap[method]();
        const status = result?.[type] || result?.receive || result?.publicStorage || "prompt";
        return status === "granted" ? "granted" : status === "denied" ? "denied" : "prompt";
      }
    } catch {
      return "prompt";
    }
  }

  // Web: check Permissions API
  try {
    const nameMap: Record<PermissionType, string> = {
      camera: "camera",
      location: "geolocation",
      notifications: "notifications",
      storage: "persistent-storage",
      microphone: "microphone",
    };
    const result = await navigator.permissions.query({ name: nameMap[type] as PermissionName });
    return result.state as PermissionStatus;
  } catch {
    return "prompt";
  }
}

/**
 * Request a permission — should be called after showing rationale UI
 */
export async function requestPermission(type: PermissionType): Promise<PermissionStatus> {
  if (isNativeApp()) {
    const pluginMap: Record<PermissionType, { plugin: string; method: string }> = {
      camera: { plugin: "Camera", method: "requestPermissions" },
      location: { plugin: "Geolocation", method: "requestPermissions" },
      notifications: { plugin: "PushNotifications", method: "requestPermissions" },
      storage: { plugin: "Filesystem", method: "requestPermissions" },
      microphone: { plugin: "Microphone", method: "requestPermissions" },
    };

    const { plugin, method } = pluginMap[type];
    try {
      const cap = (window as any).Capacitor?.Plugins?.[plugin];
      if (cap?.[method]) {
        const result = await cap[method]();
        const status = result?.[type] || result?.receive || result?.publicStorage || "denied";
        return status === "granted" ? "granted" : "denied";
      }
    } catch {
      return "denied";
    }
  }

  // Web fallbacks for each type
  switch (type) {
    case "notifications":
      if ("Notification" in window) {
        const perm = await Notification.requestPermission();
        return perm === "granted" ? "granted" : "denied";
      }
      return "unavailable";

    case "camera":
    case "microphone":
      try {
        const constraints = type === "camera" ? { video: true } : { audio: true };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        stream.getTracks().forEach((t) => t.stop());
        return "granted";
      } catch {
        return "denied";
      }

    case "location":
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve("granted"),
          () => resolve("denied"),
          { timeout: 5000 }
        );
      });

    default:
      return "unavailable";
  }
}

/**
 * Batch check all permissions
 */
export async function checkAllPermissions(): Promise<Record<PermissionType, PermissionStatus>> {
  const types: PermissionType[] = ["camera", "location", "notifications", "storage", "microphone"];
  const results = await Promise.all(types.map((t) => checkPermission(t)));
  return Object.fromEntries(types.map((t, i) => [t, results[i]])) as Record<PermissionType, PermissionStatus>;
}
