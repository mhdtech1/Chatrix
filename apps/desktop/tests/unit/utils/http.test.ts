import { describe, expect, it } from "vitest";
import { fetchJsonOrThrow } from "../../../src/main/utils/http.js";

function createMockResponse(
  body: string,
  options: { ok?: boolean; status?: number } = {},
): Response {
  return {
    ok: options.ok ?? true,
    status: options.status ?? 200,
    text: () => Promise.resolve(body),
  } as unknown as Response;
}

describe("fetchJsonOrThrow", () => {
  it("returns parsed JSON when response is ok", async () => {
    const response = createMockResponse('{"foo":"bar"}');
    const result = await fetchJsonOrThrow(response, "test");
    expect(result).toEqual({ foo: "bar" });
  });

  it("returns empty object when response is ok and body is empty", async () => {
    const response = createMockResponse("");
    const result = await fetchJsonOrThrow(response, "test");
    expect(result).toEqual({});
  });

  it("returns empty object when response is ok and body is invalid JSON", async () => {
    const response = createMockResponse("invalid json");
    const result = await fetchJsonOrThrow(response, "test");
    expect(result).toEqual({});
  });

  describe("when response is not ok", () => {
    it("throws with payload.message if available", async () => {
      const response = createMockResponse('{"message":"custom error message"}', {
        ok: false,
      });
      await expect(fetchJsonOrThrow(response, "test")).rejects.toThrow(
        "custom error message",
      );
    });

    it("throws with nested error.message if available", async () => {
      const response = createMockResponse(
        '{"error":{"message":"nested custom error"}}',
        { ok: false },
      );
      await expect(fetchJsonOrThrow(response, "test")).rejects.toThrow(
        "nested custom error",
      );
    });

    it("throws with payload.error_description if available", async () => {
      const response = createMockResponse(
        '{"error_description":"description error"}',
        { ok: false },
      );
      await expect(fetchJsonOrThrow(response, "test")).rejects.toThrow(
        "description error",
      );
    });

    it("throws with explicit payload.error string if available", async () => {
      const response = createMockResponse('{"error":"string error"}', {
        ok: false,
      });
      await expect(fetchJsonOrThrow(response, "test")).rejects.toThrow(
        "string error",
      );
    });

    it("throws with explicit payload.error from array if available", async () => {
      const response = createMockResponse('{"error":["", "array error"]}', {
        ok: false,
      });
      await expect(fetchJsonOrThrow(response, "test")).rejects.toThrow(
        "array error",
      );
    });

    it("throws with explicit top level errors string if available", async () => {
      const response = createMockResponse(
        '{"errors":"top level string error"}',
        { ok: false },
      );
      await expect(fetchJsonOrThrow(response, "test")).rejects.toThrow(
        "top level string error",
      );
    });

    it("throws with explicit top level errors from array if available", async () => {
      const response = createMockResponse(
        '{"errors":["", "top level array error"]}',
        { ok: false },
      );
      await expect(fetchJsonOrThrow(response, "test")).rejects.toThrow(
        "top level array error",
      );
    });

    it("throws with raw text if no standard fields are found", async () => {
      const response = createMockResponse("Just some raw error text", {
        ok: false,
      });
      await expect(fetchJsonOrThrow(response, "test")).rejects.toThrow(
        "Just some raw error text",
      );
    });

    it("truncates raw text to 300 characters", async () => {
      const longText = "a".repeat(400);
      const response = createMockResponse(longText, { ok: false });
      await expect(fetchJsonOrThrow(response, "test")).rejects.toThrow(
        "a".repeat(300),
      );
    });

    it("throws with fallback message if body is empty and no standard fields", async () => {
      const response = createMockResponse("", { ok: false, status: 500 });
      await expect(fetchJsonOrThrow(response, "test")).rejects.toThrow(
        "test request failed (500).",
      );
    });
  });
});
