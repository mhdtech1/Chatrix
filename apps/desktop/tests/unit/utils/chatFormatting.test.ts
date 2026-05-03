import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  formatOptionalDateTime,
  formatOptionalExpiry,
  normalizeUserKey,
  clampChatTextScale,
  CHAT_TEXT_SCALE_DEFAULT,
  CHAT_TEXT_SCALE_MIN,
  CHAT_TEXT_SCALE_MAX,
  createId,
  platformIconGlyph,
  platformDisplayName,
} from "../../../src/renderer/utils/chatFormatting";

describe("chatFormatting utilities", () => {
  describe("formatOptionalDateTime", () => {
    it("returns 'n/a' for falsy values", () => {
      expect(formatOptionalDateTime(undefined)).toBe("n/a");
      expect(formatOptionalDateTime("")).toBe("n/a");
    });

    it("returns 'n/a' for invalid dates", () => {
      expect(formatOptionalDateTime("not-a-date")).toBe("n/a");
    });

    it("formats a valid date string correctly", () => {
      const validDateString = "2023-01-01T12:00:00Z";
      const expected = new Date(validDateString).toLocaleString();
      expect(formatOptionalDateTime(validDateString)).toBe(expected);
    });
  });

  describe("formatOptionalExpiry", () => {
    beforeEach(() => {
      vi.useFakeTimers();
      // Set a fixed current time: 2023-01-01T12:00:00.000Z
      vi.setSystemTime(new Date("2023-01-01T12:00:00Z"));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("returns 'unknown' for falsy or invalid values", () => {
      expect(formatOptionalExpiry(undefined)).toBe("unknown");
      expect(formatOptionalExpiry(null)).toBe("unknown");
      expect(formatOptionalExpiry(0)).toBe("unknown");
      expect(formatOptionalExpiry(NaN)).toBe("unknown");
    });

    it("returns expired text for times in the past", () => {
      const pastTime = new Date("2023-01-01T11:00:00Z").getTime();
      const pastDate = new Date(pastTime);
      expect(formatOptionalExpiry(pastTime)).toBe(
        `${pastDate.toLocaleString()} (expired)`,
      );
    });

    it("returns time left for times in the future", () => {
      // 5 minutes in the future
      const futureTime = new Date("2023-01-01T12:05:00Z").getTime();
      const futureDate = new Date(futureTime);
      expect(formatOptionalExpiry(futureTime)).toBe(
        `${futureDate.toLocaleString()} (5m left)`,
      );
    });

    it("returns expired for exactly current time", () => {
      const now = Date.now();
      const nowDate = new Date(now);
      expect(formatOptionalExpiry(now)).toBe(
        `${nowDate.toLocaleString()} (expired)`,
      );
    });
  });

  describe("normalizeUserKey", () => {
    it("trims and lowers cases", () => {
      expect(normalizeUserKey("  User_Name  ")).toBe("user_name");
      expect(normalizeUserKey("UPPERCASE")).toBe("uppercase");
    });
  });

  describe("clampChatTextScale", () => {
    it("returns default for non-finite values", () => {
      expect(clampChatTextScale(NaN)).toBe(CHAT_TEXT_SCALE_DEFAULT);
      expect(clampChatTextScale(Infinity)).toBe(CHAT_TEXT_SCALE_DEFAULT);
    });

    it("clamps values within min and max", () => {
      expect(clampChatTextScale(50)).toBe(CHAT_TEXT_SCALE_MIN);
      expect(clampChatTextScale(200)).toBe(CHAT_TEXT_SCALE_MAX);
      expect(clampChatTextScale(100)).toBe(100);
      expect(clampChatTextScale(120)).toBe(120);
    });

    it("rounds the value", () => {
      expect(clampChatTextScale(100.4)).toBe(100);
      expect(clampChatTextScale(100.6)).toBe(101);
    });
  });

  describe("createId", () => {
    beforeEach(() => {
      // globalThis.crypto is needed for secureRandomHex
      if (!globalThis.crypto) {
        // Mock crypto.getRandomValues
        globalThis.crypto = {
          getRandomValues: (arr: Uint8Array) => {
            for (let i = 0; i < arr.length; i++) {
              arr[i] = Math.floor(Math.random() * 256);
            }
            return arr;
          },
        } as any;
      }
    });

    it("returns a string with correct format", () => {
      const id = createId();
      expect(typeof id).toBe("string");
      expect(id).toMatch(/^[0-9a-z]+-[0-9a-f]{6}$/);
    });
  });

  describe("platformIconGlyph", () => {
    it("returns correct glyphs", () => {
      expect(platformIconGlyph("twitch")).toBe("TW");
      expect(platformIconGlyph("kick")).toBe("KI");
      expect(platformIconGlyph("youtube")).toBe("YT");
      expect(platformIconGlyph("tiktok")).toBe("TT");
    });

    it("handles whitespace and casing", () => {
      expect(platformIconGlyph("  Twitch  ")).toBe("TW");
    });

    it("returns ? for unknown platforms", () => {
      expect(platformIconGlyph("unknown")).toBe("?");
    });
  });

  describe("platformDisplayName", () => {
    it("capitalizes known platforms", () => {
      expect(platformDisplayName("twitch")).toBe("Twitch");
      expect(platformDisplayName("kick")).toBe("Kick");
      expect(platformDisplayName("youtube")).toBe("Youtube");
      expect(platformDisplayName("tiktok")).toBe("Tiktok");
    });

    it("handles whitespace and casing", () => {
      expect(platformDisplayName("  tWiTcH  ")).toBe("Twitch");
    });

    it("returns raw string for unknown platforms", () => {
      expect(platformDisplayName("unknown")).toBe("unknown");
    });
  });
});
