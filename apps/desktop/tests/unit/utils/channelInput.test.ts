import { describe, expect, it } from "vitest";
import { parseChannelInput } from "../../../src/renderer/utils/channelInput";

describe("parseChannelInput", () => {
  it("detects Twitch and Kick channel URLs", () => {
    expect(parseChannelInput("twitch.tv/MazenLive", "kick")).toEqual({
      platform: "twitch",
      channel: "mazenlive",
      detected: true,
    });
    expect(
      parseChannelInput("https://kick.com/Some-Creator/about", "twitch"),
    ).toEqual({
      platform: "kick",
      channel: "some-creator",
      detected: true,
    });
  });

  it("detects YouTube video, handle, and channel URLs", () => {
    expect(
      parseChannelInput(
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "twitch",
      ),
    ).toEqual({
      platform: "youtube",
      channel: "dQw4w9WgXcQ",
      detected: true,
    });
    expect(parseChannelInput("youtube.com/@Chatrix/live", "twitch")).toEqual({
      platform: "youtube",
      channel: "Chatrix",
      detected: true,
    });
    expect(
      parseChannelInput("https://youtube.com/channel/UCabc123/live", "twitch"),
    ).toEqual({
      platform: "youtube",
      channel: "UCabc123",
      detected: true,
    });
  });

  it("detects TikTok profile live URLs", () => {
    expect(
      parseChannelInput("https://www.tiktok.com/@Creator/live", "twitch"),
    ).toEqual({
      platform: "tiktok",
      channel: "creator",
      detected: true,
    });
  });

  it("treats bare usernames as ambiguous and uses the fallback platform", () => {
    expect(parseChannelInput("@MazenLive", "twitch")).toEqual({
      platform: "twitch",
      channel: "mazenlive",
      detected: false,
    });
    expect(parseChannelInput("@Creator", "youtube")).toEqual({
      platform: "youtube",
      channel: "Creator",
      detected: false,
    });
  });
});
