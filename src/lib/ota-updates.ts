/**
 * Secure OTA (Over-The-Air) Update System
 * Allows updating UI themes, text, and config remotely
 * via authenticated owner-only Remote Config.
 */

interface OTAUpdate {
  id: string;
  version: string;
  type: "theme" | "text" | "config" | "feature_flag";
  payload: Record<string, unknown>;
  timestamp: string;
  signature: string; // SHA-256 hash for verification
}

interface OTAConfig {
  currentVersion: string;
  lastChecked: string | null;
  autoCheck: boolean;
  updates: OTAUpdate[];
}

const OTA_STORAGE_KEY = "sirou_ota_config";

function getOTAConfig(): OTAConfig {
  try {
    const stored = localStorage.getItem(OTA_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch { /* ignore */ }
  return { currentVersion: "1.0.0", lastChecked: null, autoCheck: true, updates: [] };
}

function saveOTAConfig(config: OTAConfig): void {
  localStorage.setItem(OTA_STORAGE_KEY, JSON.stringify(config));
}

/** Generate HMAC-SHA256 signature for update payload */
async function signPayload(payload: Record<string, unknown>, ownerKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(ownerKey);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const data = encoder.encode(JSON.stringify(payload));
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, data);
  return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, "0")).join("");
}

/** Verify update HMAC signature against owner key */
async function verifySignature(update: OTAUpdate, ownerKey: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(ownerKey);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const data = encoder.encode(JSON.stringify(update.payload));
  const expectedSig = Uint8Array.from(
    (update.signature.match(/.{2}/g) || []).map(b => parseInt(b, 16))
  );
  return crypto.subtle.verify("HMAC", cryptoKey, expectedSig, data);
}

/** Apply a verified OTA update */
function applyUpdate(update: OTAUpdate): void {
  switch (update.type) {
    case "theme": {
      const { primaryColor, accentColor, fontFamily } = update.payload as Record<string, string>;
      if (primaryColor) document.documentElement.style.setProperty("--primary", primaryColor);
      if (accentColor) document.documentElement.style.setProperty("--accent", accentColor);
      if (fontFamily) document.documentElement.style.fontFamily = fontFamily;
      localStorage.setItem("sirou_remote_brand", JSON.stringify(update.payload));
      break;
    }
    case "text": {
      localStorage.setItem("sirou_remote_text", JSON.stringify(update.payload));
      break;
    }
    case "config": {
      const existing = JSON.parse(localStorage.getItem("sirou_remote_config") || "{}");
      localStorage.setItem("sirou_remote_config", JSON.stringify({ ...existing, ...update.payload }));
      break;
    }
    case "feature_flag": {
      const flags = JSON.parse(localStorage.getItem("sirou_feature_flags") || "{}");
      localStorage.setItem("sirou_feature_flags", JSON.stringify({ ...flags, ...update.payload }));
      break;
    }
  }
}

/** Create and sign a new OTA update (owner-only action) */
export async function createOTAUpdate(
  type: OTAUpdate["type"],
  payload: Record<string, unknown>,
  ownerKey: string
): Promise<OTAUpdate> {
  const update: OTAUpdate = {
    id: crypto.randomUUID(),
    version: new Date().toISOString().slice(0, 10).replace(/-/g, "."),
    type,
    payload,
    timestamp: new Date().toISOString(),
    signature: await signPayload(payload, ownerKey),
  };

  const config = getOTAConfig();
  config.updates.unshift(update);
  config.lastChecked = new Date().toISOString();
  saveOTAConfig(config);

  return update;
}

/** Process and apply a pending update after signature verification */
export async function processUpdate(update: OTAUpdate, ownerKey: string): Promise<boolean> {
  const valid = await verifySignature(update, ownerKey);
  if (!valid) return false;
  applyUpdate(update);
  return true;
}

/** Get all pending/applied updates */
export function getUpdateHistory(): OTAUpdate[] {
  return getOTAConfig().updates;
}

/** Get current OTA version */
export function getOTAVersion(): string {
  return getOTAConfig().currentVersion;
}
