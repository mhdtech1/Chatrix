import { describe, expect, it } from "vitest";
import { randomToken } from "../../../src/main/utils/crypto";

describe("randomToken", () => {
  it("should return a string", () => {
    const token = randomToken();
    expect(typeof token).toBe("string");
  });

  it("should return a non-empty string by default", () => {
    const token = randomToken();
    expect(token.length).toBeGreaterThan(0);
  });

  it("should return a string of expected length for default (32 bytes)", () => {
    const token = randomToken();
    // 32 bytes base64url should be 43 characters
    expect(token.length).toBe(43);
  });

  it("should return a string of expected length for custom byte count (16 bytes)", () => {
    const token = randomToken(16);
    // 16 bytes base64url should be 22 characters
    expect(token.length).toBe(22);
  });

  it("should return an empty string for 0 bytes", () => {
    const token = randomToken(0);
    expect(token).toBe("");
  });

  it("should generate unique tokens on subsequent calls", () => {
    const token1 = randomToken();
    const token2 = randomToken();
    expect(token1).not.toBe(token2);
  });

  it("should use base64url characters only", () => {
    const token = randomToken(64);
    // base64url: A-Z, a-z, 0-9, -, _
    expect(token).toMatch(/^[A-Za-z0-9\-_]+$/);
  });
});
