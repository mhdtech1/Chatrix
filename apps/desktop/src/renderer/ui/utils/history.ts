import { createId } from "../../utils/chatFormatting";
import { transliterateArabicToEgyptianFranco } from "../../utils/arabicTransliteration";
import type { ChatMessage } from "@chatrix/chat-core";
import type { Platform } from "../../../shared/types.js";
export const RECENT_CHAT_HISTORY_STORAGE_KEY = "chatrix:recent-history:v1";
export const LEGACY_RECENT_CHAT_HISTORY_STORAGE_KEY =
  "multichat:recent-history:v1";
export const RECENT_CHAT_LOOKBACK_MS = 60 * 60 * 1000;
export const RECENT_CHAT_MAX_MESSAGES_PER_SOURCE = 4000;
export const RECENT_CHAT_SAVE_DEBOUNCE_MS = 1200;
export const TWITCH_REMOTE_HISTORY_LIMIT = 200;
export const TWITCH_REMOTE_HISTORY_URL =
  "https://recent-messages.robotty.de/api/v2/recent-messages";

export type HistoryPlatform = "twitch" | "kick";
export type TwitchRemoteHistoryPayload = {
  messages?: string[];
  error_code?: string;
};
export type PersistedRecentHistoryMessage = {
  id: string;
  platform: HistoryPlatform;
  channel: string;
  username: string;
  displayName: string;
  message: string;
  timestamp: string;
  badges?: string[];
  color?: string;
};
export type PersistedRecentHistoryPayload = {
  version: 1;
  savedAt: number;
  bySourceKey: Record<string, PersistedRecentHistoryMessage[]>;
};

export const isHistoryPlatform = (
  platform: Platform,
): platform is HistoryPlatform => platform === "twitch" || platform === "kick";
export const normalizeRecentHistoryMessage = (
  message: ChatMessage,
): ChatMessage => ({
  ...message,
  raw: undefined,
  badges: Array.isArray(message.badges) ? [...message.badges] : undefined,
});
export const toPersistedRecentHistoryMessage = (
  message: ChatMessage,
): PersistedRecentHistoryMessage => ({
  id: message.id,
  platform: message.platform as HistoryPlatform,
  channel: message.channel,
  username: message.username,
  displayName: message.displayName,
  message: message.message,
  timestamp: message.timestamp,
  badges: Array.isArray(message.badges) ? [...message.badges] : undefined,
  color: message.color,
});
export const pruneRecentHistoryMessages = (
  messages: ChatMessage[],
  now = Date.now(),
) => {
  const cutoff = now - RECENT_CHAT_LOOKBACK_MS;
  return messages
    .filter((entry) => {
      const at = Date.parse(entry.timestamp);
      return Number.isFinite(at) && at >= cutoff && at <= now + 120_000;
    })
    .slice(-RECENT_CHAT_MAX_MESSAGES_PER_SOURCE);
};
export const readRecentHistoryPayload = () => {
  try {
    const raw =
      window.localStorage.getItem(RECENT_CHAT_HISTORY_STORAGE_KEY) ??
      window.localStorage.getItem(LEGACY_RECENT_CHAT_HISTORY_STORAGE_KEY);
    if (!raw) return {} as Record<string, ChatMessage[]>;
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object")
      return {} as Record<string, ChatMessage[]>;
    const record = parsed as Partial<PersistedRecentHistoryPayload>;
    if (
      record.version !== 1 ||
      !record.bySourceKey ||
      typeof record.bySourceKey !== "object"
    ) {
      return {} as Record<string, ChatMessage[]>;
    }

    const now = Date.now();
    const bySourceKey: Record<string, ChatMessage[]> = {};
    for (const [sourceKey, entries] of Object.entries(record.bySourceKey)) {
      if (!sourceKey || !Array.isArray(entries)) continue;
      const normalized = entries
        .map((entry): ChatMessage | null => {
          if (!entry || typeof entry !== "object") return null;
          const item = entry as Partial<PersistedRecentHistoryMessage>;
          if (
            (item.platform !== "twitch" && item.platform !== "kick") ||
            !item.timestamp
          )
            return null;
          const id =
            typeof item.id === "string" && item.id.trim()
              ? item.id.trim()
              : `${item.platform}-${createId()}`;
          const channel =
            typeof item.channel === "string" ? item.channel.trim() : "";
          const username =
            typeof item.username === "string" ? item.username.trim() : "";
          const displayName =
            typeof item.displayName === "string"
              ? item.displayName.trim()
              : username;
          const content =
            typeof item.message === "string"
              ? transliterateArabicToEgyptianFranco(item.message)
              : "";
          if (!channel || !displayName || !content) return null;
          return {
            id,
            platform: item.platform,
            channel,
            username: username || displayName,
            displayName,
            message: content,
            timestamp: item.timestamp,
            badges: Array.isArray(item.badges)
              ? item.badges.filter(
                  (badge): badge is string => typeof badge === "string",
                )
              : undefined,
            color: typeof item.color === "string" ? item.color : undefined,
          } satisfies ChatMessage;
        })
        .filter((message): message is ChatMessage => message !== null);
      const pruned = pruneRecentHistoryMessages(normalized, now);
      if (pruned.length > 0) {
        bySourceKey[sourceKey] = pruned;
      }
    }
    return bySourceKey;
  } catch {
    return {} as Record<string, ChatMessage[]>;
  }
};
export const writeRecentHistoryPayload = (
  historyBySourceKey: Record<string, ChatMessage[]>,
) => {
  try {
    const now = Date.now();
    const bySourceKey: Record<string, PersistedRecentHistoryMessage[]> = {};
    for (const [sourceKey, entries] of Object.entries(historyBySourceKey)) {
      if (!sourceKey || !Array.isArray(entries) || entries.length === 0)
        continue;
      const normalized = pruneRecentHistoryMessages(entries, now)
        .filter((entry) => isHistoryPlatform(entry.platform))
        .map((entry) => toPersistedRecentHistoryMessage(entry));
      if (normalized.length > 0) {
        bySourceKey[sourceKey] = normalized;
      }
    }

    const payload: PersistedRecentHistoryPayload = {
      version: 1,
      savedAt: now,
      bySourceKey,
    };
    window.localStorage.setItem(
      RECENT_CHAT_HISTORY_STORAGE_KEY,
      JSON.stringify(payload),
    );
  } catch {
    // no-op: local storage can fail due to quota or user privacy settings.
  }
};
export const fetchJsonSafe = async (
  url: string,
  init?: RequestInit,
): Promise<unknown | null> => {
  try {
    const response = await fetch(url, init);
    if (!response.ok) return null;
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
};
export const MESSAGE_LINK_REGEX = /(?:https?:\/\/|www\.)[^\s<]+/gi;
