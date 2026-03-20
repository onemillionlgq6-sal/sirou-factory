/**
 * GPS / Fused Location Provider Module
 * Capacitor-native with Web Geolocation API fallback.
 */

import { safeNativeCall, isNativeApp } from "@/lib/native-bridge";

export interface LocationResult {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  speed: number | null;
  timestamp: string;
}

export interface LocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

/**
 * Get current position using Fused Location Provider (native) or Web Geolocation
 */
export async function getCurrentPosition(
  options?: LocationOptions
): Promise<{ success: boolean; data?: LocationResult; error?: string }> {
  const opts = {
    enableHighAccuracy: options?.enableHighAccuracy ?? true,
    timeout: options?.timeout ?? 10000,
    maximumAge: options?.maximumAge ?? 0,
  };

  const result = await safeNativeCall<any>(
    "Geolocation",
    "getCurrentPosition",
    { ...opts },
    async () => {
      // Web Geolocation API fallback
      return new Promise<LocationResult>((resolve, reject) => {
        if (!("geolocation" in navigator)) {
          return reject(new Error("Geolocation not supported"));
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolve({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              altitude: pos.coords.altitude,
              speed: pos.coords.speed,
              timestamp: new Date(pos.timestamp).toISOString(),
            });
          },
          (err) => reject(new Error(err.message)),
          opts
        );
      });
    }
  );

  if (result.success && result.data) {
    const loc: LocationResult = result.data.coords
      ? {
          latitude: result.data.coords.latitude,
          longitude: result.data.coords.longitude,
          accuracy: result.data.coords.accuracy,
          altitude: result.data.coords.altitude,
          speed: result.data.coords.speed,
          timestamp: new Date(result.data.timestamp || Date.now()).toISOString(),
        }
      : result.data;
    return { success: true, data: loc };
  }
  return { success: false, error: result.error || "Location not available" };
}

/**
 * Watch position changes (returns cleanup function)
 */
export function watchPosition(
  callback: (loc: LocationResult) => void,
  errorCallback?: (err: string) => void,
  options?: LocationOptions
): () => void {
  if (isNativeApp()) {
    // Native: use Capacitor Geolocation.watchPosition
    let watchId: string | null = null;
    const cap = (window as any).Capacitor?.Plugins?.Geolocation;
    if (cap?.watchPosition) {
      cap.watchPosition(
        { enableHighAccuracy: options?.enableHighAccuracy ?? true },
        (pos: any, err: any) => {
          if (err) {
            errorCallback?.(err.message || "Watch error");
            return;
          }
          callback({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            altitude: pos.coords.altitude,
            speed: pos.coords.speed,
            timestamp: new Date(pos.timestamp).toISOString(),
          });
        }
      ).then((id: string) => { watchId = id; });
    }
    return () => {
      if (watchId && cap?.clearWatch) cap.clearWatch({ id: watchId });
    };
  }

  // Web fallback
  if (!("geolocation" in navigator)) {
    errorCallback?.("Geolocation not supported");
    return () => {};
  }

  const id = navigator.geolocation.watchPosition(
    (pos) => {
      callback({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        altitude: pos.coords.altitude,
        speed: pos.coords.speed,
        timestamp: new Date(pos.timestamp).toISOString(),
      });
    },
    (err) => errorCallback?.(err.message),
    {
      enableHighAccuracy: options?.enableHighAccuracy ?? true,
      timeout: options?.timeout ?? 10000,
      maximumAge: options?.maximumAge ?? 0,
    }
  );

  return () => navigator.geolocation.clearWatch(id);
}

/**
 * Check if location services are available
 */
export function isLocationAvailable(): boolean {
  return isNativeApp() || "geolocation" in navigator;
}
