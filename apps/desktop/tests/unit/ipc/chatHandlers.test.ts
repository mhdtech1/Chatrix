import { describe, expect, it, vi } from "vitest";
import { IPC_CHANNELS } from "../../../src/shared/constants";
import { createChatHandlers } from "../../../src/main/ipc/chatHandlers";

const createMockSettingsStore = () => {
  const state: Record<string, unknown> = {};
  return {
    set(updates: Record<string, unknown>) {
      Object.assign(state, updates);
    },
    getState() {
      return { ...state };
    },
  };
};

describe("createChatHandlers", () => {
  it("checks moderation capability by platform", async () => {
    const store = createMockSettingsStore();
    const handlers = createChatHandlers({
      store: store as never,
      normalizeLogin: (value) => value.trim().toLowerCase(),
      runModerationAction: vi.fn(),
      canModerateTwitchChannel: vi.fn().mockResolvedValue(true),
      canModerateYouTubeChannel: vi.fn().mockReturnValue(false),
      canModerateKickChannel: vi.fn().mockResolvedValue(false),
      resolveKickChannelLookup: vi.fn(),
      parseKickChatroomId: vi.fn(),
      assertYouTubeAlphaEnabled: vi.fn(),
      resolveYouTubeLiveChat: vi.fn(),
      fetchYouTubeWebLiveMessages: vi.fn(),
      youtubeFetchReadOnly: vi.fn(),
      youtubeFetchWithAuth: vi.fn(),
      fetchJsonOrThrow: vi.fn(),
    });

    const canTwitch = await handlers[IPC_CHANNELS.MODERATION_CAN_MODERATE](
      {} as never,
      { platform: "twitch", channel: "Streamer" } as never,
    );
    const missing = await handlers[IPC_CHANNELS.MODERATION_CAN_MODERATE](
      {} as never,
      {} as never,
    );

    expect(canTwitch).toBe(true);
    expect(missing).toBe(false);
  });

  it("resolves kick chatroom and supports web youtube fetch flow", async () => {
    const store = createMockSettingsStore();
    const fetchYouTubeWebLiveMessages = vi.fn().mockResolvedValue({
      items: [],
      nextPageToken: "next",
    });
    const handlers = createChatHandlers({
      store: store as never,
      normalizeLogin: (value) => value.trim().toLowerCase(),
      runModerationAction: vi.fn(),
      canModerateTwitchChannel: vi.fn(),
      canModerateYouTubeChannel: vi.fn(),
      canModerateKickChannel: vi.fn(),
      resolveKickChannelLookup: vi.fn().mockResolvedValue({
        ok: true,
        message: "",
        payload: { chatroom: { id: 1234 } },
      }),
      parseKickChatroomId: vi.fn().mockReturnValue(1234),
      assertYouTubeAlphaEnabled: vi.fn(),
      resolveYouTubeLiveChat: vi.fn(),
      fetchYouTubeWebLiveMessages,
      youtubeFetchReadOnly: vi.fn(),
      youtubeFetchWithAuth: vi.fn(),
      fetchJsonOrThrow: vi.fn(),
    });

    const kick = await handlers[IPC_CHANNELS.KICK_RESOLVE_CHATROOM](
      {} as never,
      "Streamer" as never,
    );
    const youtube = await handlers[IPC_CHANNELS.YOUTUBE_FETCH_MESSAGES](
      {} as never,
      { liveChatId: "web:abc", pageToken: "pt" } as never,
    );

    expect(kick).toEqual({ chatroomId: 1234 });
    expect(youtube).toEqual({ items: [], nextPageToken: "next" });
    expect(fetchYouTubeWebLiveMessages).toHaveBeenCalledWith({
      liveChatId: "web:abc",
      pageToken: "pt",
    });
  });
});

