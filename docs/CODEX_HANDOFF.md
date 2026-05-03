# Handoff prompt for the next agent (Codex)

Copy the section below into your Codex session as the opening prompt. It's
self-contained and doesn't assume any prior conversation.

---

You are picking up work on **Chatrix**, an Electron + Vite + React + TypeScript
desktop app for unified live-stream chat across Twitch, Kick, YouTube, and
TikTok. The repo is `mhdtech1/Chatrix` on GitHub. Your working tree is
`C:\Users\mazen\Documents\New folder\Chatrix` (Windows). Latest released
version is **v1.0.18**; main branch is at the same commit.

Read these documents first — they're the canonical context:

- `README.md` — install / dev / build / GCP-style YouTube setup.
- `docs/UI_OVERHAUL.md` — the design spec the recent work has been following.
  Phases 1–5 plus the topbar overhaul ship under v1.0.15 → v1.0.18.
- `apps/desktop/src/main/runtime.ts` — *all* main-process logic lives here.
  3,700-ish lines, intentionally not yet decomposed.
- `apps/desktop/src/renderer/ui/layouts/ChatShell.tsx` — the giant React
  layout (~8,200 LOC, ~200 hook calls). Pure formatters were recently
  extracted to `apps/desktop/src/renderer/utils/chatFormatting.ts`. The
  larger badge/role/sanitizer helpers are still inline.

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
  — it walks up from `process.cwd()` and also tries
  `app.getPath('userData')`.
- **Simple mode is the default**. New users see no account-strip, no
  analytics-strip, no quick-actions row, no quick-mod action rail, no
  dock sidebar. Anything you add should respect that — gate advanced UI
  behind `isAdvancedMode` or hide it via `.chat-shell.simple` rules in
  `modern.css`.
- **Keyboard shortcuts**: `Ctrl/Cmd+,` opens Settings;
  `Ctrl/Cmd+K` opens the command palette; `Ctrl/Cmd+Tab` cycles tabs;
  `Esc` closes overlays. Don't add new shortcuts without registering
  them somewhere consistent.
- **Tests**: `apps/desktop/tests/unit/` — vitest, currently 88 tests
  green. Run `pnpm --filter @chatrix/desktop test` after every change.
  If you change a component's accessible name, update the test.
- **Commits**: short conventional-commit style messages
  (`feat(ui): ...`, `fix(youtube): ...`, `chore: ...`). Always include
  `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>` —
  replace the model name with your own. Bump the version in
  `apps/desktop/package.json` for any user-visible change.
- **Releases**: each user-visible change ships as a GitHub release with
  the Windows installer attached. Build with `pnpm build:win:x64`
  (requires Windows Developer Mode ON for the symlink extraction).
  Use the `gh` CLI to create the release with `Chatrix-win.exe`,
  `Chatrix-win.exe.blockmap`, `latest.yml`, `stable.yml` attached.
  Without those four files, the auto-updater on installed apps 404s.

## What's done (recent UI overhaul)

| Release | What landed |
|---|---|
| 1.0.15 | Visual refresh — token consolidation, motion system, focus ring, polished component sheets. |
| 1.0.16 | Settings sidebar (replaces the giant scroll), command palette (Cmd-K) with ~15 commands, simple-mode hides chrome, pure helpers extracted to `utils/chatFormatting.ts`, tiny micro-interactions. |
| 1.0.17 | Drop legacy "command" visual mode toggle. Convert main menu popover into a full-screen Settings page with backdrop. |
| 1.0.18 | Topbar overhaul — text buttons → 30px icon buttons (refresh / plus / hamburger), small wordmark, per-platform auth-status dots (purple/green/red/pink), tab strip flush against topbar, Quick Mod hidden in simple mode. |

## What's still on the table — pick from these

Sorted by impact per hour. Each one is its own release.

1. **Smarter URL-aware channel input.** Today the topbar still has a
   `[Platform ▾] [Channel] [+]` form. Make pasting a URL
   (`twitch.tv/X`, `kick.com/Y`, `youtube.com/watch?v=…`,
   `youtube.com/@chan/live`) auto-detect the platform and channel.
   Falls back to the picker only if input is ambiguous (bare
   username). One field where there were three.
2. **Migrate `apps/desktop/src/renderer/styles.css` (3,731 LOC).** The
   legacy mega-CSS still owns lots of selectors that conflict with the
   new tokens (the menu-positioning bug fixed in 1.0.17 came from
   exactly this). Split it into per-component files in
   `renderer/styles/`, replace its variable names with the canonical
   tokens, then drop the back-compat aliases from `variables.css`.
   Pure code-health work; ship as one or two releases.
3. **Decompose `ChatShell.tsx`** (still 8,200 LOC, ~200 hook calls).
   Phase 3 of the overhaul only extracted pure formatters. Next safe
   extractions identified by a code review:
   - The badge / role / sanitizer helpers around lines 312–1178.
   - A `useAccountProfiles` hook for the account-profile state cluster.
   - A `ChatModerationLayer` subcomponent for the moderation popovers.
   See `docs/UI_OVERHAUL.md` for the full split plan.
4. **Hover-to-reveal chat actions.** Per-message moderation icons are
   currently always visible on each row. Show only on hover.
5. **Onboarding cleanup.** First-run users see a sparse empty state.
   Replace with "Connect your first account" → pick platform → trigger
   sign-in → add a tab.
6. **Accessibility pass.** Real Tab order through the topbar +
   sidebar, ARIA labels on all icon-only buttons, focus-visible
   everywhere using the universal ring in `motion.css`.
7. **Outstanding security findings** from a prior review (severity in
   parens, file:line):
   - High: Twitch sign-in still uses implicit grant via the
     `loopbackOAuth` bridge page (`apps/desktop/src/main/services/loopbackOAuth.ts:124`);
     migrate to authorization-code-with-PKCE like Kick/YouTube.
   - High: YouTube web fallback regexes accept attacker-influenceable
     `INNERTUBE_API_KEY` values (`runtime.ts:1359`); add format
     validators (`/^[A-Za-z0-9_-]{20,80}$/` etc).
   - High: `MODERATION_ACT` IPC handler forwards renderer payload
     wholesale (`chatHandlers.ts:66`); schema-validate every field.
   - Medium: Kick lookup `BrowserWindow` uses the user's real
     `kick.com` cookies (`runtime.ts:2202`); switch to a dedicated
     `session.fromPartition('kick-lookup')`.
   - Medium: `fetchJsonOrThrow` and `fetchYouTubeHtml` have no max
     body size; cap at 2 MiB / 5 MiB respectively.
   - Medium: kick-broker rate limit honors `X-Forwarded-For` from any
     client (`apps/kick-broker/src/server.ts:179`); only trust it when
     the immediate `socket.remoteAddress` is in a trusted-proxy list.
   - Low: `findEnvFileUpwards` in `main.ts` walks up six dirs even in
     packaged mode; restrict to `userData` when `app.isPackaged`.
   - Low: `buildYouTubeLiveUrl` doesn't `encodeURIComponent` the
     channel handle (`runtime.ts:1300`).

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
  four installer artifacts attached.

## How to start

1. Read `docs/UI_OVERHAUL.md` end-to-end.
2. Run `pnpm install && pnpm --filter @chatrix/desktop test` to
   confirm 88/88 still pass.
3. Open the app once with `pnpm dev` to see the current state.
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
