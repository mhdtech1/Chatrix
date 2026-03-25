import { beforeEach, describe, expect, it } from "vitest";
import { useChatSessionStore } from "../../../src/renderer/store/chatSessionStore";

describe("useChatSessionStore", () => {
  beforeEach(() => {
    useChatSessionStore.getState().resetChatSessionState("stable");
  });

  it("updates session collections with functional updaters", () => {
    useChatSessionStore.getState().setMentionInbox((previous) => [
      ...previous,
      {
        id: "mention-1",
        sourceId: "source-1",
        tabId: "tab-1",
        reason: "mention",
        platform: "twitch",
        channel: "demo",
        displayName: "Demo User",
        message: "hello",
        timestamp: new Date(0).toISOString(),
      },
    ]);
    useChatSessionStore.getState().setModerationHistory((previous) => [
      ...previous,
      {
        id: "mod-1",
        at: 1,
        action: "ban",
        target: "demo-user",
        source: "twitch/demo",
        ok: true,
      },
    ]);

    const state = useChatSessionStore.getState();
    expect(state.mentionInbox).toHaveLength(1);
    expect(state.moderationHistory).toHaveLength(1);
  });

  it("resets update status and session data", () => {
    useChatSessionStore.getState().setUpdateStatus({
      state: "available",
      message: "Update ready",
      channel: "beta",
      currentVersion: "1.0.0",
      availableVersion: "1.0.1",
    });
    useChatSessionStore.getState().setMentionInbox([
      {
        id: "mention-1",
        sourceId: "source-1",
        tabId: "tab-1",
        reason: "reply",
        platform: "kick",
        channel: "demo",
        displayName: "Demo User",
        message: "ping",
        timestamp: new Date(0).toISOString(),
      },
    ]);

    useChatSessionStore.getState().resetChatSessionState("beta");

    const state = useChatSessionStore.getState();
    expect(state.updateStatus).toEqual({
      state: "idle",
      message: "",
      channel: "beta",
      currentVersion: "unknown",
    });
    expect(state.mentionInbox).toEqual([]);
    expect(state.moderationHistory).toEqual([]);
  });
});
