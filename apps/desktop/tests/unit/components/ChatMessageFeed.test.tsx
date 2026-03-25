import type { ChatMessage } from "@chatrix/chat-core";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { ChatMessageFeed } from "../../../src/renderer/ui/components/Shell/ChatMessageFeed";

const message: ChatMessage = {
  id: "msg-1",
  platform: "twitch",
  channel: "mazen",
  username: "viewer",
  displayName: "Viewer",
  message: "hello world",
  timestamp: "2024-01-15T12:00:00Z",
  color: "#ffffff",
};

describe("ChatMessageFeed", () => {
  it("renders unread state and forwards identity and context actions", () => {
    const onIdentitySelect = vi.fn();
    const onInteraction = vi.fn();
    const onMessageContextMenu = vi.fn();

    render(
      <ChatMessageFeed
        messageListRef={createRef<HTMLDivElement>()}
        renderedMessages={[message]}
        newestLocked
        firstUnreadTimestamp={1}
        onScroll={vi.fn()}
        pauseAutoScroll={vi.fn()}
        notePausedFeedActivity={vi.fn()}
        twitchGlobalBadgeCatalog={{}}
        twitchChannelBadgeCatalogByRoomId={{}}
        onIdentitySelect={onIdentitySelect}
        onInteraction={onInteraction}
        onMessageContextMenu={onMessageContextMenu}
        effectivePerformanceMode={false}
        sourceByPlatformChannel={new Map()}
        channelEmoteMapBySourceId={{}}
        kickGlobalEmoteMap={{}}
        globalEmoteMap={{}}
        highlightKeywords={["hello"]}
        resolveDisplayedBadgesForMessage={() => []}
        buildMessageChunks={() => [{ type: "text", value: message.message }]}
        messageTimestamp={(entry) => new Date(entry.timestamp).getTime()}
        readCombinedChannels={() => []}
        asRecord={(value) =>
          value && typeof value === "object"
            ? (value as Record<string, unknown>)
            : null
        }
        buildMessageJumpKey={() => "jump-key"}
        renderTextWithLinks={(text) => [text]}
        toUiRoleType={() => null}
      />,
    );

    expect(screen.getByText("New messages")).toBeInTheDocument();
    expect(screen.getByText("hello world")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Viewer" }));
    expect(onIdentitySelect).toHaveBeenCalledWith({
      username: "viewer",
      displayName: "Viewer",
    });

    fireEvent.click(screen.getByText("hello world"));
    expect(onInteraction).toHaveBeenCalledTimes(1);

    fireEvent.contextMenu(screen.getByText("hello world"));
    expect(onMessageContextMenu).toHaveBeenCalledTimes(1);
    expect(onMessageContextMenu.mock.calls[0]?.[1]).toEqual(message);
  });
});
