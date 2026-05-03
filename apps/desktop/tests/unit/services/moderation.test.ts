import { describe, expect, it } from "vitest";
import { assertModerationPayload } from "../../../src/main/services/moderation";
import type { ModerationRequest } from "../../../src/shared/types";

describe("assertModerationPayload", () => {
  it("should not throw when all required fields are present", () => {
    const payload: ModerationRequest = {
      platform: "twitch",
      channel: "test-channel",
      action: "ban",
    };
    expect(() => assertModerationPayload(payload)).not.toThrow();
  });

  it("should throw when platform is missing", () => {
    const payload: ModerationRequest = {
      channel: "test-channel",
      action: "ban",
    };
    expect(() => assertModerationPayload(payload)).toThrow("Moderation platform is required.");
  });

  it("should throw when channel is missing", () => {
    const payload: ModerationRequest = {
      platform: "twitch",
      action: "ban",
    };
    expect(() => assertModerationPayload(payload)).toThrow("Moderation channel is required.");
  });

  it("should throw when action is missing", () => {
    const payload: ModerationRequest = {
      platform: "twitch",
      channel: "test-channel",
    };
    expect(() => assertModerationPayload(payload)).toThrow("Moderation action is required.");
  });

  it("should throw when payload is empty", () => {
    const payload: ModerationRequest = {};
    expect(() => assertModerationPayload(payload)).toThrow("Moderation platform is required.");
  });
});
