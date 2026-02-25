import type { ChatMessage } from "@multichat/chat-core";

type ChatLineProps = {
  message: ChatMessage;
  showTimestamp?: boolean;
  showBadges?: boolean;
  onUsernameClick?: (username: string, platform: string) => void;
  onMessageClick?: (message: ChatMessage) => void;
};

export function ChatLine({
  message,
  showTimestamp = true,
  showBadges = true,
  onUsernameClick,
  onMessageClick
}: ChatLineProps) {
  return (
    <div className="chat-line" role="listitem" onClick={() => onMessageClick?.(message)}>
      {showTimestamp ? <span className="line-time">{new Date(message.timestamp).toLocaleTimeString()}</span> : null}
      <span className={`line-platform ${message.platform}`}>{message.platform}</span>
      {showBadges && message.badges?.length ? (
        <span className="line-badges">
          {message.badges.map((badge) => (
            <span key={`${message.id}-${badge}`} title={badge}>
              {badge}
            </span>
          ))}
        </span>
      ) : null}
      <button
        type="button"
        className="line-author"
        style={{ color: message.color }}
        onClick={(event) => {
          event.stopPropagation();
          onUsernameClick?.(message.username, message.platform);
        }}
      >
        {message.displayName}
      </button>
      <span className="line-message">{message.message}</span>
    </div>
  );
}
