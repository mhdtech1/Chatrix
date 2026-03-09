import { IPC_CHANNELS } from "../../shared/constants.js";
import type { ModerationRequest } from "../../shared/types.js";
import type { JsonSettingsStore } from "../services/settingsStore.js";
import type { IpcHandlerRegistry } from "./handlers.js";

type ChannelPlatform = "twitch" | "kick" | "youtube" | "tiktok";

type KickChannelLookup = {
  ok: boolean;
  message: string;
  payload: unknown;
};

type YouTubeLiveChatResolution = {
  liveChatId: string;
  channelId: string;
  channelTitle: string;
  videoId: string;
};

type CreateChatHandlersOptions = {
  store: JsonSettingsStore;
  normalizeLogin: (input: string) => string;
  runModerationAction: (payload: ModerationRequest) => Promise<void>;
  canModerateTwitchChannel: (channel: string) => Promise<boolean>;
  canModerateYouTubeChannel: (channel: string) => boolean;
  canModerateKickChannel: (channel: string) => Promise<boolean>;
  resolveKickChannelLookup: (slug: string) => Promise<KickChannelLookup>;
  parseKickChatroomId: (payload: unknown) => number | null;
  assertYouTubeAlphaEnabled: () => void;
  resolveYouTubeLiveChat: (input: string) => Promise<YouTubeLiveChatResolution>;
  fetchYouTubeWebLiveMessages: (payload: {
    liveChatId: string;
    pageToken?: string;
  }) => Promise<{
    nextPageToken?: string;
    pollingIntervalMillis?: number;
    items?: unknown[];
  }>;
  youtubeFetchReadOnly: (url: URL) => Promise<Response>;
  youtubeFetchWithAuth: (url: URL, init?: RequestInit) => Promise<Response>;
  fetchJsonOrThrow: <T>(response: Response, source: string) => Promise<T>;
};

export function createChatHandlers(
  options: CreateChatHandlersOptions,
): IpcHandlerRegistry {
  const {
    store,
    normalizeLogin,
    runModerationAction,
    canModerateTwitchChannel,
    canModerateYouTubeChannel,
    canModerateKickChannel,
    resolveKickChannelLookup,
    parseKickChatroomId,
    assertYouTubeAlphaEnabled,
    resolveYouTubeLiveChat,
    fetchYouTubeWebLiveMessages,
    youtubeFetchReadOnly,
    youtubeFetchWithAuth,
    fetchJsonOrThrow,
  } = options;

  return {
    [IPC_CHANNELS.MODERATION_ACT]: async (_event, payload: unknown) => {
      const input = (payload ?? {}) as ModerationRequest;
      const platform = input.platform;
      const channel = normalizeLogin(input.channel ?? "");
      const action = input.action;
      if (!platform) {
        throw new Error("Moderation platform is required.");
      }
      if (!channel) {
        throw new Error("Moderation channel is required.");
      }
      if (!action) {
        throw new Error("Moderation action is required.");
      }
      await runModerationAction({
        ...input,
        platform,
        channel,
        action,
      });
    },
    [IPC_CHANNELS.MODERATION_CAN_MODERATE]: async (
      _event,
      payload: unknown,
    ) => {
      const input = (payload ?? {}) as {
        platform?: ChannelPlatform;
        channel?: string;
      };
      const platform = input.platform;
      const channel = normalizeLogin(input.channel ?? "");
      if (!platform || !channel) return false;

      if (platform === "twitch") {
        try {
          return await canModerateTwitchChannel(channel);
        } catch {
          return false;
        }
      }

      if (platform === "youtube") {
        try {
          return canModerateYouTubeChannel(channel);
        } catch {
          return false;
        }
      }

      if (platform === "tiktok") {
        return false;
      }

      try {
        return await canModerateKickChannel(channel);
      } catch {
        return false;
      }
    },
    [IPC_CHANNELS.KICK_RESOLVE_CHATROOM]: async (_event, channel: unknown) => {
      const slug =
        typeof channel === "string" ? channel.trim().toLowerCase() : "";
      if (!slug) {
        throw new Error("Kick channel is required.");
      }

      const lookup = await resolveKickChannelLookup(slug);
      if (!lookup.ok) {
        throw new Error(lookup.message);
      }

      const chatroomId = parseKickChatroomId(lookup.payload);
      if (!chatroomId) {
        throw new Error("Kick chatroom id not found for this channel.");
      }
      return { chatroomId };
    },
    [IPC_CHANNELS.YOUTUBE_RESOLVE_LIVE_CHAT]: async (
      _event,
      channel: unknown,
    ) => {
      assertYouTubeAlphaEnabled();
      const input = typeof channel === "string" ? channel.trim() : "";
      if (!input) {
        throw new Error("YouTube channel is required.");
      }
      const resolved = await resolveYouTubeLiveChat(input);
      store.set({
        youtubeLiveChatId: resolved.liveChatId,
      });
      return resolved;
    },
    [IPC_CHANNELS.YOUTUBE_FETCH_MESSAGES]: async (_event, payload: unknown) => {
      assertYouTubeAlphaEnabled();
      const request = (payload ?? {}) as {
        liveChatId?: string;
        pageToken?: string;
      };
      const liveChatId = request.liveChatId?.trim();
      if (!liveChatId) {
        throw new Error("YouTube live chat id is required.");
      }
      if (liveChatId.startsWith("web:")) {
        return fetchYouTubeWebLiveMessages({
          liveChatId,
          pageToken: request.pageToken?.trim() || undefined,
        });
      }
      const requestUrl = new URL(
        "https://www.googleapis.com/youtube/v3/liveChat/messages",
      );
      requestUrl.searchParams.set("part", "id,snippet,authorDetails");
      requestUrl.searchParams.set("liveChatId", liveChatId);
      requestUrl.searchParams.set("maxResults", "200");
      const pageToken = request.pageToken?.trim();
      if (pageToken) {
        requestUrl.searchParams.set("pageToken", pageToken);
      }

      const response = await youtubeFetchReadOnly(requestUrl);
      const data = await fetchJsonOrThrow<{
        nextPageToken?: string;
        pollingIntervalMillis?: number;
        items?: unknown[];
      }>(response, "YouTube live chat messages");

      return {
        nextPageToken: data.nextPageToken,
        pollingIntervalMillis: data.pollingIntervalMillis,
        items: Array.isArray(data.items) ? data.items : [],
      };
    },
    [IPC_CHANNELS.YOUTUBE_SEND_MESSAGE]: async (_event, payload: unknown) => {
      assertYouTubeAlphaEnabled();
      const request = (payload ?? {}) as {
        liveChatId?: string;
        message?: string;
      };
      const liveChatId = request.liveChatId?.trim();
      const message = request.message?.trim();
      if (!liveChatId) {
        throw new Error("YouTube live chat id is required.");
      }
      if (!message) {
        throw new Error("Message cannot be empty.");
      }
      if (liveChatId.startsWith("web:")) {
        throw new Error(
          "YouTube web read-only sessions do not support sending messages.",
        );
      }

      const endpoint = new URL(
        "https://www.googleapis.com/youtube/v3/liveChat/messages",
      );
      endpoint.searchParams.set("part", "snippet");

      const response = await youtubeFetchWithAuth(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          snippet: {
            liveChatId,
            type: "textMessageEvent",
            textMessageDetails: {
              messageText: message,
            },
          },
        }),
      });
      await fetchJsonOrThrow<unknown>(response, "YouTube send message");
    },
  };
}
