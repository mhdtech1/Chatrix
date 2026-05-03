# Handoff prompt for the next agent (Codex)

Copy the section below into your Codex session as the opening prompt. It's
self-contained and doesn't assume any prior conversation.

---

You are picking up work on **Chatrix**, an Electron + Vite + React + TypeScript
desktop app for unified live-stream chat across Twitch, Kick, YouTube, and
TikTok. The repo is `mhdtech1/Chatrix` on GitHub. Your working tree is
`C:\Users\mazen\Documents\New folder\Chatrix` (Windows). Latest released
version is **v1.0.23**; main branch is at the same commit.

Read these documents first — they're the canonical context:

- `README.md` — install / dev / build / GCP-style YouTube setup.
- `docs/UI_OVERHAUL.md` — the design spec the recent work has been following.
  Phases 1–5 plus the topbar overhaul + onboarding redesign + Settings split
  ship under v1.0.15 → v1.0.23.
- `apps/desktop/src/main/runtime.ts` — *all* main-process logic lives here.
  ~3,700 lines, intentionally not yet decomposed.
- `apps/desktop/src/renderer/ui/layouts/ChatShell.tsx` — the giant React
  layout (~8,200 LOC, ~200 hook calls). Pure formatters were extracted to
  `apps/desktop/src/renderer/utils/chatFormatting.ts`. The larger
  badge/role/sanitizer helpers are still inline.

## Repo layout

- `apps/desktop` — the Electron app (main / preload / renderer).
- `apps/kick-broker` — small Node service for Kick OAuth token exchange.
- `apps/site` — small marketing/site app.
- `apps/ios` — Expo iOS shell.
- `packages/chat-core` — shared chat adapter types and the YouTube /
  Twitch / Kick / TikTok adapters. Imported by the desktop app's renderer.

## Conventions you must follow

- **Token system**. Use the canonical design tokens in
  `apps/desktop/src/renderer/styles/variables.css`: one accent
  (`--accent: #24d0a2`), three surface levels
  (`--surface-app/panel/overlay`), two border weights
  (`--border-soft/strong`), three radii (`--radius-control` 4 / `--radius-panel`
  8 / `--radius-overlay` 12), three motion durations + one easing in
  `motion.css`. Don't introduce new tokens without a clear reason.
- **Back-compat aliases** in the same file map legacy variable names from
  the still-large `apps/desktop/src/renderer/styles.css` (3,731 LOC) to
  the canonical ones. As you migrate selectors out of `styles.css` into
  the modular sheets, drop the corresponding aliases.
- **Settings precedence**: `process.env.X` overrides the value in the
  settings store, which overrides the hardcoded `MANAGED_*` defaults in
  `runtime.ts`. The `.env` loader is in `apps/desktop/src/main/main.ts`
  — in dev it walks up from `process.cwd()`; in packaged builds
  (`app.isPackaged`) it only reads from `app.getPath('userData')` for
  safety.
- **Simple mode is the default**. New users see no account-strip, no
  analytics-strip, no quick-actions row, no quick-mod action rail, no
  dock sidebar. Anything you add should respect that — gate advanced UI
  behind `isAdvancedMode` or hide it via `.chat-shell.simple` rules in
  `modern.css`.
- **Settings sidebar categories** (`ChatShellMenuContent.tsx`):
  Appearance, Layout, Moderation, Accounts, Search & Filters, Session,
  Updates. Default active category is Appearance. New settings UI
  should attach to one of these — don't introduce a new top-level
  category lightly.
- **Keyboard shortcuts**: `Ctrl/Cmd+,` opens Settings;
  `Ctrl/Cmd+K` opens the command palette; `Ctrl/Cmd+Tab` cycles tabs;
  `Esc` closes overlays. Don't add new shortcuts without registering
  them somewhere consistent.
- **Tests**: `apps/desktop/tests/unit/` — vitest, currently 94 tests
  green. Run `pnpm --filter @chatrix/desktop test` after every change.
  If you change a component's accessible name, update the test.
- **IPC validation**: every renderer-supplied payload in
  `apps/desktop/src/main/ipc/` must be type-checked, length-bounded
  and character-class-restricted before being forwarded to platform
  clients. `MODERATION_ACT` is the canonical example (see
  `chatHandlers.ts`). Don't accept-and-spread an `unknown` payload.
- **HTTP body caps**: outbound `fetch()` calls that read text or JSON
  must use `readResponseTextCapped` from `main/utils/http.ts`
  (defaults: 2 MiB JSON, 5 MiB HTML). `fetchJsonOrThrow` does this
  automatically.
- **Commits**: short conventional-commit style messages
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
| 1.0.16 | Settings sidebar (replaces the giant scroll), command palette (Cmd-K) with ~15 commands, simple-mode hides chrome, pure helpers extracted to `utils/chatFormatting.ts`, micro-interactions. |
| 1.0.17 | Drop legacy "command" visual mode toggle. Convert main menu popover into a full-screen Settings page with backdrop. |
| 1.0.18 | Topbar overhaul — text buttons → 30 px icon buttons (refresh / plus / hamburger), small wordmark, per-platform auth-status dots (purple/green/red/pink), tab strip flush against topbar, Quick Mod hidden in simple mode. |
| 1.0.19 | URL-aware channel input — paste a Twitch / Kick / YouTube / TikTok URL and the platform is auto-detected. Topbar shows a "Detected" indicator. |
| 1.0.20 | Security pass #1 — response body size caps (2 MiB JSON / 5 MiB HTML) via new `readResponseTextCapped`; YouTube web fallback regex format validators (api key / client version / visitor data / continuation); strict per-field validation on the `MODERATION_ACT` IPC handler; `encodeURIComponent` on YouTube URL path segments. |
| 1.0.21 | Security pass #2 — Kick lookup `BrowserWindow` runs in an isolated `chatrix-kick-lookup` session partition (no real cookie inheritance); `.env` cwd-walk disabled in packaged builds (`app.isPackaged`), only `userData/.env` is read. |
| 1.0.22 | Settings split: "Workspace" → "Appearance" (theme, density, text scale, welcome mode, replay window, workspace preset/mode) + "Layout" (panels, stream sync, tab groups, collaboration, layouts). Onboarding redesigned — first-run shows one row per platform with sign-in CTAs, read-only demoted to a "Skip" link. |
| 1.0.23 | Twitch hybrid auth — when `TWITCH_CLIENT_SECRET` is set, sign-in uses authorization-code flow with PKCE belt-and-suspenders (token exchanged server-side, never appears in the loopback URL). Without the secret, falls back to the legacy implicit grant unchanged. **Test sign-in after upgrading**, since the OAuth flow can only be verified end-to-end. |

## What's still on the table — pick from these

Sorted by impact per hour. Each is its own release.

1. **Migrate `apps/desktop/src/renderer/styles.css` (3,731 LOC).**
   Highest-value remaining code-health work. The legacy mega-CSS still
   owns lots of selectors that conflict with the new tokens (the
   menu-positioning bug fixed in 1.0.17 came from exactly this). Split
   it into per-component files in `renderer/styles/`, replace its
   variable names with the canonical tokens, then drop the back-compat
   aliases from `variables.css`. This needs visual smoke-testing of
   every screen — don't rush. Plan ~1–2 sittings.
2. **Decompose `ChatShell.tsx`** (still 8,200 LOC, ~200 hook calls).
   Phase 3 of the overhaul only extracted pure formatters. Next safe
   extractions identified by a code review:
   - The badge / role / sanitizer helpers around lines 312–1178.
   - A `useAccountProfiles` hook for the account-profile state cluster.
   - A `ChatModerationLayer` subcomponent for the moderation popovers.
   See `docs/UI_OVERHAUL.md` for the full split plan.
3. **Twitch full PKCE migration** (security follow-up). 1.0.23 ships a
   hybrid: code+PKCE flow when `TWITCH_CLIENT_SECRET` is configured,
   else legacy implicit grant. Twitch does not accept PKCE-without-
   secret today; closing the implicit fallback fully would either
   require rolling a Twitch token broker (like the Kick one in
   `apps/kick-broker`) or accepting "secret embedded in app binary"
   risk. Decide which.
4. **Accessibility pass.** Real Tab order through the topbar +
   sidebar, ARIA labels on all icon-only buttons, focus-visible
   everywhere using the universal ring in `motion.css`. Spot-check
   with screen reader.
5. **Multi-account.** True concurrent multi-account across all
   platforms (sign in to two Twitch accounts at once, etc.) was
   scoped at ~1–2 weeks in the prior session and deferred. Settings
   schema becomes per-account-keyed; every send/auth IPC takes an
   account ID; tabs need an "as account" picker. Don't start without
   a written plan.

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
2. Run `pnpm install && pnpm --filter @chatrix/desktop test` to
   confirm 94/94 still pass.
3. Open the app once with `pnpm dev` to see the current state. Try
   Cmd-, (Settings) and Cmd-K (palette).
4. Pick one of the items above and propose a scope before writing
   code. Don't start a multi-file refactor without checking in.

When you ship, follow the existing release cadence:
1. Bump `apps/desktop/package.json` version.
2. Build, test, smoke-test (`node scripts/smoke-test.mjs` should
   exit 0).
3. Commit with a conventional-commit message.
4. `pnpm build:win:x64` then `gh release create vX.Y.Z` with the
   four artifacts.

Now ask me what to work on first, or pick from the list above.
