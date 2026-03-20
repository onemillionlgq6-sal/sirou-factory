/**
 * Smart Permission Rationale Dialog
 * Shows a user-friendly explanation before requesting hardware permissions.
 * Compliant with Google Play permission guidelines.
 */

import { useState, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import {
  getRationale,
  requestPermission,
  type PermissionType,
  type PermissionStatus,
} from "@/lib/hardware/permissions";

interface PermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permissionType: PermissionType;
  onResult: (status: PermissionStatus) => void;
}

export default function PermissionDialog({
  open,
  onOpenChange,
  permissionType,
  onResult,
}: PermissionDialogProps) {
  const { lang } = useI18n();
  const [requesting, setRequesting] = useState(false);
  const rationale = getRationale(permissionType);

  const handleAllow = useCallback(async () => {
    setRequesting(true);
    try {
      const status = await requestPermission(permissionType);
      onResult(status);
      onOpenChange(false);
    } finally {
      setRequesting(false);
    }
  }, [permissionType, onResult, onOpenChange]);

  const handleDeny = useCallback(() => {
    onResult("denied");
    onOpenChange(false);
  }, [onResult, onOpenChange]);

  const isRTL = lang === "ar";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="bg-black/80 backdrop-blur-xl border border-white/10 text-white max-w-md"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <DialogHeader className="text-center">
          <div className="text-5xl mb-3 mx-auto">{rationale.icon}</div>
          <DialogTitle className="text-lg font-semibold text-white">
            {isRTL ? rationale.titleAr : rationale.title}
          </DialogTitle>
          <DialogDescription className="text-white/70 mt-2 text-sm leading-relaxed">
            {isRTL ? rationale.descriptionAr : rationale.description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 mt-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <span className="text-green-400 text-xs">🔒</span>
          <span className="text-green-400/90 text-xs">
            {isRTL
              ? "بياناتك تُخزن محلياً على جهازك فقط — لا يتم إرسالها لأي طرف خارجي."
              : "Your data is stored locally on your device only — never sent to third parties."}
          </span>
        </div>

        <DialogFooter className="flex gap-3 mt-4">
          <Button
            variant="outline"
            onClick={handleDeny}
            className="flex-1 border-white/20 text-white/70 hover:bg-white/5"
          >
            {isRTL ? "ليس الآن" : "Not Now"}
          </Button>
          <Button
            onClick={handleAllow}
            disabled={requesting}
            className="flex-1 bg-gradient-to-r from-yellow-500 to-lime-500 text-black font-semibold hover:from-yellow-400 hover:to-lime-400"
          >
            {requesting
              ? isRTL ? "جاري الطلب..." : "Requesting..."
              : isRTL ? "السماح" : "Allow"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
