import type { ReactNode, RefObject } from "react";
import type { Platform } from "../../../../shared/types";
import { PlatformIcon } from "../common/PlatformIcon";

export type ChatShellTopBarProps = {
  isSimpleMode: boolean;
  isAdvancedMode: boolean;
  refreshDisabled: boolean;
  refreshingActiveTab: boolean;
  onRefresh: () => void;
  platformInput: Platform;
  availablePlatforms: Platform[];
  platformDisplayName: (platform: string) => string;
  onPlatformChange: (platform: Platform) => void;
  channelInput: string;
  onChannelInputChange: (value: string) => void;
  onOpenTab: () => void;
  channelInputRef: RefObject<HTMLInputElement | null>;
  mainMenuOpen: boolean;
  menuDropdownRef: RefObject<HTMLDivElement | null>;
  menuButtonRef: RefObject<HTMLButtonElement | null>;
  onToggleMenu: () => void;
  menuPanel: ReactNode;
  mentionPillCount: number;
};

export function ChatShellTopBar({
  isSimpleMode,
  isAdvancedMode,
  refreshDisabled,
  refreshingActiveTab,
  onRefresh,
  platformInput,
  availablePlatforms,
  platformDisplayName,
  onPlatformChange,
  channelInput,
  onChannelInputChange,
  onOpenTab,
  channelInputRef,
  mainMenuOpen,
  menuDropdownRef,
  menuButtonRef,
  onToggleMenu,
  menuPanel,
  mentionPillCount,
}: ChatShellTopBarProps) {
  return (
    <header className="topbar topbar-shell">
      <div className="topbar-shell__brand-zone">
        <button
          type="button"
          className="tab-refresh-button topbar-shell__refresh"
          onClick={onRefresh}
          disabled={refreshDisabled}
          title={
            refreshDisabled
              ? "Open a tab first"
              : "Refresh current tab connections"
          }
        >
          {refreshingActiveTab
            ? "Refreshing..."
            : isSimpleMode
              ? "Refresh"
              : "Refresh Tab"}
        </button>
        <div className="brand-block brand-block--broadcast">
          <span className="brand-block__eyebrow">Unified streaming desk</span>
          <h1>Chatrix</h1>
          {isAdvancedMode ? (
            <p>Moderation, routing, and chat in one view</p>
          ) : null}
        </div>
      </div>

      <form
        className="channel-form channel-form--shell"
        onSubmit={(event) => {
          event.preventDefault();
          onOpenTab();
        }}
      >
        <details className="platform-picker">
          <summary>
            <span className="platform-picker__value">
              <PlatformIcon platform={platformInput} size="sm" showBackground />
              <span>{platformDisplayName(platformInput)}</span>
            </span>
            <span className="platform-picker__caret" aria-hidden="true">
              ▾
            </span>
          </summary>
          <div className="platform-picker__menu">
            {availablePlatforms.map((platform) => (
              <button
                key={platform}
                type="button"
                className={
                  platform === platformInput
                    ? "platform-picker__option active"
                    : "platform-picker__option"
                }
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onPlatformChange(platform);
                  const details = event.currentTarget.closest("details");
                  details?.removeAttribute("open");
                }}
              >
                <PlatformIcon platform={platform} size="sm" showBackground />
                <span>{platformDisplayName(platform)}</span>
              </button>
            ))}
          </div>
        </details>
        <input
          ref={channelInputRef}
          value={channelInput}
          onChange={(event) => onChannelInputChange(event.target.value)}
          placeholder={
            isSimpleMode
              ? "Channel username"
              : "Type channel username and press Enter"
          }
          autoCapitalize="off"
          autoCorrect="off"
        />
        <button type="submit" className="topbar-shell__submit">
          Open Tab
        </button>
      </form>

      <div className="top-actions topbar-shell__actions">
        <div
          className={mainMenuOpen ? "menu-dropdown open" : "menu-dropdown"}
          ref={menuDropdownRef}
        >
          <button
            ref={menuButtonRef}
            type="button"
            className="menu-dropdown-trigger topbar-shell__menu-trigger"
            aria-haspopup="menu"
            aria-expanded={mainMenuOpen}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onToggleMenu();
            }}
          >
            Menu
          </button>
          {menuPanel}
        </div>
        {isSimpleMode && mentionPillCount > 0 ? (
          <span className="top-mention-pill topbar-shell__mention-pill">
            Mentions {mentionPillCount}
          </span>
        ) : null}
      </div>
    </header>
  );
}
