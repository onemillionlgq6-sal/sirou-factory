/**
 * Factory Actions — Export, keyboard shortcuts, and system utilities
 */

import { toast } from "sonner";

/**
 * Export the current factory state as a JSON blob download
 */
export const exportFactoryState = () => {
  try {
    const state: Record<string, unknown> = {};

    // Gather ALL localStorage items for a full backup
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        try {
          state[key] = JSON.parse(localStorage.getItem(key)!);
        } catch {
          state[key] = localStorage.getItem(key);
        }
      }
    }

    state._exportedAt = new Date().toISOString();
    state._version = "sirou-factory-v3";
    state._totalKeys = Object.keys(state).length;

    const json = JSON.stringify(state, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sirou-factory-backup.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`System exported ✓ (${Object.keys(state).length} keys)`);
  } catch (err) {
    toast.error("Export failed: " + (err instanceof Error ? err.message : "Unknown error"));
  }
};

/**
 * Initialize global keyboard shortcuts
 * Returns cleanup function
 */
export const initKeyboardShortcuts = (handlers: {
  onSave?: () => void;
  onVault?: () => void;
  onExport?: () => void;
  onSettings?: () => void;
}): (() => void) => {
  const handler = (e: KeyboardEvent) => {
    const mod = e.ctrlKey || e.metaKey;
    if (!mod) return;

    switch (e.key.toLowerCase()) {
      case "s":
        e.preventDefault();
        handlers.onSave?.();
        break;
      case "k":
        e.preventDefault();
        handlers.onVault?.();
        break;
      case "e":
        e.preventDefault();
        handlers.onExport?.();
        break;
      case ",":
        e.preventDefault();
        handlers.onSettings?.();
        break;
    }
  };

  window.addEventListener("keydown", handler);
  return () => window.removeEventListener("keydown", handler);
};
