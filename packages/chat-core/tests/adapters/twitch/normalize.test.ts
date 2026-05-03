import { describe, expect, it } from "vitest";
import {
  normalizeTwitchMessage,
  parseTwitchBadges,
} from "../../../src/adapters/twitch/normalize";
import { parseIrcMessage } from "../../../src/adapters/twitch/ircParser";

describe("normalizeTwitchMessage", () => {
  describe("PRIVMSG", () => {
    it("normalizes standard message with tags", () => {
      const line =
        "@badges=subscriber/3;color=#FF0000;display-name=TestUser;id=msg-123;user-id=12345 " +
        ":testuser!testuser@testuser.tmi.twitch.tv PRIVMSG #channel :Hello world";
      const parsed = parseIrcMessage(line);
      const result = parsed ? normalizeTwitchMessage(parsed) : null;
      expect(result).toMatchObject({
        platform: "twitch",
        channel: "channel",
        username: "testuser",
        displayName: "TestUser",
        message: "Hello world",
        badges: ["subscriber/3"],
        color: "#FF0000",
      });
      expect(result?.id).toBe("msg-123");
    });

    it("handles messages without optional tags", () => {
      const line = ":user!user@user.tmi.twitch.tv PRIVMSG #channel :Hello";
      const parsed = parseIrcMessage(line);
      const result = parsed ? normalizeTwitchMessage(parsed) : null;
      expect(result?.username).toBe("user");
      expect(result?.displayName).toBe("user");
      expect(result?.badges).toEqual([]);
    });

    it("handles messages with emotes", () => {
      const line =
        "@emotes=25:0-4,6-10 :user!user@user.tmi.twitch.tv PRIVMSG #channel :Kappa Kappa";
      const parsed = parseIrcMessage(line);
      const result = parsed ? normalizeTwitchMessage(parsed) : null;
      expect(result?.message).toBe("Kappa Kappa");
    });
  });

  describe("CLEARCHAT", () => {
    it("normalizes timeout event", () => {
      const line =
        "@ban-duration=600;target-user-id=12345 :tmi.twitch.tv CLEARCHAT #channel :targetuser";
      const parsed = parseIrcMessage(line);
      const result = parsed ? normalizeTwitchMessage(parsed) : null;
      expect(result?.raw?.eventType).toBe("timeout");
      expect(result?.raw?.targetUsername).toBe("targetuser");
    });

    it("normalizes ban event without duration", () => {
      const line =
        "@target-user-id=12345 :tmi.twitch.tv CLEARCHAT #channel :targetuser";
      const parsed = parseIrcMessage(line);
      const result = parsed ? normalizeTwitchMessage(parsed) : null;
      expect(result?.raw?.eventType).toBe("ban");
    });
  });

  describe("CLEARMSG", () => {
    it("normalizes message deletion", () => {
      const line =
        "@login=baduser;target-msg-id=deleted-msg-123 :tmi.twitch.tv CLEARMSG #channel :Deleted message";
      const parsed = parseIrcMessage(line);
      const result = parsed ? normalizeTwitchMessage(parsed) : null;
      expect(result?.raw?.eventType).toBe("delete");
      expect(result?.raw?.targetMessageId).toBe("deleted-msg-123");
    });
  });
});

describe("parseTwitchBadges", () => {
  it("handles empty or undefined inputs", () => {
    expect(parseTwitchBadges([])).toEqual([]);
    expect(parseTwitchBadges([], undefined)).toEqual([]);
    expect(parseTwitchBadges([], "")).toEqual([]);
  });

  it("parses badges from badgesArray", () => {
    const result = parseTwitchBadges(["broadcaster/1", "subscriber/0"]);
    expect(result).toEqual([
      { setId: "broadcaster", versionId: "1", key: "broadcaster/1" },
      { setId: "subscriber", versionId: "0", key: "subscriber/0" },
    ]);
  });

  it("parses badges from rawBadgesString", () => {
    const result = parseTwitchBadges([], "premium/1,bits/1000");
    expect(result).toEqual([
      { setId: "premium", versionId: "1", key: "premium/1" },
      { setId: "bits", versionId: "1000", key: "bits/1000" },
    ]);
  });

  it("combines and deduplicates badges from both sources", () => {
    const result = parseTwitchBadges(
      ["broadcaster/1", "subscriber/3"],
      "subscriber/3,premium/1",
    );
    expect(result).toEqual([
      { setId: "broadcaster", versionId: "1", key: "broadcaster/1" },
      { setId: "subscriber", versionId: "3", key: "subscriber/3" },
      { setId: "premium", versionId: "1", key: "premium/1" },
    ]);
  });

  it("trims and lowercases setId, trims versionId", () => {
    const result = parseTwitchBadges([" Broadcaster / 1 "]);
    expect(result).toEqual([
      { setId: "broadcaster", versionId: "1", key: "broadcaster/1" },
    ]);
  });

  it("handles malformed badge strings", () => {
    expect(parseTwitchBadges(["malformed"])).toEqual([]);
    expect(parseTwitchBadges(["/versiononly"])).toEqual([]);
    expect(parseTwitchBadges(["setonly/"])).toEqual([]);
    expect(parseTwitchBadges(["too/many/parts"])).toEqual([
      { setId: "too", versionId: "many", key: "too/many" },
    ]);
  });

  it("ignores non-string values in badgesArray", () => {
    // @ts-expect-error - testing invalid input
    expect(parseTwitchBadges([null, 123, undefined])).toEqual([]);
  });
});
