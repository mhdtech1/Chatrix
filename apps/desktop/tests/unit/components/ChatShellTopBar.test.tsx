import { createRef, type ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ChatShellTopBar } from "../../../src/renderer/ui/components/Shell/ChatShellTopBar";

const renderTopBar = (
  props: Partial<ComponentProps<typeof ChatShellTopBar>> = {},
) => {
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
      availablePlatforms={["twitch", "kick", "youtube", "tiktok"]}
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
      {...props}
    />,
  );

  return {
    onRefresh,
    onToggleMenu,
    onOpenTab,
    onPlatformChange,
    onChannelInputChange,
  };
};

describe("ChatShellTopBar", () => {
  it("renders the shell controls and mention pill in simple mode", () => {
    const { onRefresh, onToggleMenu, onOpenTab } = renderTopBar();

    expect(screen.getByText("Chatrix")).toBeInTheDocument();
    expect(screen.getByDisplayValue("mazen")).toBeInTheDocument();
    expect(screen.getByText("Mentions 3")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Refresh current tab" }),
    );
    expect(onRefresh).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Open settings" }));
    expect(onToggleMenu).toHaveBeenCalledTimes(1);

    fireEvent.submit(
      screen.getByRole("button", { name: "Open tab" }).closest("form")!,
    );
    expect(onOpenTab).toHaveBeenCalledWith({
      platform: "twitch",
      channel: "mazen",
    });
  });

  it("auto-detects pasted live URLs and submits the detected platform", () => {
    const { onOpenTab } = renderTopBar({
      platformInput: "twitch",
      channelInput: "https://kick.com/Some-Creator",
    });

    expect(screen.getByLabelText("Detected platform KICK")).toBeInTheDocument();

    fireEvent.submit(
      screen.getByRole("button", { name: "Open tab" }).closest("form")!,
    );
    expect(onOpenTab).toHaveBeenCalledWith({
      platform: "kick",
      channel: "some-creator",
    });
  });

  it("shows the platform picker only for ambiguous usernames", () => {
    const { onPlatformChange } = renderTopBar({
      platformInput: "twitch",
      channelInput: "mazen",
      availablePlatforms: ["twitch", "kick"],
    });

    expect(
      screen.getByLabelText("Choose platform for username"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "KICK" }));
    expect(onPlatformChange).toHaveBeenCalledWith("kick");
  });
});
