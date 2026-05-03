import type { Platform } from "../../shared/types";

export type ParsedChannelInput = {
  platform: Platform;
  channel: string;
  detected: boolean;
};

const PLATFORM_HOSTS: Record<Platform, string[]> = {
  twitch: ["twitch.tv", "www.twitch.tv", "m.twitch.tv"],
  kick: ["kick.com", "www.kick.com"],
  youtube: [
    "youtube.com",
    "www.youtube.com",
    "m.youtube.com",
    "music.youtube.com",
    "youtu.be",
  ],
  tiktok: ["tiktok.com", "www.tiktok.com", "m.tiktok.com"],
};

const RESERVED_TWITCH_PATHS = new Set([
  "directory",
  "downloads",
  "jobs",
  "p",
  "settings",
  "store",
  "team",
  "turbo",
  "videos",
]);

const RESERVED_KICK_PATHS = new Set([
  "about",
  "categories",
  "community-guidelines",
  "dmca",
  "terms",
  "video",
]);

const stripDecorators = (value: string) =>
  value
    .trim()
    .replace(/^[@#]+/, "")
    .replace(/\/+$/, "");

const cleanPastedInput = (value: string) =>
  value
    .trim()
    .replace(/^<+/, "")
    .replace(/[>),.]+$/, "");

const firstPathSegment = (url: URL) => {
  const [segment = ""] = url.pathname.split("/").filter(Boolean);
  return decodeURIComponent(segment);
};

const matchesHost = (host: string, platform: Platform) =>
  PLATFORM_HOSTS[platform].includes(host);

const asUrl = (input: string): URL | null => {
  const cleaned = cleanPastedInput(input);
  if (!cleaned || /\s/.test(cleaned)) return null;

  try {
    return new URL(cleaned);
  } catch {
    if (!/^[A-Za-z0-9.-]+\.[A-Za-z]{2,}(?:[/:?#]|$)/.test(cleaned)) {
      return null;
    }
    try {
      return new URL(`https://${cleaned}`);
    } catch {
      return null;
    }
  }
};

const parseTwitchUrl = (url: URL): string => {
  const channel = stripDecorators(firstPathSegment(url)).toLowerCase();
  if (!channel || RESERVED_TWITCH_PATHS.has(channel)) return "";
  return channel;
};

const parseKickUrl = (url: URL): string => {
  const channel = stripDecorators(firstPathSegment(url)).toLowerCase();
  if (!channel || RESERVED_KICK_PATHS.has(channel)) return "";
  return channel;
};

const parseYouTubeUrl = (url: URL): string => {
  const host = url.hostname.toLowerCase();
  if (host === "youtu.be") {
    return stripDecorators(firstPathSegment(url));
  }

  const watchId = url.searchParams.get("v")?.trim() ?? "";
  if (watchId) return watchId;

  const parts = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
  const [kind, value] = parts;
  if ((kind === "channel" || kind === "c" || kind === "user") && value) {
    return stripDecorators(value);
  }
  if ((kind === "live" || kind === "shorts") && value) {
    return stripDecorators(value);
  }
  if (kind?.startsWith("@")) {
    return stripDecorators(kind);
  }
  return "";
};

const parseTikTokUrl = (url: URL): string => {
  const channel = stripDecorators(firstPathSegment(url)).toLowerCase();
  return channel || "";
};

const parseKnownUrl = (url: URL): ParsedChannelInput | null => {
  const host = url.hostname.toLowerCase();
  if (matchesHost(host, "twitch")) {
    const channel = parseTwitchUrl(url);
    return channel ? { platform: "twitch", channel, detected: true } : null;
  }
  if (matchesHost(host, "kick")) {
    const channel = parseKickUrl(url);
    return channel ? { platform: "kick", channel, detected: true } : null;
  }
  if (matchesHost(host, "youtube")) {
    const channel = parseYouTubeUrl(url);
    return channel ? { platform: "youtube", channel, detected: true } : null;
  }
  if (matchesHost(host, "tiktok")) {
    const channel = parseTikTokUrl(url);
    return channel ? { platform: "tiktok", channel, detected: true } : null;
  }
  return null;
};

const normalizeUsername = (input: string, platform: Platform) => {
  const cleaned = cleanPastedInput(input);
  const stripped = stripDecorators(cleaned).split(/[?#]/)[0] ?? "";
  if (platform === "youtube") return stripped;
  return stripped.toLowerCase();
};

export const parseChannelInput = (
  input: string,
  fallbackPlatform: Platform,
): ParsedChannelInput => {
  const trimmed = input.trim();
  if (!trimmed) {
    return { platform: fallbackPlatform, channel: "", detected: false };
  }

  const url = asUrl(trimmed);
  const parsedUrl = url ? parseKnownUrl(url) : null;
  if (parsedUrl) return parsedUrl;

  return {
    platform: fallbackPlatform,
    channel: normalizeUsername(trimmed, fallbackPlatform),
    detected: false,
  };
};
