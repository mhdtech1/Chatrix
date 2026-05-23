import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Platform } from "../../../../shared/types";
import { platformDisplayName } from "../../../utils/chatFormatting";

/**
 * Discord-style streamer chrome (preview, gated on `settings.newLayout`).
 *
 * F-α scope: this component renders only the *chrome* — the platform
 * rail on the left, the channel list, the user strip, and (optionally)
 * a collapsible right context panel. The chat workspace itself is the
 * existing main-layout block in ChatShell — it stays put. CSS hides
 * the classic topbar / tab bar / account strip and shifts the
 * workspace's margins to make room for the new chrome.
 *
 * F-β will replace the classic tab-bar with an in-workspace chat
 * header (channel name + live badge + viewer count + quick mod).
 */

export type NewShellTabItem = {
  id: string;
  label: string;
  platform?: Platform | string;
  unreadCount: number;
  mentionCount: number;
  active: boolean;
};

export type NewShellAuthDot = {
  platform: Platform;
  signedIn: boolean;
  username: string;
};

export type NewShellContextSection = {
  id: string;
  title: string;
  count?: number;
  defaultCollapsed?: boolean;
  body: ReactNode;
};

export type NewShellLayoutProps = {
  tabs: NewShellTabItem[];
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onContextMenuTab: (tabId: string, position: { x: number; y: number }) => void;
  onAddChannel: () => void;
  onOpenSettings: () => void;
  onOpenPalette: () => void;
  authDots?: NewShellAuthDot[];
  selfDisplayName?: string;
  signedInPlatformsCount?: number;
  contextSections?: NewShellContextSection[];
  rightPanelOpen: boolean;
  onToggleRightPanel: () => void;
};

const PLATFORM_KEYS: Platform[] = ["twitch", "kick", "youtube", "tiktok"];

const RailDot = ({
  platform,
  active,
  count,
  disabled,
  onClick,
}: {
  platform: Platform;
  active: boolean;
  count: number;
  disabled: boolean;
  onClick: () => void;
}) => {
  const className = [
    "new-shell__rail-dot",
    `new-shell__rail-dot--${platform}`,
    active ? "new-shell__rail-dot--active" : "",
    disabled ? "new-shell__rail-dot--disabled" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button
      type="button"
      className={className}
      title={
        disabled
          ? `${platformDisplayName(platform)} · no channels open`
          : `${platformDisplayName(platform)} · ${count} channel${count === 1 ? "" : "s"}`
      }
      aria-pressed={active}
      onClick={onClick}
    >
      <span className="new-shell__rail-dot-inner" aria-hidden="true" />
      {count > 0 ? (
        <span className="new-shell__rail-dot-badge" aria-hidden="true" />
      ) : null}
    </button>
  );
};

const PlatformPill = ({ platform }: { platform: Platform | string }) => (
  <span
    className={`new-shell__pl new-shell__pl--${platform}`}
    aria-hidden="true"
  />
);

const ChannelRow = ({
  tab,
  onSelect,
  onClose,
  onContextMenu,
}: {
  tab: NewShellTabItem;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onContextMenu: (id: string, position: { x: number; y: number }) => void;
}) => {
  const className = [
    "new-shell__channel",
    tab.active ? "new-shell__channel--active" : "",
    tab.mentionCount > 0 ? "new-shell__channel--mentioned" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div
      className={className}
      role="button"
      tabIndex={0}
      aria-current={tab.active ? "true" : undefined}
      onClick={() => onSelect(tab.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(tab.id);
        }
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        onContextMenu(tab.id, { x: event.clientX, y: event.clientY });
      }}
    >
      {tab.platform ? <PlatformPill platform={tab.platform} /> : null}
      <span className="new-shell__channel-name">{tab.label}</span>
      {tab.mentionCount > 0 ? (
        <span
          className="new-shell__badge new-shell__badge--mention"
          aria-label={`${tab.mentionCount} mentions`}
        >
          {tab.mentionCount > 99 ? "99+" : tab.mentionCount}
        </span>
      ) : tab.unreadCount > 0 ? (
        <span
          className="new-shell__badge"
          aria-label={`${tab.unreadCount} unread`}
        >
          {tab.unreadCount > 99 ? "99+" : tab.unreadCount}
        </span>
      ) : null}
      <button
        type="button"
        className="new-shell__channel-close"
        aria-label={`Close ${tab.label}`}
        onClick={(event) => {
          event.stopPropagation();
          onClose(tab.id);
        }}
      >
        ×
      </button>
    </div>
  );
};

const CollapsibleSection = ({
  section,
}: {
  section: NewShellContextSection;
}) => {
  const [collapsed, setCollapsed] = useState(
    section.defaultCollapsed ?? false,
  );
  return (
    <section
      className={
        collapsed
          ? "new-shell__section new-shell__section--collapsed"
          : "new-shell__section"
      }
    >
      <button
        type="button"
        className="new-shell__section-toggle"
        aria-expanded={!collapsed}
        onClick={() => setCollapsed((value) => !value)}
      >
        <span className="new-shell__section-caret" aria-hidden="true">
          ▾
        </span>
        <span className="new-shell__section-title">{section.title}</span>
        {section.count !== undefined && section.count > 0 ? (
          <span className="new-shell__section-count">{section.count}</span>
        ) : null}
      </button>
      {collapsed ? null : (
        <div className="new-shell__section-body">{section.body}</div>
      )}
    </section>
  );
};

export function NewShellLayout({
  tabs,
  onSelectTab,
  onCloseTab,
  onContextMenuTab,
  onAddChannel,
  onOpenSettings,
  onOpenPalette,
  selfDisplayName,
  signedInPlatformsCount,
  contextSections,
  rightPanelOpen,
  onToggleRightPanel,
}: NewShellLayoutProps) {
  const platformCounts = useMemo(() => {
    const counts: Record<Platform, number> = {
      twitch: 0,
      kick: 0,
      youtube: 0,
      tiktok: 0,
    };
    for (const tab of tabs) {
      const key = tab.platform as Platform | undefined;
      if (key && key in counts) counts[key] += 1;
    }
    return counts;
  }, [tabs]);

  const [platformFilter, setPlatformFilter] = useState<Platform | null>(null);
  const filteredTabs = useMemo(() => {
    if (!platformFilter) return tabs;
    return tabs.filter((tab) => tab.platform === platformFilter);
  }, [tabs, platformFilter]);

  const groupedTabs = useMemo(() => {
    const groups = new Map<string, NewShellTabItem[]>();
    for (const tab of filteredTabs) {
      const key =
        (tab.platform as string | undefined) &&
        PLATFORM_KEYS.includes(tab.platform as Platform)
          ? (tab.platform as string)
          : "other";
      const bucket = groups.get(key) ?? [];
      bucket.push(tab);
      groups.set(key, bucket);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => {
      const aIndex = PLATFORM_KEYS.indexOf(a as Platform);
      const bIndex = PLATFORM_KEYS.indexOf(b as Platform);
      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  }, [filteredTabs]);

  const hasContext = (contextSections?.length ?? 0) > 0;

  return (
    <>
      <nav className="new-shell__rail" aria-label="Platform filter">
        {PLATFORM_KEYS.map((platform) => (
          <RailDot
            key={platform}
            platform={platform}
            count={platformCounts[platform]}
            disabled={platformCounts[platform] === 0}
            active={platformFilter === platform}
            onClick={() =>
              setPlatformFilter((current) =>
                current === platform ? null : platform,
              )
            }
          />
        ))}
        <div className="new-shell__rail-spacer" />
        {hasContext ? (
          <button
            type="button"
            className={
              rightPanelOpen
                ? "new-shell__rail-icon new-shell__rail-icon--active"
                : "new-shell__rail-icon"
            }
            onClick={onToggleRightPanel}
            aria-label={
              rightPanelOpen ? "Hide context panel" : "Show context panel"
            }
            aria-pressed={rightPanelOpen}
            title="Toggle context panel"
          >
            ▦
          </button>
        ) : null}
        <button
          type="button"
          className="new-shell__rail-icon"
          onClick={onOpenPalette}
          aria-label="Open command palette"
          title="Command palette (Ctrl+K)"
        >
          ⌘
        </button>
        <button
          type="button"
          className="new-shell__rail-icon"
          onClick={onOpenSettings}
          aria-label="Open settings"
          title="Settings (Ctrl+,)"
        >
          ⚙
        </button>
      </nav>

      <aside className="new-shell__channels" aria-label="Channels">
        <header className="new-shell__channels-header">
          <strong>Channels</strong>
          <button
            type="button"
            className="new-shell__channels-add"
            onClick={onAddChannel}
            aria-label="Add channel"
            title="Add channel"
          >
            +
          </button>
        </header>
        <div className="new-shell__channels-list">
          {groupedTabs.length === 0 ? (
            <p className="new-shell__channels-empty">
              No channels yet. Click + to add one.
            </p>
          ) : (
            groupedTabs.map(([platformKey, items]) => (
              <div key={platformKey} className="new-shell__channels-group">
                <div className="new-shell__channels-group-label">
                  {platformDisplayName(platformKey)}
                  <span className="new-shell__channels-group-count">
                    {items.length}
                  </span>
                </div>
                {items.map((tab) => (
                  <ChannelRow
                    key={tab.id}
                    tab={tab}
                    onSelect={onSelectTab}
                    onClose={onCloseTab}
                    onContextMenu={onContextMenuTab}
                  />
                ))}
              </div>
            ))
          )}
        </div>
        <footer className="new-shell__user-strip">
          <span className="new-shell__user-avatar" aria-hidden="true">
            {selfDisplayName?.[0]?.toUpperCase() ?? "·"}
          </span>
          <div className="new-shell__user-meta">
            <span className="new-shell__user-name">
              {selfDisplayName ?? "Not signed in"}
            </span>
            <span className="new-shell__user-sub">
              {signedInPlatformsCount !== undefined
                ? `${signedInPlatformsCount} platform${signedInPlatformsCount === 1 ? "" : "s"} signed in`
                : ""}
            </span>
          </div>
          <button
            type="button"
            className="new-shell__user-gear"
            onClick={onOpenSettings}
            aria-label="Account settings"
            title="Account settings"
          >
            ⚙
          </button>
        </footer>
      </aside>

      {rightPanelOpen && hasContext ? (
        <aside className="new-shell__context" aria-label="Context panel">
          {contextSections!.map((section) => (
            <CollapsibleSection key={section.id} section={section} />
          ))}
        </aside>
      ) : null}
    </>
  );
}
