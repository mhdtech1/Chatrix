import type { ReactNode, RefObject } from "react";
import type { Platform } from "../../../../shared/types";
import { parseChannelInput } from "../../../utils/channelInput";
import { PlatformIcon } from "../common/PlatformIcon";

export type AuthDotState = {
  platform: Platform;
  signedIn: boolean;
  username: string;
};

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
  onOpenTab: (request?: { platform: Platform; channel: string }) => void;
  channelInputRef: RefObject<HTMLInputElement>;
  mainMenuOpen: boolean;
  menuDropdownRef: RefObject<HTMLDivElement>;
  menuButtonRef: RefObject<HTMLButtonElement>;
  onToggleMenu: () => void;
  menuPanel: ReactNode;
  mentionPillCount: number;
  authDots?: AuthDotState[];
};

const RefreshIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M14 8a6 6 0 1 1-1.76-4.24" />
    <polyline points="14 2 14 6 10 6" />
  </svg>
);

const PlusIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <line x1="8" y1="3" x2="8" y2="13" />
    <line x1="3" y1="8" x2="13" y2="8" />
  </svg>
);

const MenuIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <line x1="3" y1="4" x2="13" y2="4" />
    <line x1="3" y1="8" x2="13" y2="8" />
    <line x1="3" y1="12" x2="13" y2="12" />
  </svg>
);

export function ChatShellTopBar({
  isSimpleMode,
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
  authDots,
}: ChatShellTopBarProps) {
  const dots = authDots ?? [];
  const parsedChannelInput = parseChannelInput(channelInput, platformInput);
  const hasChannelInput = channelInput.trim().length > 0;
  const platformFallbackNeeded =
    hasChannelInput && !parsedChannelInput.detected;
  const detectedPlatformAvailable = availablePlatforms.includes(
    parsedChannelInput.platform,
  );
  const detectedPlatformName = platformDisplayName(parsedChannelInput.platform);

  const handleChannelInputChange = (value: string) => {
    onChannelInputChange(value);
    const nextParsed = parseChannelInput(value, platformInput);
    if (
      nextParsed.detected &&
      availablePlatforms.includes(nextParsed.platform) &&
      nextParsed.platform !== platformInput
    ) {
      onPlatformChange(nextParsed.platform);
    }
  };

  const submitChannelInput = () => {
    if (!parsedChannelInput.channel) {
      onOpenTab();
      return;
    }
    onOpenTab({
      platform: parsedChannelInput.platform,
      channel: parsedChannelInput.channel,
    });
  };

  return (
    <header className="topbar topbar-shell">
      <div className="topbar-shell__brand-zone">
        <strong className="topbar-shell__wordmark">Chatrix</strong>
        {dots.length > 0 ? (
          <ul className="topbar-shell__auth-dots" aria-label="Account status">
            {dots.map((dot) => (
              <li key={dot.platform}>
                <button
                  type="button"
                  className={
                    dot.signedIn
                      ? `auth-dot auth-dot--${dot.platform} auth-dot--on`
                      : `auth-dot auth-dot--${dot.platform}`
                  }
                  title={
                    dot.signedIn
                      ? `${platformDisplayName(dot.platform)}: ${
                          dot.username || "signed in"
                        } - click for settings`
                      : `${platformDisplayName(dot.platform)}: not signed in - click for settings`
                  }
                  aria-label={
                    dot.signedIn
                      ? `${platformDisplayName(dot.platform)} signed in as ${
                          dot.username || "user"
                        }`
                      : `${platformDisplayName(dot.platform)} not signed in`
                  }
                  onClick={onToggleMenu}
                >
                  <span className="auth-dot__indicator" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <form
        className="channel-form channel-form--shell"
        onSubmit={(event) => {
          event.preventDefault();
          submitChannelInput();
        }}
      >
        <input
          ref={channelInputRef}
          value={channelInput}
          onChange={(event) => handleChannelInputChange(event.target.value)}
          placeholder="Paste live URL or type username"
          aria-label="Channel or live URL"
          autoCapitalize="off"
          autoCorrect="off"
        />
        {platformFallbackNeeded ? (
          <details className="platform-picker platform-picker--fallback">
            <summary aria-label="Choose platform for username">
              <span className="platform-picker__value">
                <PlatformIcon
                  platform={platformInput}
                  size="sm"
                  showBackground
                />
                <span>As {platformDisplayName(platformInput)}</span>
              </span>
              <span className="platform-picker__caret" aria-hidden="true">
                v
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
        ) : parsedChannelInput.detected ? (
          <span
            className={
              detectedPlatformAvailable
                ? "channel-form__detected-platform"
                : "channel-form__detected-platform channel-form__detected-platform--disabled"
            }
            aria-label={`Detected platform ${detectedPlatformName}`}
            title={
              detectedPlatformAvailable
                ? `Detected ${detectedPlatformName}`
                : `${detectedPlatformName} is disabled in Settings`
            }
          >
            <PlatformIcon
              platform={parsedChannelInput.platform}
              size="sm"
              showBackground
            />
            <span>{detectedPlatformName}</span>
          </span>
        ) : null}
        <button
          type="submit"
          className="topbar-shell__submit topbar-shell__icon-btn"
          aria-label="Open tab"
          title="Open tab"
        >
          <PlusIcon />
        </button>
      </form>

      <div className="top-actions topbar-shell__actions">
        <button
          type="button"
          className="topbar-shell__icon-btn topbar-shell__refresh"
          onClick={onRefresh}
          disabled={refreshDisabled}
          aria-label="Refresh current tab"
          title={
            refreshDisabled
              ? "Open a tab first"
              : refreshingActiveTab
                ? "Refreshing..."
                : "Refresh current tab"
          }
        >
          <RefreshIcon />
        </button>
        <div
          className={mainMenuOpen ? "menu-dropdown open" : "menu-dropdown"}
          ref={menuDropdownRef}
        >
          <button
            ref={menuButtonRef}
            type="button"
            className="menu-dropdown-trigger topbar-shell__menu-trigger topbar-shell__icon-btn"
            aria-haspopup="menu"
            aria-expanded={mainMenuOpen}
            aria-label="Open settings"
            title="Settings (Ctrl+,)"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onToggleMenu();
            }}
          >
            <MenuIcon />
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
