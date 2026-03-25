import type { ChatMessage } from "@chatrix/chat-core";
import type { AppSettings } from "../../shared/types";

const normalizeUserKey = (value: string) => value.trim().toLowerCase();
const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
};

export const messageMentionsUser = (
  message: ChatMessage,
  username?: string,
) => {
  const normalizedUsername = (username ?? "").trim().replace(/^@+/, "");
  if (!normalizedUsername) return false;
  if (
    normalizeUserKey(message.username) === normalizeUserKey(normalizedUsername)
  ) {
    return false;
  }

  const text = message.message ?? "";
  if (!text.trim()) return false;

  const escaped = escapeRegExp(normalizedUsername);
  const mentionPattern = new RegExp(`(^|\\W)@?${escaped}(\\W|$)`, "i");
  return mentionPattern.test(text);
};

export const messageRepliesToUser = (
  message: ChatMessage,
  username?: string,
) => {
  const normalizedUsername = normalizeUserKey(
    (username ?? "").replace(/^@+/, ""),
  );
  if (!normalizedUsername) return false;
  if (normalizeUserKey(message.username) === normalizedUsername) return false;

  const raw = asRecord(message.raw);
  if (!raw) return false;

  const directReplyLogin =
    typeof raw["reply-parent-user-login"] === "string"
      ? raw["reply-parent-user-login"]
      : "";
  if (
    directReplyLogin &&
    normalizeUserKey(directReplyLogin) === normalizedUsername
  ) {
    return true;
  }

  const directReplyName =
    typeof raw["reply-parent-display-name"] === "string"
      ? raw["reply-parent-display-name"]
      : "";
  if (
    directReplyName &&
    normalizeUserKey(directReplyName) === normalizedUsername
  ) {
    return true;
  }

  const replyRecord =
    asRecord(raw.reply_to) ?? asRecord(raw.replyTo) ?? asRecord(raw.reply);
  if (!replyRecord) return false;

  for (const field of [
    "username",
    "login",
    "display_name",
    "displayName",
    "name",
  ]) {
    const value = replyRecord[field];
    if (
      typeof value === "string" &&
      normalizeUserKey(value) === normalizedUsername
    ) {
      return true;
    }
  }

  return false;
};

export const isMentionForPlatformUser = (
  message: ChatMessage,
  settings: Pick<AppSettings, "twitchUsername" | "kickUsername">,
) => {
  if (message.platform === "twitch") {
    return messageMentionsUser(message, settings.twitchUsername);
  }
  if (message.platform === "kick") {
    return messageMentionsUser(message, settings.kickUsername);
  }
  return false;
};

export const isReplyForPlatformUser = (
  message: ChatMessage,
  settings: Pick<AppSettings, "twitchUsername" | "kickUsername">,
) => {
  if (message.platform === "twitch") {
    return messageRepliesToUser(message, settings.twitchUsername);
  }
  if (message.platform === "kick") {
    return messageRepliesToUser(message, settings.kickUsername);
  }
  return false;
};
