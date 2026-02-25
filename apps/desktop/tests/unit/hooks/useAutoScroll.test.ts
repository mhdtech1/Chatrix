import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { useAutoScroll } from "../../../src/renderer/hooks/useAutoScroll";

describe("useAutoScroll", () => {
  it("returns containerRef", () => {
    const { result } = renderHook(() => useAutoScroll());
    expect(result.current.containerRef).toBeDefined();
    expect(result.current.containerRef.current).toBeNull();
  });

  it("provides scrollToBottom function", () => {
    const { result } = renderHook(() => useAutoScroll());
    expect(typeof result.current.scrollToBottom).toBe("function");
  });

  it("provides handleScroll function", () => {
    const { result } = renderHook(() => useAutoScroll());
    expect(typeof result.current.handleScroll).toBe("function");
  });

  it("starts with isAtBottom as true", () => {
    const { result } = renderHook(() => useAutoScroll());
    expect(result.current.isAtBottom).toBe(true);
  });
});
