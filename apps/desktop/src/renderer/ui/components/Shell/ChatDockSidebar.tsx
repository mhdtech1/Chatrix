import type { ChatMessage } from "@chatrix/chat-core";

type MentionInboxEntry = {
  id: string;
  platform: "twitch" | "kick" | "youtube" | "tiktok";
  channel: string;
  reason: "mention" | "reply";
  displayName: string;
};

type ModerationHistoryEntry = {
  id: string;
  at: string;
  action: string;
  target: string;
};

type IdentityTarget = {
  username: string;
  displayName: string;
};

type IdentityStats = {
  total: number;
  inLastMinute: number;
  inLastFiveMinutes: number;
};

export type ChatDockSidebarProps = {
  showMentions: boolean;
  mentionInbox: MentionInboxEntry[];
  onOpenMention: (entry: MentionInboxEntry) => void;
  platformIconGlyph: (platform: MentionInboxEntry["platform"]) => string;
  showGlobalTimeline: boolean;
  globalSearchMode: boolean;
  search: string;
  globalSearchResults: ChatMessage[];
  onOpenGlobalSearchResult: (message: ChatMessage) => void;
  isAdvancedMode: boolean;
  showModHistory: boolean;
  moderationHistory: ModerationHistoryEntry[];
  showUserCard: boolean;
  identityTarget: IdentityTarget | null;
  identityStats: IdentityStats;
};

export function ChatDockSidebar({
  showMentions,
  mentionInbox,
  onOpenMention,
  platformIconGlyph,
  showGlobalTimeline,
  globalSearchMode,
  search,
  globalSearchResults,
  onOpenGlobalSearchResult,
  isAdvancedMode,
  showModHistory,
  moderationHistory,
  showUserCard,
  identityTarget,
  identityStats,
}: ChatDockSidebarProps) {
  return (
    <>
      {showMentions ? (
        <div>
          <strong>Mentions</strong>
          {mentionInbox.length === 0 ? (
            <span className="menu-muted">No mentions.</span>
          ) : (
            mentionInbox.slice(0, 8).map((entry) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => onOpenMention(entry)}
              >
                [{platformIconGlyph(entry.platform)}] #{entry.channel}{" "}
                {entry.reason === "reply" ? "Reply" : "Mention"} ·{" "}
                {entry.displayName}
              </button>
            ))
          )}
        </div>
      ) : null}

      {showGlobalTimeline ? (
        <div>
          <strong>Global Timeline</strong>
          {!globalSearchMode || !search.trim() ? (
            <span className="menu-muted">
              Enable Global search and type a query.
            </span>
          ) : globalSearchResults.length === 0 ? (
            <span className="menu-muted">No results.</span>
          ) : (
            globalSearchResults.slice(0, 10).map((message) => (
              <button
                key={`${message.id}-${message.timestamp}`}
                type="button"
                onClick={() => onOpenGlobalSearchResult(message)}
              >
                [{platformIconGlyph(message.platform)}] #{message.channel}{" "}
                {message.displayName}: {message.message.slice(0, 42)}
              </button>
            ))
          )}
        </div>
      ) : null}

      {isAdvancedMode && showModHistory ? (
        <div>
          <strong>Mod History</strong>
          {moderationHistory.length === 0 ? (
            <span className="menu-muted">No actions yet.</span>
          ) : (
            moderationHistory.slice(0, 10).map((entry) => (
              <span key={entry.id} className="menu-muted">
                {new Date(entry.at).toLocaleTimeString()} {entry.action}{" "}
                {entry.target}
              </span>
            ))
          )}
        </div>
      ) : null}

      {isAdvancedMode && showUserCard ? (
        <div>
          <strong>User Card</strong>
          {identityTarget ? (
            <>
              <span className="menu-muted">
                {identityTarget.displayName} @{identityTarget.username}
              </span>
              <span className="menu-muted">
                Total {identityStats.total} · 1m {identityStats.inLastMinute} ·
                5m {identityStats.inLastFiveMinutes}
              </span>
            </>
          ) : (
            <span className="menu-muted">Click a username to pin stats.</span>
          )}
        </div>
      ) : null}
    </>
  );
}
