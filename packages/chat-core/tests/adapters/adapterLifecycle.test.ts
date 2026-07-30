/**
 * Regression tests for adapter connect/disconnect lifecycle defects.
 *
 * Each case here failed before the corresponding fix:
 *  - Twitch reconnected after disconnect(), leaving an ownerless socket.
 *  - YouTube re-polled at a fixed interval forever once it started failing.
 *  - YouTube/TikTok connect() left status pinned on "connecting" when the
 *    underlying call threw.
 *  - onMessage/onStatus had no way to detach a handler.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TwitchAdapter } from "../../src/adapters/twitch/twitchAdapter";
import { YouTubeAdapter } from "../../src/adapters/youtube/youtubeAdapter";
import { TikTokAdapter } from "../../src/adapters/tiktok/tiktokAdapter";
import { MockWebSocket } from "../helpers/mockWebSocket";
import type { ChatAdapterStatus, ChatMessage } from "../../src/types";

describe("TwitchAdapter reconnect cancellation", () => {
  beforeEach(() => {
    MockWebSocket.reset();
    vi.useFakeTimers();
    vi.stubGlobal("WebSocket", MockWebSocket as unknown as typeof WebSocket);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("does not open a new socket when disconnect() lands mid-backoff", async () => {
    const adapter = new TwitchAdapter({ channel: "mychannel" });
    await adapter.connect();
    const socket = MockWebSocket.instances[0];
    socket.emit("open", {});
    expect(MockWebSocket.instances).toHaveLength(1);

    // Network drop: the close handler arms a reconnect timer.
    socket.emit("close", {});

    // The user closes the tab while that backoff is still pending.
    await adapter.disconnect();

    // Well past the longest backoff (30s ceiling).
    vi.advanceTimersByTime(120000);

    expect(MockWebSocket.instances).toHaveLength(1);
  });

  it("still reconnects after an unattended drop", async () => {
    const adapter = new TwitchAdapter({ channel: "mychannel" });
    await adapter.connect();
    const socket = MockWebSocket.instances[0];
    socket.emit("open", {});

    socket.emit("close", {});
    vi.advanceTimersByTime(120000);

    expect(MockWebSocket.instances.length).toBeGreaterThan(1);
    await adapter.disconnect();
  });
});

describe("YouTubeAdapter polling failures", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("backs off exponentially instead of re-polling at a fixed rate", async () => {
    const fetchMessages = vi
      .fn()
      .mockResolvedValueOnce({ pollingIntervalMillis: 1000, items: [] })
      .mockRejectedValue(new Error("stream is over"));

    const adapter = new YouTubeAdapter({
      channel: "mychannel",
      auth: { liveChatId: "live_1" },
      transport: { fetchMessages },
    });
    await adapter.connect();
    expect(fetchMessages).toHaveBeenCalledTimes(1);

    // The scheduled poll fires at the base interval and fails.
    await vi.advanceTimersByTimeAsync(1000);
    expect(fetchMessages).toHaveBeenCalledTimes(2);

    // After one failure the retry is pushed out to 2x, so another base
    // interval is not enough on its own.
    await vi.advanceTimersByTimeAsync(1000);
    expect(fetchMessages).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(1000);
    expect(fetchMessages).toHaveBeenCalledTimes(3);

    // After two failures it doubles again, to 4x.
    await vi.advanceTimersByTimeAsync(2000);
    expect(fetchMessages).toHaveBeenCalledTimes(3);
    await vi.advanceTimersByTimeAsync(2000);
    expect(fetchMessages).toHaveBeenCalledTimes(4);

    await adapter.disconnect();
  });

  it("resets the backoff once a poll succeeds", async () => {
    const fetchMessages = vi
      .fn()
      .mockResolvedValueOnce({ pollingIntervalMillis: 1000, items: [] })
      .mockRejectedValueOnce(new Error("blip"))
      .mockRejectedValueOnce(new Error("blip"))
      .mockResolvedValue({ pollingIntervalMillis: 1000, items: [] });

    const adapter = new YouTubeAdapter({
      channel: "mychannel",
      auth: { liveChatId: "live_1" },
      transport: { fetchMessages },
    });
    await adapter.connect();

    await vi.advanceTimersByTimeAsync(1000); // poll 2: failure 1 -> next in 2000
    await vi.advanceTimersByTimeAsync(2000); // poll 3: failure 2 -> next in 4000
    await vi.advanceTimersByTimeAsync(4000); // poll 4: success -> resets
    expect(fetchMessages).toHaveBeenCalledTimes(4);

    // Back to the base interval now that it has recovered.
    await vi.advanceTimersByTimeAsync(1000);
    expect(fetchMessages).toHaveBeenCalledTimes(5);

    await adapter.disconnect();
  });

  it("reports error rather than staying on connecting when the first fetch throws", async () => {
    const adapter = new YouTubeAdapter({
      channel: "mychannel",
      auth: { liveChatId: "live_1" },
      transport: {
        fetchMessages: vi.fn().mockRejectedValue(new Error("boom")),
      },
    });
    const statuses: ChatAdapterStatus[] = [];
    adapter.onStatus((status) => statuses.push(status));

    await expect(adapter.connect()).rejects.toThrow("boom");

    expect(statuses.at(-1)).toBe("error");
  });
});

describe("TikTokAdapter connect failure", () => {
  it("reports error rather than staying on connecting when the transport rejects", async () => {
    const adapter = new TikTokAdapter({
      channel: "testchannel",
      transport: {
        connect: vi.fn().mockRejectedValue(new Error("no such room")),
        disconnect: vi.fn().mockResolvedValue(undefined),
        onEvent: vi.fn(() => () => {}),
      },
    });
    const statuses: ChatAdapterStatus[] = [];
    adapter.onStatus((status) => statuses.push(status));

    await expect(adapter.connect()).rejects.toThrow("no such room");

    expect(statuses).toContain("connecting");
    expect(statuses.at(-1)).toBe("error");
  });
});

describe("adapter handler unsubscribe", () => {
  beforeEach(() => {
    MockWebSocket.reset();
    vi.stubGlobal("WebSocket", MockWebSocket as unknown as typeof WebSocket);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("stops delivering messages after the returned unsubscribe is called", async () => {
    const adapter = new TwitchAdapter({ channel: "mychannel" });
    const messages: ChatMessage[] = [];
    const unsubscribe = adapter.onMessage((message) => messages.push(message));

    await adapter.connect();
    const socket = MockWebSocket.instances[0];
    socket.emit("open", {});

    const line =
      "@display-name=TestUser;id=m1;tmi-sent-ts=1710000000000 " +
      ":testuser!testuser@testuser.tmi.twitch.tv PRIVMSG #mychannel :first\r\n";
    socket.emit("message", { data: line });
    expect(messages).toHaveLength(1);

    unsubscribe();

    socket.emit("message", { data: line.replace(":first", ":second") });
    expect(messages).toHaveLength(1);

    await adapter.disconnect();
  });

  it("stops delivering status changes after unsubscribe", async () => {
    const adapter = new TwitchAdapter({ channel: "mychannel" });
    const statuses: ChatAdapterStatus[] = [];
    const unsubscribe = adapter.onStatus((status) => statuses.push(status));

    await adapter.connect();
    const seen = statuses.length;
    expect(seen).toBeGreaterThan(0);

    unsubscribe();
    await adapter.disconnect();

    expect(statuses).toHaveLength(seen);
  });
});
