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

    expect(screen.getByText("Control Center")).toBeInTheDocument();
    expect(screen.getByText("Main menu")).toBeInTheDocument();
    expect(screen.getByText("Workspace")).toBeInTheDocument();
    expect(screen.getByText("Moderation")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /close main menu/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
