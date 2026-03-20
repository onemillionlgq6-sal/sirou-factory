/**
 * Camera & QR Scanner Module
 * Capacitor-native with web fallback via MediaDevices API.
 */

import { safeNativeCall, isNativeApp } from "@/lib/native-bridge";

export interface PhotoResult {
  dataUrl: string;
  format: string;
  timestamp: string;
}

export interface QRResult {
  content: string;
  format: string;
  timestamp: string;
}

/**
 * Capture a photo using native camera or web fallback
 */
export async function capturePhoto(options?: {
  quality?: number;
  width?: number;
  height?: number;
  source?: "camera" | "photos";
}): Promise<{ success: boolean; data?: PhotoResult; error?: string }> {
  const quality = options?.quality ?? 90;
  const source = options?.source ?? "camera";

  const result = await safeNativeCall<any>(
    "Camera",
    "getPhoto",
    {
      quality,
      allowEditing: false,
      resultType: "dataUrl",
      source: source === "camera" ? "CAMERA" : "PHOTOS",
      width: options?.width,
      height: options?.height,
    },
    async () => {
      // Web fallback: use file input
      return new Promise<PhotoResult>((resolve, reject) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        if (source === "camera") {
          input.setAttribute("capture", "environment");
        }
        input.onchange = () => {
          const file = input.files?.[0];
          if (!file) return reject(new Error("No file selected"));
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              dataUrl: reader.result as string,
              format: file.type,
              timestamp: new Date().toISOString(),
            });
          };
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsDataURL(file);
        };
        input.click();
      });
    }
  );

  if (result.success && result.data) {
    const photo: PhotoResult = result.data.dataUrl
      ? { dataUrl: result.data.dataUrl, format: result.data.format || "jpeg", timestamp: new Date().toISOString() }
      : result.data;
    return { success: true, data: photo };
  }
  return { success: false, error: result.error || "Camera not available" };
}

/**
 * Scan a QR/Barcode using native scanner or web fallback
 */
export async function scanQR(): Promise<{ success: boolean; data?: QRResult; error?: string }> {
  const result = await safeNativeCall<any>(
    "BarcodeScanner",
    "scanBarcode",
    undefined,
    async () => {
      // Web fallback: prompt manual input (no native scanner available)
      const content = window.prompt("QR Scanner not available in browser. Enter QR content manually:");
      if (!content) throw new Error("Scan cancelled");
      return { content, format: "QR_CODE", timestamp: new Date().toISOString() };
    }
  );

  if (result.success && result.data) {
    return {
      success: true,
      data: {
        content: result.data.content || result.data.displayValue || "",
        format: result.data.format || "QR_CODE",
        timestamp: new Date().toISOString(),
      },
    };
  }
  return { success: false, error: result.error || "QR scanner not available" };
}

/**
 * Check if camera is available
 */
export function isCameraAvailable(): boolean {
  return isNativeApp() || !!(navigator.mediaDevices?.getUserMedia);
}
