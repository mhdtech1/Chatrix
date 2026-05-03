import { describe, expect, it } from "vitest";
import { formatOptionalDateTime } from "../../../src/renderer/utils/chatFormatting";

describe("formatOptionalDateTime", () => {
  it("returns 'n/a' when value is undefined", () => {
    expect(formatOptionalDateTime(undefined)).toBe("n/a");
  });

  it("returns 'n/a' when value is an empty string", () => {
    expect(formatOptionalDateTime("")).toBe("n/a");
  });

  it("returns 'n/a' when value is an invalid date string", () => {
    expect(formatOptionalDateTime("not a real date")).toBe("n/a");
  });

  it("returns a formatted date string when value is a valid date string", () => {
    // using a specific date string
    const dateStr = "2023-10-27T10:00:00Z";
    const expected = new Date(dateStr).toLocaleString();
    expect(formatOptionalDateTime(dateStr)).toBe(expected);
  });
});
