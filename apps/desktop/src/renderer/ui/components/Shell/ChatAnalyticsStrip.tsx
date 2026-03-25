export type ChatAnalyticsStripProps = {
  show: boolean;
  messagesPerMinute: number;
  activeChatters: number;
  mentionRatePerMinute: number;
  modActionRatePerMinute: number;
  onCloseDetailsMenu: () => void;
};

export function ChatAnalyticsStrip({
  show,
  messagesPerMinute,
  activeChatters,
  mentionRatePerMinute,
  modActionRatePerMinute,
  onCloseDetailsMenu,
}: ChatAnalyticsStripProps) {
  if (!show) return null;

  return (
    <section className="analytics-strip" aria-label="Live analytics">
      <span className="analytics-chip strong">
        Msg/min: {messagesPerMinute}
      </span>
      <span className="analytics-chip">Chatters: {activeChatters}</span>
      <details className="analytics-more">
        <summary>More stats</summary>
        <div className="analytics-more-menu">
          <div className="menu-popover-header">
            <span>Live stats</span>
            <button
              type="button"
              className="menu-close-button"
              onClick={onCloseDetailsMenu}
              aria-label="Close stats menu"
            >
              ×
            </button>
          </div>
          <span className="analytics-chip">
            Mentions/min: {mentionRatePerMinute}
          </span>
          <span className="analytics-chip">
            Mod actions/min: {modActionRatePerMinute}
          </span>
        </div>
      </details>
    </section>
  );
}
