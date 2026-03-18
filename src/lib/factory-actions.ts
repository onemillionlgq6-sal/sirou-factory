/**
 * Factory Actions — Export, Import, keyboard shortcuts, and system utilities
 * Sovereign Independence Protocol: Portable Production Bundle
 */

import { toast } from "sonner";
import { decrypt, hasEncryptedVault } from "@/lib/crypto";

// ─── Dockerfile Template ───
const DOCKERFILE = `# Sirou Factory — Portable Production Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --production=false
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
`;

// ─── Nginx Config Template ───
const NGINX_CONF = `server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co;" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
    gzip_min_length 1024;

    # SPA routing — all routes fallback to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets aggressively
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Disable access to dotfiles
    location ~ /\\. {
        deny all;
    }
}
`;

// ─── Docker Compose Template ───
const DOCKER_COMPOSE = `version: "3.9"
services:
  sirou-app:
    build: .
    ports:
      - "8080:80"
    restart: unless-stopped
    environment:
      - NODE_ENV=production
`;

// ─── README for self-hosting ───
const SELF_HOST_README = `# Sirou Factory — Self-Hosted Deployment

## Quick Start
\`\`\`bash
docker-compose up -d
\`\`\`
App will be available at http://localhost:8080

## Manual Build
\`\`\`bash
npm ci
npm run build
# Serve the 'dist' folder with any static server
\`\`\`

## Environment
- Node.js 20+
- No external dependencies required for offline operation
- Supabase connection is optional (offline-first by design)

## Data Sovereignty
All data stays in your browser (localStorage + IndexedDB).
The Secure Vault uses AES-256-GCM encryption with your Master Key.
No telemetry, no external calls unless you explicitly configure a backend.
`;

/**
 * Generate a portable production bundle as a downloadable ZIP
 * Contains: system state, Dockerfile, nginx.conf, docker-compose.yml, README
 */
export const exportFactoryState = async () => {
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
    state._buildHash = await generateDeterministicHash(JSON.stringify(state));

    // Build the bundle as a multi-file JSON package
    const bundle = {
      manifest: {
        name: "sirou-factory-portable-bundle",
        version: "3.0.0",
        exportedAt: state._exportedAt,
        buildHash: state._buildHash,
        description: "Portable Production Bundle — Sovereign Independence Protocol",
      },
      systemState: state,
      infrastructure: {
        "Dockerfile": DOCKERFILE,
        "nginx.conf": NGINX_CONF,
        "docker-compose.yml": DOCKER_COMPOSE,
        "README.md": SELF_HOST_README,
      },
    };

    const json = JSON.stringify(bundle, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sirou-factory-bundle-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`Portable bundle exported ✓ (${Object.keys(state).length} keys, Dockerfile + Nginx included)`);
  } catch (err) {
    toast.error("Export failed: " + (err instanceof Error ? err.message : "Unknown error"));
  }
};

/**
 * Import system state from a sirou-factory-backup.json file
 * Integrates with AES Master Key for vault verification
 * Works 100% offline — no network required
 */
export const importFactoryState = async (
  file: File,
  masterKey?: string
): Promise<{ success: boolean; message: string; keysRestored: number }> => {
  try {
    const text = await file.text();
    let parsed: any;

    try {
      parsed = JSON.parse(text);
    } catch {
      return { success: false, message: "Invalid JSON file.", keysRestored: 0 };
    }

    // Support both old format (flat state) and new bundle format
    const stateData = parsed.systemState || parsed;

    // Validate it's a Sirou backup
    if (!stateData._version && !stateData._exportedAt && !parsed.manifest) {
      return { success: false, message: "Not a valid Sirou Factory backup file.", keysRestored: 0 };
    }

    // If vault data exists in backup, verify master key
    const vaultKey = "sirou_secure_vault_enc";
    const hasVaultData = !!stateData[vaultKey];

    if (hasVaultData && masterKey) {
      const decrypted = await decrypt(stateData[vaultKey], masterKey);
      if (decrypted === null) {
        return { success: false, message: "Master Key verification failed. Vault data cannot be decrypted.", keysRestored: 0 };
      }
    } else if (hasVaultData && !masterKey) {
      return { success: false, message: "Backup contains encrypted vault data. Please provide your Master Key to verify.", keysRestored: 0 };
    }

    // Restore all keys to localStorage
    let keysRestored = 0;
    const skipKeys = new Set(["_exportedAt", "_version", "_totalKeys", "_buildHash"]);

    for (const [key, value] of Object.entries(stateData)) {
      if (skipKeys.has(key)) continue;
      try {
        localStorage.setItem(key, typeof value === "string" ? value : JSON.stringify(value));
        keysRestored++;
      } catch {
        // Skip keys that fail (quota etc.)
      }
    }

    return {
      success: true,
      message: `Restored ${keysRestored} keys from backup (${stateData._version || "legacy"}).`,
      keysRestored,
    };
  } catch (err) {
    return {
      success: false,
      message: "Import failed: " + (err instanceof Error ? err.message : "Unknown error"),
      keysRestored: 0,
    };
  }
};

/**
 * Deterministic hash for build reproducibility verification
 * Uses Web Crypto SHA-256
 */
async function generateDeterministicHash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

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
