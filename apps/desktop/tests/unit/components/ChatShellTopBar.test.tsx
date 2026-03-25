import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ChatShellTopBar } from "../../../src/renderer/ui/components/Shell/ChatShellTopBar";

describe("ChatShellTopBar", () => {
  it("renders the shell controls and mention pill in simple mode", () => {
    const onRefresh = vi.fn();
    const onToggleMenu = vi.fn();
    const onOpenTab = vi.fn();
    const onPlatformChange = vi.fn();
    const onChannelInputChange = vi.fn();

    render(
      <ChatShellTopBar
        isSimpleMode
        isAdvancedMode={false}
        refreshDisabled={false}
        refreshingActiveTab={false}
        onRefresh={onRefresh}
        platformInput="twitch"
        availablePlatforms={["twitch", "kick"]}
        platformDisplayName={(platform) => platform.toUpperCase()}
        onPlatformChange={onPlatformChange}
        channelInput="mazen"
        onChannelInputChange={onChannelInputChange}
        onOpenTab={onOpenTab}
        channelInputRef={createRef<HTMLInputElement>()}
        mainMenuOpen={false}
        menuDropdownRef={createRef<HTMLDivElement>()}
        menuButtonRef={createRef<HTMLButtonElement>()}
        onToggleMenu={onToggleMenu}
        menuPanel={<div>Menu body</div>}
        mentionPillCount={3}
      />,
    );

    expect(screen.getByText("Chatrix")).toBeInTheDocument();
    expect(screen.getByText("Unified streaming desk")).toBeInTheDocument();
    expect(screen.getByDisplayValue("mazen")).toBeInTheDocument();
    expect(screen.getByText("Mentions 3")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    expect(onRefresh).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    expect(onToggleMenu).toHaveBeenCalledTimes(1);

    fireEvent.submit(
      screen.getByRole("button", { name: "Open Tab" }).closest("form")!,
    );
    expect(onOpenTab).toHaveBeenCalledTimes(1);
  });
});
