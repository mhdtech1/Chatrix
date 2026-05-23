# Handoff prompt for the next agent (Codex)

Copy the section below into your Codex session as the opening prompt. It's
self-contained and doesn't assume any prior conversation.

---

You are picking up work on **Chatrix**, an Electron + Vite + React + TypeScript
desktop app for unified live-stream chat across Twitch, Kick, YouTube, and
TikTok. The repo is `mhdtech1/Chatrix` on GitHub. Your working tree is
`C:\Users\mazen\Documents\New folder\Chatrix` (Windows). Latest released
version is **v1.0.29**; main is at the same commit (with one extra polish
commit on top — `5400634`).

The previous agent left mid-way through a layout overhaul. **Your top
priority is finishing F-α (the new Discord-style shell)** because it
shipped looking rough and isn't usable yet. See "What's broken right
now" below.

Read these documents first — they're the canonical context:

- `README.md` — install / dev / build / GCP-style YouTube setup.
- `docs/UI_OVERHAUL.md` — the design spec the prior overhaul followed.
  Phases 1–5 + topbar overhaul + onboarding + Settings split + Twitch
  hybrid auth shipped under v1.0.15 → v1.0.23.
- `docs/MOCKUPS.html` — open this in a browser. Mockup F is the
  target the new layout is trying to hit. Mockup 0 is the classic
  shell for comparison. Verify visuals against F as you fix things.
- `apps/desktop/src/main/runtime.ts` — main-process logic. Was a single
  3.7k-LOC file; the previous agent extracted some pieces in
  `a4c4855 refactor(desktop): modularize runtime and chat shell helpers`.
- `apps/desktop/src/renderer/ui/layouts/ChatShell.tsx` — the giant
  layout (~8.5k LOC, ~200 hooks). Pure formatters live in
  `apps/desktop/src/renderer/utils/chatFormatting.ts`.
- `apps/desktop/src/renderer/ui/components/NewShell/NewShellLayout.tsx`
  — the new chrome component (rail + channel list + user strip +
  collapsible right panel). Shipped under v1.0.29 behind
  `settings.newLayout`.

## What's broken right now in the new layout (F-α)

The flag is shipped but the experience is rough. Owner feedback so far:

1. **"It looks super ugly"** — visual quality is below the bar. Cards
   in the right panel were boxed-within-boxes; that's been flattened
   in `5400634`. Other likely sore spots:
   - The chat workspace center still uses the *classic* main-layout
     padding/borders/scroll behaviour. The classic chrome is hidden
     via CSS in `new-shell.css` (`.chat-shell.with-new-shell .topbar-shell`
     etc.) but the workspace's own inner margins / tab-meta header
     read as leftover dead space.
   - No real "chat header" in the workspace (live badge / viewer
     count / category / quick mod buttons). The mockup F has it; the
     code does not. F-β is supposed to add it inside the workspace
     area, replacing what the classic tab-bar used to show.
   - The channel list rows look fine in isolation but the *whole*
     transition from rail (56 px) → channels (220 px) → classic
     workspace (with its own padding) is visually inconsistent.
2. **Right-click context menu on chat rows doesn't work in the new
   layout.** The rail / channel list / right panel all sit in
   `position: absolute` overlays inside `.chat-shell.with-new-shell`,
   and `.chat-shell` has an outer `onClick={() => setMessageMenu(null)}`
   that wins on mousedown propagation. Right-click works in the
   classic shell because of how `ChatShellOverlayLayer` positions
   `messageMenu`; in the new layout the menu probably renders but is
   immediately closed, or its z-index is below the absolute overlays.
   Verify in dev tools. Likely fix: in `ChatShell.tsx`, gate the
   outer `onClick` so it doesn't close `messageMenu` when the click
   is the context-menu trigger; bump `.message-menu` z-index above
   the new-shell sidebars (rail z=30, channels z=25, context z=20).
3. **Channel list lacks live indicators.** The mockup shows a red
   glowing dot per row when the channel is live. The current
   implementation just shows mention / unread badges. Hook in
   viewer-count / "is live" signal from the chat-core adapter status
   per source. Acceptable to land as a separate refinement.
4. **No chat header.** As above — the planned F-β scope.
5. **`docs/MOCKUPS.html` is on disk** and worth referencing as you
   tighten the visuals. Mockup E is the rail+channels only; F adds
   the right panel with collapsible sections.

## Repo layout

- `apps/desktop` — the Electron app (main / preload / renderer).
- `apps/kick-broker` — small Node service for Kick OAuth token exchange.
- `apps/site` — small marketing/site app.
- `apps/ios` — Expo iOS shell.
- `packages/chat-core` — shared chat adapter types and the YouTube /
  Twitch / Kick / TikTok adapters. Imported by the desktop app's renderer.

## Conventions you must follow

- **Token system**. Canonical design tokens live in
  `apps/desktop/src/renderer/styles/variables.css`: one accent
  (`--accent: #24d0a2`), three surface levels
  (`--surface-app/panel/overlay`), two border weights
  (`--border-soft/strong`), three radii (`--radius-control` 4 /
  `--radius-panel` 8 / `--radius-overlay` 12), three motion durations
  + one easing in `motion.css`. Don't introduce new tokens without a
  clear reason.
- **Back-compat aliases** in the same file map legacy variable names
  from the still-large `apps/desktop/src/renderer/styles.css`
  (3,731 LOC) to the canonical ones. As you migrate selectors out of
  `styles.css` into the modular sheets, drop the corresponding aliases.
- **Settings precedence**: `process.env.X` overrides the value in the
  settings store, which overrides the hardcoded `MANAGED_*` defaults
  in `runtime.ts`. The `.env` loader is in `apps/desktop/src/main/main.ts`
  — in dev it walks up from `process.cwd()`; in packaged builds
  (`app.isPackaged`) it only reads from `app.getPath('userData')`.
- **Simple mode is the default**. New users see no account-strip, no
  analytics-strip, no quick-actions row, no quick-mod action rail, no
  dock sidebar. Anything you add should respect that — gate advanced
  UI behind `isAdvancedMode` or hide it via `.chat-shell.simple` rules
  in `modern.css`.
- **New-layout flag**: `settings.newLayout` (boolean, default false)
  opts a user into the new Discord-style shell. When on,
  `.chat-shell.with-new-shell` is added to the root and CSS hides the
  classic chrome. The new chrome is rendered as absolute-positioned
  siblings inside `.chat-shell`. See `new-shell.css` and
  `NewShellLayout.tsx`.
- **Settings sidebar categories** (`ChatShellMenuContent.tsx`):
  Appearance, Layout, Moderation, Accounts, Search & Filters, Session,
  Updates. Default active category is Appearance. New settings UI
  attaches to one of these — don't introduce a new top-level category
  lightly. The "New layout (preview)" toggle lives in Appearance.
- **Keyboard shortcuts**: `Ctrl/Cmd+,` opens Settings;
  `Ctrl/Cmd+K` opens the command palette; `Ctrl/Cmd+Tab` cycles tabs;
  `Esc` closes overlays. Don't add new shortcuts without registering
  them somewhere consistent.
- **Tests**: `apps/desktop/tests/unit/` — vitest, currently 157 tests
  green. Run `pnpm --filter @chatrix/desktop test` after every change.
- **IPC validation**: every renderer-supplied payload in
  `apps/desktop/src/main/ipc/` must be type-checked, length-bounded
  and character-class-restricted before being forwarded to platform
  clients. `MODERATION_ACT` is the canonical example.
- **HTTP body caps**: outbound `fetch()` calls that read text or JSON
  must use `readResponseTextCapped` from `main/utils/http.ts`
  (defaults: 2 MiB JSON, 5 MiB HTML).
- **Commits**: short conventional-commit messages
  (`feat(ui): ...`, `fix(youtube): ...`, `chore: ...`, `sec: ...`).
  Always include `Co-Authored-By: <model name> <noreply@anthropic.com>`.
  Bump the version in `apps/desktop/package.json` for any user-visible
  change.
- **Releases**: each user-visible change ships as a GitHub release with
  the Windows installer attached. Build with `pnpm build:win:x64`
  (requires Windows Developer Mode ON for the symlink extraction).
  Use the `gh` CLI to create the release with `Chatrix-win.exe`,
  `Chatrix-win.exe.blockmap`, `latest.yml`, `stable.yml` attached.
  Without those four files, the auto-updater on installed apps 404s.

## What's done

| Release | What landed |
|---|---|
| 1.0.15 | Visual refresh — token consolidation, motion system, focus ring, polished component sheets. |
| 1.0.16 | Settings sidebar (replaces giant scroll), command palette (Cmd-K) with ~15 commands, simple-mode hides chrome, pure helpers extracted, micro-interactions. |
| 1.0.17 | Drop legacy "command" visual mode toggle. Convert main menu popover into a full-screen Settings page with backdrop. |
| 1.0.18 | Topbar overhaul — text buttons → 30 px icon buttons, small wordmark, per-platform auth-status dots, tab strip flush against topbar, Quick Mod hidden in simple mode. |
| 1.0.19 | URL-aware channel input — paste a Twitch / Kick / YouTube / TikTok URL and the platform is auto-detected. Topbar shows a "Detected" indicator. |
| 1.0.20 | Security pass #1 — response body size caps, YouTube web fallback regex validators, strict `MODERATION_ACT` IPC validation, `encodeURIComponent` on YouTube URL path segments. |
| 1.0.21 | Security pass #2 — Kick lookup `BrowserWindow` runs in an isolated session partition; `.env` cwd-walk disabled in packaged builds. |
| 1.0.22 | Settings "Workspace" split into "Appearance" + "Layout". Onboarding redesigned with one row per platform. |
| 1.0.23 | Twitch hybrid auth — when `TWITCH_CLIENT_SECRET` is set, sign-in uses authorization-code flow with PKCE belt-and-suspenders. Otherwise legacy implicit grant. |
| 1.0.24 → 1.0.27 | (Various polish + accessibility + refactor work landed via PRs / direct commits while the previous agent was away.) |
| 1.0.28 | `refactor(desktop): modularize runtime and chat shell helpers`, plus updater configurability, random ID hardening, restored live chat preview helpers. |
| 1.0.29 | **F-α — Discord-style new layout, opt-in.** Platform rail, channel list grouped by platform, user strip, collapsible right context panel (Mentions / Mod actions / Health). Settings → Appearance → "New layout (preview)". Default off. Issues above. |

## What's still on the table — pick from these

Sorted by importance.

1. **Finish F-α / F-β** (your top priority).
   - Fix right-click context menu under new layout (#2 above).
   - Add an in-workspace chat header: channel name + live badge +
     viewer count + category + uptime + quick mod buttons. This is
     mockup F's center column. Likely lives inside ChatWorkspace or
     a new ChatHeader component rendered before the message feed.
   - Tighten the visual seam between the new chrome (rail / channels)
     and the classic workspace center — the inner padding /
     `active-tab-meta` band currently reads as wasted space.
   - Add a live indicator on channel rows.
   - Once visuals + interactions are right, flip the default for new
     users and keep "Classic layout" as a toggle for a release or two,
     then remove the classic shell.
2. **Migrate `apps/desktop/src/renderer/styles.css` (3,731 LOC)** into
   the modular sheets. The legacy CSS still owns selectors that
   conflict with the new tokens (this is a frequent visual-regression
   source). Split into per-component files in `renderer/styles/`,
   replace its variable names with the canonical tokens, drop the
   back-compat aliases. Plan ~1–2 sittings.
3. **Decompose `ChatShell.tsx`** (still ~8.5k LOC, ~200 hooks). Phase 3
   of the overhaul extracted only the pure formatters. Next safe
   extractions: badge / role / sanitizer helpers around lines 312–
   1178; a `useAccountProfiles` hook for the account-profile state
   cluster; a `ChatModerationLayer` subcomponent for the moderation
   popovers. See `docs/UI_OVERHAUL.md` for the full split plan.
4. **Twitch full PKCE migration** (security follow-up). 1.0.23 ships a
   hybrid. Closing the implicit fallback fully would either require
   rolling a Twitch token broker (like the Kick one in
   `apps/kick-broker`) or accepting "secret embedded in app binary"
   risk. Decide which.
5. **Multi-account.** True concurrent multi-account across all
   platforms was scoped at ~1–2 weeks in a prior session and deferred.
   Settings schema becomes per-account-keyed; every send/auth IPC
   takes an account ID; tabs need an "as account" picker. Don't start
   without a written plan.

## Tooling notes

- Package manager: `pnpm@9.12.3` (workspace).
- Node 20.18 (bundled with Electron 31.7.7).
- `pnpm dev` from repo root runs Vite + tsc-watch + Electron under
  `concurrently`. Closing the window exits Electron 0 → concurrently
  kills the rest with non-zero → wrapper exits 1. **That's normal**;
  it's not a bug.
- Building Windows installers requires Developer Mode ON
  (Settings → Privacy & security → For developers → Developer Mode).
  Otherwise `electron-builder` fails extracting the macOS code-sign
  symlinks from `winCodeSign-*.7z`. Already enabled on this machine.
- `gh` CLI is installed and authenticated to mhdtech1 with `repo`
  scope. Use `gh release create vX.Y.Z --notes-file ...` with the
  four installer artifacts attached. Free electron locks before a
  build with `Get-Process electron | Stop-Process -Force`.

## How to start

1. Read `docs/UI_OVERHAUL.md` end-to-end.
2. Open `docs/MOCKUPS.html` in your browser. Mockup F is the target.
3. Run `pnpm install && pnpm --filter @chatrix/desktop test` to
   confirm 157/157 still pass.
4. Open the app with `pnpm dev`. Try Settings → Appearance → toggle
   "New layout (preview)". Compare to mockup F. Fix the right-click
   menu first (smallest, most annoying); then tighten visuals; then
   add the chat header.
5. Don't start a multi-file refactor without checking in.

When you ship, follow the existing release cadence:
1. Bump `apps/desktop/package.json` version.
2. Build, test, smoke-test (`node scripts/smoke-test.mjs` should
   exit 0).
3. Commit with a conventional-commit message.
4. `pnpm build:win:x64` then `gh release create vX.Y.Z` with the
   four artifacts.

Now ask me what to work on first, or pick from the list above.
