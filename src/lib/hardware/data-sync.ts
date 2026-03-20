/**
 * Hardware Data Sync
 * Stores hardware-captured data (photos, locations) as events in the
 * offline-first event journal, auto-syncing when online.
 */

import { appendEvent, EventType } from "@/lib/event-store";
import type { PhotoResult } from "@/lib/hardware/camera";
import type { LocationResult } from "@/lib/hardware/location";

/**
 * Store a captured photo as an event
 */
export async function storePhotoEvent(photo: PhotoResult, context?: string) {
  return appendEvent(EventType.USER_ACTION_LOGGED, {
    action: "photo_captured",
    context,
    format: photo.format,
    timestamp: photo.timestamp,
    // Store thumbnail only to keep event size manageable
    thumbnailLength: photo.dataUrl?.length || 0,
  }, {
    entity_type: "hardware_captures",
    entity_id: crypto.randomUUID(),
  });
}

/**
 * Store a location reading as an event
 */
export async function storeLocationEvent(location: LocationResult, context?: string) {
  return appendEvent(EventType.USER_ACTION_LOGGED, {
    action: "location_captured",
    context,
    latitude: location.latitude,
    longitude: location.longitude,
    accuracy: location.accuracy,
    timestamp: location.timestamp,
  }, {
    entity_type: "hardware_captures",
    entity_id: crypto.randomUUID(),
  });
}

/**
 * Store a generic hardware event
 */
export async function storeHardwareEvent(
  action: string,
  data: Record<string, unknown>
) {
  return appendEvent(EventType.USER_ACTION_LOGGED, {
    action,
    ...data,
    timestamp: new Date().toISOString(),
  }, {
    entity_type: "hardware_captures",
    entity_id: crypto.randomUUID(),
  });
}
