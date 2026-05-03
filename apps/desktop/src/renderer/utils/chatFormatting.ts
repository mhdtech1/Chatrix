/**
 * Pure formatting and normalization helpers extracted from ChatShell.tsx
 * during Phase 3 of the UI overhaul. No React, no closures over component
 * state — everything in here is safe to import anywhere.
 *
 * As more pure helpers get extracted from ChatShell.tsx (badge resolution,
 * message-event readers, sanitizers), they should land here or in a
 * sibling file rather than back in the layout.
 */

export const CHAT_TEXT_SCALE_DEFAULT = 100;
export const CHAT_TEXT_SCALE_MIN = 80;
export const CHAT_TEXT_SCALE_MAX = 175;

export const normalizeUserKey = (value: string) => value.trim().toLowerCase();

export const clampChatTextScale = (value: number) => {
  if (!Number.isFinite(value)) return CHAT_TEXT_SCALE_DEFAULT;
  return Math.max(
    CHAT_TEXT_SCALE_MIN,
    Math.min(CHAT_TEXT_SCALE_MAX, Math.round(value)),
  );
};

export const formatOptionalDateTime = (value?: string) => {
  if (!value) return "n/a";
  const asDate = new Date(value);
  if (Number.isNaN(asDate.getTime())) return "n/a";
  return asDate.toLocaleString();
};

export const formatOptionalExpiry = (value: number | null | undefined) => {
  if (!value) return "unknown";
  const asDate = new Date(value);
  if (Number.isNaN(asDate.getTime())) return "unknown";
  const minutes = Math.round((value - Date.now()) / 60_000);
  if (minutes <= 0) return `${asDate.toLocaleString()} (expired)`;
  return `${asDate.toLocaleString()} (${minutes}m left)`;
};

const secureRandomHex = (length: number) => {
  const bytes = new Uint8Array(Math.ceil(length / 2));
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, length);
};

export const createId = () =>
  `${Date.now().toString(36)}-${secureRandomHex(6)}`;

export const platformIconGlyph = (platform: string) => {
  const value = platform.trim().toLowerCase();
  if (value === "twitch") return "TW";
  if (value === "kick") return "KI";
  if (value === "youtube") return "YT";
  if (value === "tiktok") return "TT";
  return "?";
};

export const platformDisplayName = (platform: string) => {
  const normalized = platform.trim().toLowerCase();
  if (
    normalized === "twitch" ||
    normalized === "kick" ||
    normalized === "youtube" ||
    normalized === "tiktok"
  ) {
    return normalized[0].toUpperCase() + normalized.slice(1);
  }
  return platform;
};
