import type { Dispatch, SetStateAction } from "react";
import type { Platform } from "../../../../shared/types";

type GuideOverlaysProps = {
  rebrandAnnouncementOpen: boolean;
  dismissRebrandAnnouncement: () => void;
  openQuickTour: () => void;
  setupWizardOpen: boolean;
  setupWizardStep: number;
  setSetupWizardStep: Dispatch<SetStateAction<number>>;
  setSetupWizardDismissed: Dispatch<SetStateAction<boolean>>;
  setSetupWizardOpen: (open: boolean) => void;
  theme: "dark" | "light" | "classic";
  persistTheme: (theme: "dark" | "light" | "classic") => Promise<void>;
  signInTwitch: () => Promise<void>;
  signInKick: () => Promise<void>;
  authBusy: Platform | null;
  twitchConnected: boolean;
  kickConnected: boolean;
  kickWriteAuthConfigured: boolean;
  kickReadOnlyAvailable: boolean;
  setupPrimaryConnected: boolean;
  focusChannelBar: () => void;
  openOwnChannelTab: (platform: "twitch" | "kick") => Promise<void>;
  twitchUsername?: string;
  kickUsername?: string;
  tabsCount: number;
  setupFirstTabReady: boolean;
  setupMessageReady: boolean;
  setupCanFinish: boolean;
  focusComposer: () => void;
  skipSetupWizard: () => Promise<void>;
  completeSetupWizard: () => Promise<void>;
  quickTourOpen: boolean;
  setQuickTourOpen: (open: boolean) => void;
};

export const GuideOverlays = ({
  rebrandAnnouncementOpen,
  dismissRebrandAnnouncement,
  openQuickTour,
  setupWizardOpen,
  setupWizardStep,
  setSetupWizardStep,
  setSetupWizardDismissed,
  setSetupWizardOpen,
  theme,
  persistTheme,
  signInTwitch,
  signInKick,
  authBusy,
  twitchConnected,
  kickConnected,
  kickWriteAuthConfigured,
  kickReadOnlyAvailable,
  setupPrimaryConnected,
  focusChannelBar,
  openOwnChannelTab,
  twitchUsername,
  kickUsername,
  tabsCount,
  setupFirstTabReady,
  setupMessageReady,
  setupCanFinish,
  focusComposer,
  skipSetupWizard,
  completeSetupWizard,
  quickTourOpen,
  setQuickTourOpen,
}: GuideOverlaysProps) => (
  <>
    {rebrandAnnouncementOpen ? (
      <div className="guide-overlay rebrand-overlay">
        <div
          className="guide-modal rebrand-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Chatrix rebrand announcement"
        >
          <div className="guide-header">
            <div>
              <strong>We are rebranding to Chatrix!</strong>
              <span>Same app, new name.</span>
            </div>
            <button
              type="button"
              className="ghost"
              onClick={dismissRebrandAnnouncement}
            >
              Close
            </button>
          </div>
          <div className="guide-body">
            <div className="guide-section">
              <h3>What is changing</h3>
              <p>
                MultiChat is becoming <strong>Chatrix</strong>. Your tabs,
                settings, and saved chat history stay with you.
              </p>
            </div>
            <div className="guide-section">
              <h3>What stays the same</h3>
              <ul>
                <li>All your connected platforms and layouts still work.</li>
                <li>
                  Existing local settings and secure auth storage migrate
                  automatically.
                </li>
                <li>
                  The current GitHub repo and release flow remain live while the
                  rename rolls out.
                </li>
              </ul>
            </div>
          </div>
          <div className="guide-footer">
            <button
              type="button"
              className="ghost"
              onClick={() => {
                dismissRebrandAnnouncement();
                openQuickTour();
              }}
            >
              Open Quick Tour
            </button>
            <button type="button" onClick={dismissRebrandAnnouncement}>
              Continue to Chatrix
            </button>
          </div>
        </div>
      </div>
    ) : null}

    {setupWizardOpen ? (
      <div
        className="guide-overlay"
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="guide-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Setup Wizard"
        >
          <div className="guide-header">
            <div>
              <strong>Welcome to Chatrix</strong>
              <span>Step {setupWizardStep + 1} of 3</span>
            </div>
            <button
              type="button"
              className="ghost"
              onClick={() => {
                setSetupWizardDismissed(true);
                setSetupWizardOpen(false);
              }}
            >
              Close
            </button>
          </div>
          <div className="guide-body">
            {setupWizardStep === 0 ? (
              <div className="guide-section">
                <h3>Connect an account</h3>
                <p>
                  Sign into Twitch or Kick to unlock typing, moderation tools,
                  and full chat controls.
                </p>
                <label className="menu-inline">
                  Theme
                  <select
                    value={theme}
                    onChange={(event) =>
                      void persistTheme(
                        event.target.value as "dark" | "light" | "classic",
                      )
                    }
                  >
                    <option value="dark">Dark</option>
                    <option value="light">Light</option>
                    <option value="classic">Classic</option>
                  </select>
                </label>
                <div className="guide-actions">
                  <button
                    type="button"
                    onClick={() => void signInTwitch()}
                    disabled={authBusy !== null || twitchConnected}
                  >
                    {twitchConnected
                      ? "Twitch connected"
                      : authBusy === "twitch"
                        ? "Signing in Twitch..."
                        : "Connect Twitch"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void signInKick()}
                    disabled={authBusy !== null || kickConnected}
                  >
                    {kickConnected
                      ? "Kick connected"
                      : kickWriteAuthConfigured
                        ? authBusy === "kick"
                          ? "Signing in Kick..."
                          : "Connect Kick"
                        : "Kick read-only"}
                  </button>
                </div>
                <p className="guide-note">
                  Status:{" "}
                  {setupPrimaryConnected
                    ? "Connected"
                    : !kickWriteAuthConfigured && kickReadOnlyAvailable
                      ? "Kick is available in read-only mode. Connect Twitch for full write access."
                      : "Waiting for Twitch or Kick sign-in"}
                </p>
              </div>
            ) : null}
            {setupWizardStep === 1 ? (
              <div className="guide-section">
                <h3>Open your first tab</h3>
                <p>
                  Use the channel bar at the top to type a channel username and
                  open your first chat tab.
                </p>
                <div className="guide-actions">
                  <button type="button" onClick={focusChannelBar}>
                    Focus Channel Bar
                  </button>
                  <button
                    type="button"
                    onClick={() => void openOwnChannelTab("twitch")}
                    disabled={!twitchUsername}
                  >
                    Open My Twitch Tab
                  </button>
                  <button
                    type="button"
                    onClick={() => void openOwnChannelTab("kick")}
                    disabled={!kickUsername}
                  >
                    Open My Kick Tab
                  </button>
                </div>
                <p className="guide-note">
                  Tabs keep chats focused and fast: one tab per channel, with
                  merge available from tab right-click.
                </p>
                <p className="guide-note">
                  Status:{" "}
                  {setupFirstTabReady
                    ? `First tab ready (${tabsCount} open)`
                    : "Open at least one tab"}
                </p>
              </div>
            ) : null}
            {setupWizardStep === 2 ? (
              <div className="guide-section">
                <h3>Know the essentials</h3>
                <ul>
                  <li>
                    {setupPrimaryConnected ? "Done" : "Pending"}: Login to
                    Twitch or Kick.
                  </li>
                  <li>
                    {setupFirstTabReady ? "Done" : "Pending"}: Open your first
                    channel tab.
                  </li>
                  <li>
                    {setupMessageReady ? "Done" : "Optional"}: Send one test
                    message.
                  </li>
                </ul>
                <div className="guide-actions">
                  <button
                    type="button"
                    onClick={focusComposer}
                    disabled={!setupFirstTabReady}
                  >
                    Focus Composer
                  </button>
                </div>
                <p className="guide-note">
                  Finish unlocks after login + first tab. Test message is
                  optional.
                </p>
                <ul>
                  <li>
                    Use <strong>Refresh Tab</strong> in the top-left to
                    reconnect only the current tab.
                  </li>
                  <li>
                    Tabs show unread and mention badges while they are in the
                    background.
                  </li>
                  <li>
                    Press <strong>Ctrl/Cmd + Tab</strong> to cycle tabs quickly.
                  </li>
                  <li>
                    Open <strong>Menu → Open Quick Tour</strong> any time.
                  </li>
                </ul>
              </div>
            ) : null}
          </div>
          <div className="guide-footer">
            <button
              type="button"
              className="ghost"
              onClick={() => void skipSetupWizard()}
            >
              Skip for now
            </button>
            {setupWizardStep > 0 ? (
              <button
                type="button"
                className="ghost"
                onClick={() =>
                  setSetupWizardStep((previous) => Math.max(0, previous - 1))
                }
              >
                Back
              </button>
            ) : null}
            {setupWizardStep < 2 ? (
              <button
                type="button"
                onClick={() =>
                  setSetupWizardStep((previous) => Math.min(2, previous + 1))
                }
                disabled={
                  (setupWizardStep === 0 && !setupPrimaryConnected) ||
                  (setupWizardStep === 1 && !setupFirstTabReady)
                }
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void completeSetupWizard()}
                disabled={!setupCanFinish}
              >
                Finish setup
              </button>
            )}
          </div>
        </div>
      </div>
    ) : null}

    {quickTourOpen ? (
      <div className="guide-overlay" onClick={() => setQuickTourOpen(false)}>
        <div
          className="guide-modal quick-tour"
          role="dialog"
          aria-modal="true"
          aria-label="Quick Tour"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="guide-header">
            <div>
              <strong>Quick Tour</strong>
              <span>1 minute</span>
            </div>
            <button
              type="button"
              className="ghost"
              onClick={() => setQuickTourOpen(false)}
            >
              Close
            </button>
          </div>
          <div className="guide-body">
            <div className="guide-section">
              <h3>Tabs</h3>
              <ul>
                <li>Create a channel tab from the top bar.</li>
                <li>Right click a tab to merge tabs.</li>
                <li>Unread and mention badges appear on inactive tabs.</li>
              </ul>
            </div>
            <div className="guide-section">
              <h3>Messages</h3>
              <ul>
                <li>Search only filters the active tab.</li>
                <li>
                  If you scroll up, auto-scroll pauses and resumes after 15s of
                  inactivity, or instantly via Go to latest message.
                </li>
                <li>
                  Right-click a message to pin it in Chatrix for the current
                  tab.
                </li>
                <li>Use Quick Actions to start local polls per tab.</li>
              </ul>
            </div>
            <div className="guide-section">
              <h3>Moderation</h3>
              <ul>
                <li>
                  Moderation and snippets appear only in single-channel tabs
                  where you can moderate.
                </li>
                <li>
                  Right click messages for moderation and user log actions.
                </li>
              </ul>
            </div>
            <div className="guide-section">
              <h3>Stability</h3>
              <ul>
                <li>Use Refresh Tab to reconnect only the active tab.</li>
                <li>Use Menu for account health, updates, and filters.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    ) : null}
  </>
);
