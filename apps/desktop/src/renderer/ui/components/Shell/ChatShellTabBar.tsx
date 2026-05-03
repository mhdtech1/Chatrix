import type { MouseEvent } from "react";
import type { Platform } from "../../../../shared/types";
import { PlatformIcon } from "../common/PlatformIcon";

export type ChatShellTabItem = {
  id: string;
  label: string;
  platform?: Platform;
  group?: string;
  groupMuted: boolean;
  active: boolean;
  unreadCount: number;
  mentionCount: number;
};

export type ChatShellTabBarProps = {
  items: ChatShellTabItem[];
  onSelect: (tabId: string) => void;
  onClose: (tabId: string) => void;
  onContextMenu: (tabId: string, position: { x: number; y: number }) => void;
};

const pluralize = (count: number, singular: string) =>
  `${count} ${singular}${count === 1 ? "" : "s"}`;

const getTabLabel = (item: ChatShellTabItem) => {
  const parts = [item.label];

  if (item.platform) parts.push(item.platform);
  if (item.group) parts.push(`group ${item.group}`);
  if (item.groupMuted) parts.push("muted group");
  if (item.mentionCount > 0) {
    parts.push(pluralize(item.mentionCount, "mention"));
  }
  if (item.unreadCount > 0) {
    parts.push(pluralize(item.unreadCount, "unread message"));
  }

  return parts.join(", ");
};

export function ChatShellTabBar({
  items,
  onSelect,
  onClose,
  onContextMenu,
}: ChatShellTabBarProps) {
  return (
    <nav className="tabbar nav-strip" aria-label="Channel tabs">
      {items.map((item) => (
        <div
          key={item.id}
          className={
            item.active
              ? `tab active${item.groupMuted ? " muted" : ""}`
              : `tab${item.groupMuted ? " muted" : ""}`
          }
          onContextMenu={(event: MouseEvent<HTMLDivElement>) => {
            event.preventDefault();
            onContextMenu(item.id, {
              x: event.clientX,
              y: event.clientY,
            });
          }}
        >
          <button
            type="button"
            className="tab-select"
            aria-label={getTabLabel(item)}
            aria-current={item.active ? "page" : undefined}
            onClick={() => onSelect(item.id)}
          >
            {item.platform ? (
              <PlatformIcon platform={item.platform} size="sm" showBackground />
            ) : null}
            <span>{item.label}</span>
            {item.group ? (
              <span className="tab-badge group">{item.group}</span>
            ) : null}
            {!item.active && (item.mentionCount > 0 || item.unreadCount > 0) ? (
              <span className="tab-badges">
                {item.mentionCount > 0 ? (
                  <span
                    className="tab-badge mention"
                    title={`${item.mentionCount} mention${item.mentionCount === 1 ? "" : "s"}`}
                  >
                    @{item.mentionCount > 99 ? "99+" : item.mentionCount}
                  </span>
                ) : null}
                {item.unreadCount > 0 ? (
                  <span
                    className="tab-badge unread"
                    title={`${item.unreadCount} unread message${item.unreadCount === 1 ? "" : "s"}`}
                  >
                    {item.unreadCount > 999 ? "999+" : item.unreadCount}
                  </span>
                ) : null}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            className="tab-close"
            aria-label={`Close tab ${item.label}`}
            title={`Close ${item.label}`}
            onClick={(event) => {
              event.stopPropagation();
              onClose(item.id);
            }}
          >
            <span aria-hidden="true">x</span>
          </button>
        </div>
      ))}
    </nav>
  );
}
