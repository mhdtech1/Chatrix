import type { CSSProperties } from "react";
import type { ChatMessage } from "@chatrix/chat-core";
import type { ModeratorAction } from "../../../../shared/types";

type TabMenuState = {
  x: number;
  y: number;
  tabId: string;
};

type MessageMenuState = {
  x: number;
  y: number;
  message: ChatMessage;
};

type UserLogTarget = {
  platform: "twitch" | "kick";
  username: string;
  displayName: string;
};

type IdentityStats = {
  total: number;
  inLastMinute: number;
  inLastFiveMinutes: number;
  mentionCount: number;
};

type Props = {
  tabMenu: TabMenuState | null;
  setTabMenu: (next: TabMenuState | null) => void;
  tabMenuStyle: CSSProperties;
  tabs: Array<{ id: string; sourceIds: string[] }>;
  tabLabel: (tab: { id: string; sourceIds: string[] }) => string;
  mergeTabs: (sourceTabId: string, targetTabId: string) => void;
  splitMergedTab: (tabId: string) => void;
  messageMenu: MessageMenuState | null;
  setMessageMenu: (next: MessageMenuState | null) => void;
  messageMenuStyle: CSSProperties;
  canShowModerationMenu: boolean;
  messageMenuCanUnban: boolean;
  messageMenuCanDelete: boolean;
  messageMenuCanOpenPlatformModMenu: boolean;
  canOpenUserLogsForMessageMenu: boolean;
  runModeratorAction: (
    action: ModeratorAction,
    message: ChatMessage,
  ) => Promise<void> | void;
  openUserLogsForMessage: (message: ChatMessage) => void;
  fillComposerCommandForMessage: (
    action: ModeratorAction,
    message: ChatMessage,
  ) => void;
  openPlatformModMenu: (message: ChatMessage) => void;
  activeTabId: string | null;
  pinMessageForActiveTab: (message: ChatMessage) => Promise<void> | void;
  userLogTarget: UserLogTarget | null;
  setUserLogTarget: (next: UserLogTarget | null) => void;
  userLogMessages: ChatMessage[];
  identityTarget: UserLogTarget | null;
  setIdentityTarget: (next: UserLogTarget | null) => void;
  identityStats: IdentityStats;
  identityMessages: ChatMessage[];
  authMessage: string;
  setAuthMessage: (next: string) => void;
  updateLockActive: boolean;
  updateLockTitle: string;
  updateLockMessage: string;
};

export function ChatShellOverlayLayer({
  tabMenu,
  setTabMenu,
  tabMenuStyle,
  tabs,
  tabLabel,
  mergeTabs,
  splitMergedTab,
  messageMenu,
  setMessageMenu,
  messageMenuStyle,
  canShowModerationMenu,
  messageMenuCanUnban,
  messageMenuCanDelete,
  messageMenuCanOpenPlatformModMenu,
  canOpenUserLogsForMessageMenu,
  runModeratorAction,
  openUserLogsForMessage,
  fillComposerCommandForMessage,
  openPlatformModMenu,
  activeTabId,
  pinMessageForActiveTab,
  userLogTarget,
  setUserLogTarget,
  userLogMessages,
  identityTarget,
  setIdentityTarget,
  identityStats,
  identityMessages,
  authMessage,
  setAuthMessage,
  updateLockActive,
  updateLockTitle,
  updateLockMessage,
}: Props) {
  return (
    <>
      {tabMenu ? (
        <div
          className="context-menu"
          style={tabMenuStyle}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="context-menu-header">
            <strong>Merge This Tab Into</strong>
            <button
              type="button"
              className="menu-close-button"
              onClick={() => setTabMenu(null)}
              aria-label="Close tab menu"
            >
              ×
            </button>
          </div>
          {tabs
            .filter((tab) => tab.id !== tabMenu.tabId)
            .map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => mergeTabs(tabMenu.tabId, tab.id)}
              >
                {tabLabel(tab)}
              </button>
            ))}
          {tabs.filter((tab) => tab.id !== tabMenu.tabId).length === 0 ? (
            <span>No merge targets</span>
          ) : null}
          {(tabs.find((tab) => tab.id === tabMenu.tabId)?.sourceIds.length ??
            0) > 1 ? (
            <button type="button" onClick={() => splitMergedTab(tabMenu.tabId)}>
              Split into single tabs
            </button>
          ) : null}
        </div>
      ) : null}

      {messageMenu ? (
        <div
          className="context-menu"
          style={messageMenuStyle}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="context-menu-header">
            <strong>Message Menu</strong>
            <button
              type="button"
              className="menu-close-button"
              onClick={() => setMessageMenu(null)}
              aria-label="Close message menu"
            >
              ×
            </button>
          </div>
          {canShowModerationMenu ? <strong>Moderation</strong> : null}
          {canShowModerationMenu ? (
            <button
              type="button"
              onClick={() =>
                void runModeratorAction("timeout_60", messageMenu.message)
              }
            >
              Timeout 1m
            </button>
          ) : null}
          {canShowModerationMenu ? (
            <button
              type="button"
              onClick={() =>
                void runModeratorAction("timeout_600", messageMenu.message)
              }
            >
              Timeout 10m
            </button>
          ) : null}
          {canShowModerationMenu ? (
            <button
              type="button"
              onClick={() =>
                void runModeratorAction("ban", messageMenu.message)
              }
            >
              Ban user
            </button>
          ) : null}
          {messageMenuCanUnban ? (
            <button
              type="button"
              onClick={() =>
                void runModeratorAction("unban", messageMenu.message)
              }
            >
              Unban user
            </button>
          ) : null}
          {messageMenuCanDelete ? (
            <button
              type="button"
              onClick={() =>
                void runModeratorAction("delete", messageMenu.message)
              }
            >
              Delete message
            </button>
          ) : null}
          {canOpenUserLogsForMessageMenu ? (
            <button
              type="button"
              onClick={() => openUserLogsForMessage(messageMenu.message)}
            >
              View User Logs
            </button>
          ) : null}
          {messageMenu.message.platform === "twitch" ||
          messageMenu.message.platform === "kick" ? (
            <>
              <strong>Smart Commands</strong>
              <button
                type="button"
                onClick={() =>
                  fillComposerCommandForMessage(
                    "timeout_60",
                    messageMenu.message,
                  )
                }
              >
                Fill timeout 1m
              </button>
              <button
                type="button"
                onClick={() =>
                  fillComposerCommandForMessage(
                    "timeout_600",
                    messageMenu.message,
                  )
                }
              >
                Fill timeout 10m
              </button>
              <button
                type="button"
                onClick={() =>
                  fillComposerCommandForMessage("ban", messageMenu.message)
                }
              >
                Fill ban
              </button>
              <button
                type="button"
                onClick={() =>
                  fillComposerCommandForMessage("unban", messageMenu.message)
                }
              >
                Fill unban
              </button>
            </>
          ) : null}
          {messageMenuCanOpenPlatformModMenu ? (
            <button
              type="button"
              onClick={() => openPlatformModMenu(messageMenu.message)}
            >
              Open Platform Mod Menu
            </button>
          ) : null}
          {activeTabId ? (
            <button
              type="button"
              onClick={() => void pinMessageForActiveTab(messageMenu.message)}
            >
              Pin message in Chatrix
            </button>
          ) : null}
          <strong>Copy</strong>
          <button
            type="button"
            onClick={() =>
              navigator.clipboard.writeText(messageMenu.message.displayName)
            }
          >
            Copy name
          </button>
          <button
            type="button"
            onClick={() =>
              navigator.clipboard.writeText(messageMenu.message.message)
            }
          >
            Copy message
          </button>
        </div>
      ) : null}

      {userLogTarget ? (
        <div
          className="user-logs-overlay"
          onClick={() => setUserLogTarget(null)}
        >
          <div
            className="user-logs-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="user-logs-header">
              <div>
                <strong>
                  {userLogTarget.platform.toUpperCase()} logs for{" "}
                  {userLogTarget.displayName}
                </strong>
                <span>@{userLogTarget.username}</span>
              </div>
              <button
                type="button"
                className="ghost"
                onClick={() => setUserLogTarget(null)}
              >
                Close
              </button>
            </div>
            <p className="user-logs-note">
              Session-only history. Nothing is saved to local log files.
            </p>
            <div className="user-logs-list">
              {userLogMessages.length === 0 ? (
                <p className="user-logs-empty">
                  No messages from this user in the current session yet.
                </p>
              ) : (
                userLogMessages.map((message) => (
                  <div
                    key={`${message.id}-${message.timestamp}-${message.channel}`}
                    className="user-log-line"
                  >
                    <span className="user-log-meta">
                      {new Date(message.timestamp).toLocaleString()} ·{" "}
                      {message.platform}/{message.channel}
                    </span>
                    <span className="user-log-text">{message.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}

      {identityTarget ? (
        <div
          className="user-logs-overlay"
          onClick={() => setIdentityTarget(null)}
        >
          <div
            className="user-logs-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="user-logs-header">
              <div>
                <strong>
                  Session identity card: {identityTarget.displayName}
                </strong>
                <span>@{identityTarget.username}</span>
              </div>
              <button
                type="button"
                className="ghost"
                onClick={() => setIdentityTarget(null)}
              >
                Close
              </button>
            </div>
            <p className="user-logs-note">
              Recent messages across all platforms in this session.
            </p>
            <p className="user-logs-note">
              Total: {identityStats.total} · 1m: {identityStats.inLastMinute} ·
              5m: {identityStats.inLastFiveMinutes} · Mentions:{" "}
              {identityStats.mentionCount}
            </p>
            <div className="user-logs-list">
              {identityMessages.length === 0 ? (
                <p className="user-logs-empty">
                  No cross-platform history for this user yet.
                </p>
              ) : (
                identityMessages.map((message) => (
                  <div
                    key={`${message.id}-${message.timestamp}-${message.channel}`}
                    className="user-log-line"
                  >
                    <span className="user-log-meta">
                      {new Date(message.timestamp).toLocaleString()} ·{" "}
                      {message.platform}/{message.channel}
                    </span>
                    <span className="user-log-text">{message.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}

      {authMessage ? (
        <p
          className="floating-status"
          onClick={() => setAuthMessage("")}
          title="Click to dismiss"
        >
          {authMessage}
        </p>
      ) : null}
      {updateLockActive ? (
        <div className="update-lock-screen">
          <div className="update-lock-card">
            <div className="update-lock-spinner" aria-hidden="true" />
            <h2>{updateLockTitle}</h2>
            <p>{updateLockMessage}</p>
            <p>Please keep the app open. Controls are temporarily disabled.</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
