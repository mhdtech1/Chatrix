import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ChatWorkspace } from "../../../src/renderer/ui/components/Shell/ChatWorkspace";

const renderWorkspace = (
  overrides: Partial<React.ComponentProps<typeof ChatWorkspace>> = {},
) => {
  const props: React.ComponentProps<typeof ChatWorkspace> = {
    activeTab: true,
    welcomeScreen: <div>Welcome</div>,
    showToolbar: true,
    toolbarSummaryText: "42 msgs · 3/min",
    isAdvancedMode: true,
    firstUnreadTimestamp: 1,
    onJumpToFirstUnread: vi.fn(),
    adaptivePerformanceMode: true,
    showActiveTabMeta: true,
    isSimpleMode: false,
    simpleActiveTabMetaText: "twitch/mazen",
    activeSourcePreviewItems: [
      {
        source: { id: "src-1", platform: "twitch", channel: "mazen" },
        status: "connected",
        staleSeconds: null,
      },
    ],
    activeSourceStatusItems: [
      {
        source: { id: "src-1", platform: "twitch", channel: "mazen" },
        status: "connected",
        staleSeconds: null,
      },
      {
        source: { id: "src-2", platform: "kick", channel: "alt" },
        status: "connected",
        staleSeconds: 45,
      },
    ],
    hiddenActiveSourceCount: 1,
    closeClosestDetailsMenu: vi.fn(),
    quickActions: <div>Quick actions slot</div>,
    activeRaidSignal: null,
    onEnableWelcomeMode: vi.fn(),
    onDismissRaidSignal: vi.fn(),
    activePinnedMessage: {
      platform: "twitch",
      channel: "mazen",
      displayName: "Mazen",
      timestamp: "2024-01-15T12:00:00Z",
      message: "Pinned message",
    },
    onClearPinnedMessage: vi.fn(),
    pollComposerOpen: false,
    pollQuestionDraft: "",
    onPollQuestionDraftChange: vi.fn(),
    pollOptionsDraft: "",
    onPollOptionsDraftChange: vi.fn(),
    onStartPoll: vi.fn(),
    canStartPoll: true,
    onCancelPollComposer: vi.fn(),
    activeTabPoll: null,
    onVoteInPoll: vi.fn(),
    onCloseActivePoll: vi.fn(),
    onClearActivePoll: vi.fn(),
    messageFeed: <div>Message feed slot</div>,
    newestLocked: false,
    pendingNewestCount: 4,
    onJumpToNewest: vi.fn(),
    composerPanel: <div>Composer slot</div>,
    ...overrides,
  };

  return {
    props,
    ...render(<ChatWorkspace {...props} />),
  };
};

describe("ChatWorkspace", () => {
  it("renders the active tab workflow zones", () => {
    const { props } = renderWorkspace();

    expect(screen.getByText("42 msgs · 3/min")).toBeInTheDocument();
    expect(screen.getByText("Adaptive perf on")).toBeInTheDocument();
    expect(screen.getByText("Quick actions slot")).toBeInTheDocument();
    expect(screen.getByText("Message feed slot")).toBeInTheDocument();
    expect(screen.getByText("Composer slot")).toBeInTheDocument();
    expect(screen.getByText("Pinned message")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /first unread/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /4 new messages/i }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /first unread/i }));
    expect(props.onJumpToFirstUnread).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /click to resume/i }));
    expect(props.onJumpToNewest).toHaveBeenCalledTimes(1);
  });

  it("falls back to welcome screen when there is no active tab", () => {
    renderWorkspace({
      activeTab: false,
      welcomeScreen: <div>Open a channel</div>,
      messageFeed: <div>Should not render</div>,
      composerPanel: <div>Should not render</div>,
    });

    expect(screen.getByText("Open a channel")).toBeInTheDocument();
    expect(screen.queryByText("Should not render")).not.toBeInTheDocument();
  });
});
