/**
 * Hardware Module Index
 * Central export for all hardware capabilities.
 */

export { capturePhoto, scanQR, isCameraAvailable } from "./camera";
export type { PhotoResult, QRResult } from "./camera";

export { getCurrentPosition, watchPosition, isLocationAvailable } from "./location";
export type { LocationResult, LocationOptions } from "./location";

export {
  registerNotifications,
  showLocalNotification,
  onNotificationReceived,
  getNotificationStatus,
} from "./notifications";
export type { NotificationPayload, NotificationToken } from "./notifications";

export {
  checkPermission,
  requestPermission,
  checkAllPermissions,
  getRationale,
} from "./permissions";
export type { PermissionType, PermissionStatus, PermissionRationale } from "./permissions";

export {
  kvSet,
  kvGet,
  kvRemove,
  kvKeys,
  kvClear,
  kvBatchSet,
  getStorageEstimate,
} from "./storage-bridge";
