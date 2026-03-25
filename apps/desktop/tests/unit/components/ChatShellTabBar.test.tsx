import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ChatShellTabBar } from "../../../src/renderer/ui/components/Shell/ChatShellTabBar";

describe("ChatShellTabBar", () => {
  it("renders unread and mention badges and emits tab actions", () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    const onContextMenu = vi.fn();

    render(
      <ChatShellTabBar
        items={[
          {
            id: "tab-1",
            label: "mazendahroug",
            platform: "twitch",
            group: "main",
            groupMuted: false,
            active: false,
            unreadCount: 12,
            mentionCount: 2,
          },
        ]}
        onSelect={onSelect}
        onClose={onClose}
        onContextMenu={onContextMenu}
      />,
    );

    expect(screen.getByText("mazendahroug")).toBeInTheDocument();
    expect(screen.getByText("main")).toBeInTheDocument();
    expect(screen.getByText("@2")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /mazendahroug/i }));
    expect(onSelect).toHaveBeenCalledWith("tab-1");

    fireEvent.click(screen.getByRole("button", { name: "×" }));
    expect(onClose).toHaveBeenCalledWith("tab-1");

    fireEvent.contextMenu(screen.getByText("mazendahroug").closest("div.tab")!);
    expect(onContextMenu).toHaveBeenCalledWith(
      "tab-1",
      expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) }),
    );
  });
});
