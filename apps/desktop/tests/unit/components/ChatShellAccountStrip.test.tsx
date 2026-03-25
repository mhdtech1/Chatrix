import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChatShellAccountStrip } from "../../../src/renderer/ui/components/Guides/ChatShellAccountStrip";

describe("ChatShellAccountStrip", () => {
  it("renders connection summary and mention count", () => {
    render(
      <ChatShellAccountStrip
        show
        hasPrimaryAuth
        hasTwitchAuth
        hasKickAuth={false}
        isAdvancedMode={false}
        youtubeAlphaEnabled={false}
        tiktokAlphaEnabled={false}
        mentionInboxCount={3}
        twitchSignedIn
        twitchUsername="demo"
        kickSignedIn={false}
        kickUsername=""
        closeClosestDetailsMenu={vi.fn()}
      />,
    );

    expect(screen.getByText("Connected: Twitch")).toBeInTheDocument();
    expect(screen.getByText("Mentions: 3")).toBeInTheDocument();
  });

  it("renders advanced details when enabled", () => {
    render(
      <ChatShellAccountStrip
        show
        hasPrimaryAuth={false}
        hasTwitchAuth={false}
        hasKickAuth
        isAdvancedMode
        youtubeAlphaEnabled
        tiktokAlphaEnabled
        mentionInboxCount={0}
        twitchSignedIn={false}
        twitchUsername=""
        kickSignedIn
        kickUsername="creator"
        closeClosestDetailsMenu={vi.fn()}
      />,
    );

    expect(screen.getByText("Details")).toBeInTheDocument();
    expect(screen.getByText("Read-only: YouTube TikTok")).toBeInTheDocument();
  });
});
