import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ChatShellMenu } from "../../../src/renderer/ui/components/Shell/ChatShellMenu";

describe("ChatShellMenu", () => {
  it("renders the menu shell and closes from the header action", () => {
    const onClose = vi.fn();

    render(
      <ChatShellMenu panelRef={createRef<HTMLDivElement>()} onClose={onClose}>
        <div>Workspace</div>
        <div>Moderation</div>
      </ChatShellMenu>,
    );

    const dialog = screen.getByRole("dialog", {
      name: "Chatrix preferences",
    });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleDescription(
      "Use Tab to move through settings. Press Escape to close.",
    );
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Chatrix preferences")).toBeInTheDocument();
    expect(screen.getByText("Workspace")).toBeInTheDocument();
    expect(screen.getByText("Moderation")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /close settings/i }));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
