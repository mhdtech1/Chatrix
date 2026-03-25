import { PlatformIcon } from "../common/PlatformIcon";

type Props = {
  show: boolean;
  hasPrimaryAuth: boolean;
  hasTwitchAuth: boolean;
  hasKickAuth: boolean;
  isAdvancedMode: boolean;
  youtubeAlphaEnabled: boolean;
  tiktokAlphaEnabled: boolean;
  mentionInboxCount: number;
  twitchSignedIn: boolean;
  twitchUsername: string;
  kickSignedIn: boolean;
  kickUsername: string;
  closeClosestDetailsMenu: () => void;
};

export function ChatShellAccountStrip({
  show,
  hasPrimaryAuth,
  hasTwitchAuth,
  hasKickAuth,
  isAdvancedMode,
  youtubeAlphaEnabled,
  tiktokAlphaEnabled,
  mentionInboxCount,
  twitchSignedIn,
  twitchUsername,
  kickSignedIn,
  kickUsername,
  closeClosestDetailsMenu,
}: Props) {
  if (!show) return null;

  return (
    <div className="account-strip">
      <>
        <span className={hasPrimaryAuth ? "account-pill on" : "account-pill"}>
          {hasPrimaryAuth ? "Connected:" : "Not connected"}
          {hasTwitchAuth ? " Twitch" : ""}
          {hasKickAuth ? " Kick" : ""}
        </span>
        {isAdvancedMode && (youtubeAlphaEnabled || tiktokAlphaEnabled) ? (
          <span className="account-pill">
            Read-only:
            {youtubeAlphaEnabled ? " YouTube" : ""}
            {tiktokAlphaEnabled ? " TikTok" : ""}
          </span>
        ) : null}
        {mentionInboxCount > 0 ? (
          <span className="account-pill on">Mentions: {mentionInboxCount}</span>
        ) : null}
        {isAdvancedMode ? (
          <details className="account-strip-more">
            <summary>Details</summary>
            <div className="account-strip-more-menu">
              <div className="menu-popover-header">
                <span>Connections</span>
                <button
                  type="button"
                  className="menu-close-button"
                  onClick={closeClosestDetailsMenu}
                  aria-label="Close connections details"
                >
                  ×
                </button>
              </div>
              <span
                className={twitchSignedIn ? "account-pill on" : "account-pill"}
              >
                <PlatformIcon platform="twitch" size="sm" showBackground />
                Twitch: {twitchUsername || "off"}
              </span>
              <span
                className={kickSignedIn ? "account-pill on" : "account-pill"}
              >
                <PlatformIcon platform="kick" size="sm" showBackground />
                Kick typing: {kickUsername || "off"}
              </span>
              {youtubeAlphaEnabled ? (
                <span className="account-pill on">
                  <PlatformIcon platform="youtube" size="sm" showBackground />
                  YouTube: read-only
                </span>
              ) : null}
              {tiktokAlphaEnabled ? (
                <span className="account-pill on">
                  <PlatformIcon platform="tiktok" size="sm" showBackground />
                  TikTok: read-only
                </span>
              ) : null}
            </div>
          </details>
        ) : null}
      </>
    </div>
  );
}
