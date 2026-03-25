import { describe, expect, it } from "vitest";
import type { ChatMessage } from "@chatrix/chat-core";
import {
  isMentionForPlatformUser,
  isReplyForPlatformUser,
  messageMentionsUser,
  messageRepliesToUser,
} from "../../../src/renderer/utils/mentions";

const makeMessage = (overrides: Partial<ChatMessage> = {}): ChatMessage => ({
  id: "1",
  platform: "twitch",
  channel: "channel",
  username: "other_user",
  displayName: "OtherUser",
  message: "hello",
  timestamp: new Date().toISOString(),
  ...overrides,
});

describe("mentions", () => {
  it("detects mentions without matching the author's own username", () => {
    expect(
      messageMentionsUser(makeMessage({ message: "hey @mazen" }), "mazen"),
    ).toBe(true);
    expect(
      messageMentionsUser(
        makeMessage({ username: "mazen", message: "hey @mazen" }),
        "mazen",
      ),
    ).toBe(false);
  });

  it("detects direct reply metadata", () => {
    expect(
      messageRepliesToUser(
        makeMessage({ raw: { "reply-parent-user-login": "mazen" } }),
        "mazen",
      ),
    ).toBe(true);
  });

  it("uses platform usernames for mention and reply checks", () => {
    const settings = {
      twitchUsername: "mazen",
      kickUsername: "kickmazen",
    };

    expect(
      isMentionForPlatformUser(
        makeMessage({ platform: "twitch", message: "hi @mazen" }),
        settings,
      ),
    ).toBe(true);
    expect(
      isReplyForPlatformUser(
        makeMessage({
          platform: "kick",
          raw: { reply_to: { username: "kickmazen" } },
        }),
        settings,
      ),
    ).toBe(true);
  });
});
