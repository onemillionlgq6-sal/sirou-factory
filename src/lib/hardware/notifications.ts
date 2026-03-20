/**
 * Push Notifications Module
 * Capacitor PushNotifications (FCM on Android) with Web Notifications fallback.
 */

import { safeNativeCall, isNativeApp, requestNotificationPermission } from "@/lib/native-bridge";

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  icon?: string;
  badge?: number;
}

export interface NotificationToken {
  value: string;
  platform: "fcm" | "apns" | "web";
}

type NotificationListener = (payload: NotificationPayload) => void;

const listeners: NotificationListener[] = [];

/**
 * Request permission and register for push notifications
 */
export async function registerNotifications(): Promise<{
  success: boolean;
  token?: NotificationToken;
  error?: string;
}> {
  const granted = await requestNotificationPermission();
  if (!granted) {
    return { success: false, error: "Permission denied" };
  }

  if (isNativeApp()) {
    // Register with FCM/APNs via Capacitor
    const result = await safeNativeCall<any>(
      "PushNotifications",
      "register",
      undefined
    );

    if (result.success) {
      // Listen for registration token
      const cap = (window as any).Capacitor?.Plugins?.PushNotifications;
      if (cap?.addListener) {
        cap.addListener("registration", (token: any) => {
          console.log("[Notifications] FCM Token:", token.value);
        });
        cap.addListener("pushNotificationReceived", (notification: any) => {
          const payload: NotificationPayload = {
            title: notification.title || "",
            body: notification.body || "",
            data: notification.data,
          };
          listeners.forEach((fn) => fn(payload));
        });
      }
      return { success: true, token: { value: "pending-fcm", platform: "fcm" } };
    }
    return { success: false, error: result.error };
  }

  // Web: register service worker for push (if available)
  if ("serviceWorker" in navigator && "PushManager" in window) {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: undefined, // VAPID key would go here
      });
      return {
        success: true,
        token: { value: JSON.stringify(sub.toJSON()), platform: "web" },
      };
    } catch (err: any) {
      // Fallback: just use local web notifications
      return { success: true, token: { value: "local-web", platform: "web" } };
    }
  }

  return { success: true, token: { value: "local-web", platform: "web" } };
}

/**
 * Show a local notification (works offline)
 */
export async function showLocalNotification(payload: NotificationPayload): Promise<boolean> {
  const result = await safeNativeCall(
    "LocalNotifications",
    "schedule",
    {
      notifications: [
        {
          id: Date.now(),
          title: payload.title,
          body: payload.body,
          extra: payload.data,
        },
      ],
    },
    async () => {
      // Web Notification fallback
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(payload.title, {
          body: payload.body,
          icon: payload.icon,
          data: payload.data,
        });
        return true;
      }
      return false;
    }
  );
  return result.success;
}

/**
 * Add listener for incoming push notifications
 */
export function onNotificationReceived(callback: NotificationListener): () => void {
  listeners.push(callback);
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

/**
 * Check notification permission status
 */
export async function getNotificationStatus(): Promise<"granted" | "denied" | "prompt"> {
  if (isNativeApp()) {
    const result = await safeNativeCall<any>(
      "PushNotifications",
      "checkPermissions",
      undefined,
      () => ({ receive: "prompt" })
    );
    const receive = result.data?.receive || "prompt";
    return receive === "granted" ? "granted" : receive === "denied" ? "denied" : "prompt";
  }

  if ("Notification" in window) {
    return Notification.permission as "granted" | "denied" | "prompt";
  }
  return "denied";
}
