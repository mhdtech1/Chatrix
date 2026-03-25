import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ChatAnalyticsStrip } from "../../../src/renderer/ui/components/Shell/ChatAnalyticsStrip";

describe("ChatAnalyticsStrip", () => {
  it("shows the primary analytics summary and expandable details", () => {
    const onCloseDetailsMenu = vi.fn();

    render(
      <ChatAnalyticsStrip
        show
        messagesPerMinute={12}
        activeChatters={7}
        mentionRatePerMinute={3}
        modActionRatePerMinute={2}
        onCloseDetailsMenu={onCloseDetailsMenu}
      />,
    );

    expect(screen.getByText("Msg/min: 12")).toBeInTheDocument();
    expect(screen.getByText("Chatters: 7")).toBeInTheDocument();
    expect(screen.getByText("More stats")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /close stats menu/i }));
    expect(onCloseDetailsMenu).toHaveBeenCalledTimes(1);
  });
});
