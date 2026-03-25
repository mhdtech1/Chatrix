import { describe, expect, it } from "vitest";
import {
  SOURCE_MESSAGE_BUFFER_CAP,
  capMessageBuffer,
} from "../../../src/renderer/utils/chatBuffer";

describe("capMessageBuffer", () => {
  it("keeps smaller buffers unchanged", () => {
    expect(capMessageBuffer([1, 2, 3])).toEqual([1, 2, 3]);
  });

  it("trims buffers to the most recent messages", () => {
    const messages = Array.from(
      { length: SOURCE_MESSAGE_BUFFER_CAP + 2 },
      (_, index) => index,
    );

    expect(capMessageBuffer(messages)).toEqual(
      messages.slice(-SOURCE_MESSAGE_BUFFER_CAP),
    );
  });
});
