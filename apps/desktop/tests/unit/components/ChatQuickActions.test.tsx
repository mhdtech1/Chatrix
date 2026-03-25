import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ChatQuickActions } from "../../../src/renderer/ui/components/Shell/ChatQuickActions";

describe("ChatQuickActions", () => {
  it("renders primary and overflow actions for the workspace rail", () => {
    const onRefreshActiveTab = vi.fn();
    const onToggleWelcomeMode = vi.fn();

    render(
      <ChatQuickActions
        show
        welcomeModeEnabled
        replayBufferSeconds={30}
        pollComposerOpen={false}
        onRefreshActiveTab={onRefreshActiveTab}
        onToggleWelcomeMode={onToggleWelcomeMode}
        onCopyChannelLink={vi.fn()}
        onToggleReplay30={vi.fn()}
        onToggleReplay60={vi.fn()}
        onTogglePollComposer={vi.fn()}
        onCloseDetailsMenu={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Reconnect" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Welcome: on" }),
    ).toBeInTheDocument();
    expect(screen.getByText("More")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reconnect" }));
    fireEvent.click(screen.getByRole("button", { name: "Welcome: on" }));

    expect(onRefreshActiveTab).toHaveBeenCalledTimes(1);
    expect(onToggleWelcomeMode).toHaveBeenCalledTimes(1);
  });
});
