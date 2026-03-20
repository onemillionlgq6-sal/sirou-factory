import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, ChevronRight, Lock } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

const SovereignCoreLauncher = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(false);

  const handleLaunch = async () => {
    // Check if master key is set (vault protection)
    const hasVault = !!localStorage.getItem("sirou_vault_encrypted");

    if (hasVault) {
      setIsVerifying(true);
      // Prompt for master key verification
      const key = prompt(t("sovereign.enter.key" as any) || "Enter Master Key to access Sovereign Core:");
      setIsVerifying(false);

      if (!key) {
        toast.error(t("sovereign.access.denied" as any) || "Access denied — Master Key required");
        return;
      }

      // Verify key by attempting to decrypt vault data
      try {
        const { decrypt } = await import("@/lib/crypto");
        const vaultData = localStorage.getItem("sirou_vault_encrypted")!;
        await decrypt(vaultData, key);
        toast.success(t("sovereign.access.granted" as any) || "Access granted ✓");
      } catch {
        toast.error(t("sovereign.key.invalid" as any) || "Invalid Master Key");
        return;
      }
    }

    navigate("/sovereign-core");
  };

  return (
    <motion.button
      onClick={handleLaunch}
      disabled={isVerifying}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="w-full sf-glass rounded-2xl p-5 text-left group transition-all hover:shadow-lg hover:shadow-primary/10 disabled:opacity-70"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className="relative">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
              <Shield className="h-7 w-7 text-primary-foreground" />
            </div>
            {/* Lock overlay when vault is active */}
            <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-background flex items-center justify-center">
              <Lock className="h-3 w-3 text-muted-foreground" />
            </div>
          </div>

          <div>
            <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
              {t("sovereign.core.title" as any) || "Sovereign Core"}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("sovereign.core.desc" as any) || "Engine room · Feature inventory · Strategic intelligence"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sf-safe/10 border border-sf-safe/20">
            <div className="h-2 w-2 rounded-full bg-sf-safe animate-pulse" />
            <span className="text-[10px] font-semibold text-sf-safe whitespace-nowrap">
              {t("sovereign.core.status" as any) || "System: Secure & Active"}
            </span>
          </div>

          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </div>

      {/* Mobile status */}
      <div className="sm:hidden flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full bg-sf-safe/10 border border-sf-safe/20 w-fit">
        <div className="h-2 w-2 rounded-full bg-sf-safe animate-pulse" />
        <span className="text-[10px] font-semibold text-sf-safe">
          {t("sovereign.core.status" as any) || "System: Secure & Active"}
        </span>
      </div>
    </motion.button>
  );
};

export default SovereignCoreLauncher;
