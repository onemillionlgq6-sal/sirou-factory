/**
 * Hook for just-in-time permission requests with rationale.
 * Shows rationale dialog, then requests the actual permission.
 */

import { useState, useCallback } from "react";
import {
  checkPermission,
  type PermissionType,
  type PermissionStatus,
} from "@/lib/hardware/permissions";

export function usePermission(type: PermissionType) {
  const [status, setStatus] = useState<PermissionStatus>("prompt");
  const [showRationale, setShowRationale] = useState(false);

  const check = useCallback(async () => {
    const s = await checkPermission(type);
    setStatus(s);
    return s;
  }, [type]);

  /**
   * Request permission — shows rationale dialog if not yet granted.
   * Returns true if already granted, otherwise opens the dialog.
   */
  const request = useCallback(async (): Promise<boolean> => {
    const current = await checkPermission(type);
    if (current === "granted") {
      setStatus("granted");
      return true;
    }
    // Show rationale dialog
    setShowRationale(true);
    return false;
  }, [type]);

  const onResult = useCallback((result: PermissionStatus) => {
    setStatus(result);
    setShowRationale(false);
  }, []);

  return {
    status,
    showRationale,
    setShowRationale,
    check,
    request,
    onResult,
    isGranted: status === "granted",
    permissionType: type,
  };
}
