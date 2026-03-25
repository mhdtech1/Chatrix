export type ChatQuickActionsProps = {
  show: boolean;
  welcomeModeEnabled: boolean;
  replayBufferSeconds: number;
  pollComposerOpen: boolean;
  onRefreshActiveTab: () => void;
  onToggleWelcomeMode: () => void;
  onCopyChannelLink: () => void;
  onToggleReplay30: () => void;
  onToggleReplay60: () => void;
  onTogglePollComposer: () => void;
  onCloseDetailsMenu: () => void;
};

export function ChatQuickActions({
  show,
  welcomeModeEnabled,
  replayBufferSeconds,
  pollComposerOpen,
  onRefreshActiveTab,
  onToggleWelcomeMode,
  onCopyChannelLink,
  onToggleReplay30,
  onToggleReplay60,
  onTogglePollComposer,
  onCloseDetailsMenu,
}: ChatQuickActionsProps) {
  if (!show) return null;

  return (
    <div className="quick-actions-row">
      <div className="quick-actions-primary">
        <button
          type="button"
          className="quick-action-button"
          onClick={onRefreshActiveTab}
        >
          Reconnect
        </button>
        <button
          type="button"
          className={
            welcomeModeEnabled
              ? "quick-action-button active"
              : "quick-action-button"
          }
          onClick={onToggleWelcomeMode}
        >
          {welcomeModeEnabled ? "Welcome: on" : "Welcome: off"}
        </button>
      </div>
      <details className="quick-actions-more">
        <summary>More</summary>
        <div className="quick-actions-more-menu">
          <div className="menu-popover-header">
            <span>Quick actions</span>
            <button
              type="button"
              className="menu-close-button"
              onClick={onCloseDetailsMenu}
              aria-label="Close quick actions menu"
            >
              ×
            </button>
          </div>
          <button
            type="button"
            className="quick-action-button"
            onClick={onCopyChannelLink}
          >
            Copy channel link
          </button>
          <button
            type="button"
            className="quick-action-button"
            onClick={onToggleReplay30}
          >
            {replayBufferSeconds === 30 ? "Replay 30s: off" : "Replay 30s"}
          </button>
          <button
            type="button"
            className="quick-action-button"
            onClick={onToggleReplay60}
          >
            {replayBufferSeconds === 60 ? "Replay 60s: off" : "Replay 60s"}
          </button>
          <button
            type="button"
            className="quick-action-button"
            onClick={onTogglePollComposer}
          >
            {pollComposerOpen ? "Close poll builder" : "Create poll"}
          </button>
        </div>
      </details>
    </div>
  );
}
