# Chatrix UI Overhaul Spec

Goal: a more modern, sleek desktop chat client that does not overwhelm
new users with controls. Five phased releases. Ship visible value first.

## Design direction

Reference feel: **Linear / Raycast / Things 3** — dense information,
calm chrome, single accent color, sharp typography, fast keyboard-first
interactions, motion that explains rather than decorates.

Anti-references: Discord (everything always visible), Slack (settings
buried in modals on modals), the current Chatrix (every panel docked at
once).

### Visual tokens

- **Single accent**: keep `--accent: #24d0a2` (mint/teal). Drop the
  blue/`command` mode in favor of one strong accent + neutrals only.
- **Surfaces**: 3 levels max — `--surface-app`, `--surface-panel`,
  `--surface-overlay`. Today there are 5+ overlapping ones.
- **Borders**: 1 hairline (`rgba(255,255,255,0.06)`) + 1 emphasized
  (`rgba(255,255,255,0.12)`). Drop the rest.
- **Radii**: `4px` for controls, `8px` for panels, `12px` for overlays.
  Today some panels are 8px, some 6px, some 12px — looks sloppy.
- **Type scale**: Inter / system-ui, sizes `11 / 12 / 13 / 14 / 16 / 22`.
  Body chat copy is 13/1.5; meta is 11; never larger than 22 for
  in-app headings.
- **Motion**: 120ms `cubic-bezier(0.2, 0.8, 0.2, 1)` for hover/press;
  180ms for panel slides; everything else instant. No bouncy springs.
- **Density**: keep the existing `comfortable` / `compact` toggle, but
  default to compact (Linear-like) and store density in user settings.

### Things removed visually

- Always-on `account-strip` at the top of the workspace — collapses
  into the topbar avatar with a popover on click.
- Always-on `analytics-strip` — moves to a togglable side panel, OFF
  by default in simple mode.
- Always-on `quick-actions` row — keyboard shortcuts + Cmd-K take its
  place; the bar collapses behind a single "..." button.
- "Welcome screen" banner — replaced by a one-time onboarding sheet
  that closes for good after first use.
- Five different border colors and three radius scales — replaced as
  above.

## Information architecture

### Today

Every feature is reachable from one giant popover menu
(`ChatShellMenuContent.tsx`, 1404 LOC, 6 sections, ~120 controls).
Plus dock sidebar + quick actions + analytics strip + account strip
+ tab bar + composer panel — all visible at once.

### Target

**Default view (Simple mode):**

```
┌──────────────────────────────────────────────────────────────┐
│  Chatrix    [tab] [tab] [+]                          ⌘   ⚙   │  ← Topbar
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Active tab — message stream                                 │
│                                                              │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  > Type a message...                              [send all] │  ← Composer
└──────────────────────────────────────────────────────────────┘
```

That's it. No dock, no analytics strip, no account strip, no quick
actions row. Tab bar in the topbar.

**Advanced mode** adds an optional right-hand dock with:
- Mentions inbox
- Moderation history
- Source health
- Analytics

User opts in once; preference is sticky.

**Cmd-K palette** is the universal escape hatch. Power users never
need to hunt: type "twitch", "filter spam", "switch profile",
"sign in youtube" — palette runs the action. This makes hiding
controls safe.

### Settings — full page, not popover

Replace `ChatShellMenuContent.tsx` (1404 LOC, 6 buried sections) with
a real Settings *page* that takes over the workspace area when open
(`Cmd-,` to open, Esc to close).

```
┌──────────────────────────────────────────────────────────────┐
│  Settings                                              ✕     │
├────────────────┬─────────────────────────────────────────────┤
│ Appearance     │  Theme                                      │
│ Accounts       │  ◉ Dark   ○ Light   ○ System                │
│ Notifications  │                                             │
│ Filters        │  Density                                    │
│ Layout         │  ◉ Compact  ○ Comfortable                   │
│ Keyboard       │                                             │
│ Updates        │  Chat text size                             │
│ Advanced       │  ────●─────  100%                           │
│                │                                             │
└────────────────┴─────────────────────────────────────────────┘
```

8 categories, each ~5–15 controls instead of one wall of 120.

## Phases

### Phase 1 — Visual refresh (1 release, ~1–2 days)

Just CSS + a few tweaks. No structural changes.

- Rewrite `modern.css` against the token system above.
- Strip the 4 redundant variable defs in `variables.css`.
- Add `motion.css` with the 3 motion durations and one easing.
- Apply hairline borders / consistent radii across `panels.css`,
  `menus.css`, `overlays.css`, `composer.css`.
- New focus ring (single accent outline, no double-glow).
- Polish chat row: tighter line-height, badge spacing, hover affordance.

**Visible win:** the app *feels* modern without changing where
anything is.

### Phase 2 — Settings page (1 release, ~2–3 days)

- New route/state: `settingsOpen` boolean in app store; renders
  `SettingsPage` over the workspace when true.
- New `components/Settings/SettingsPage.tsx` with sidebar + content.
- Move existing controls out of `ChatShellMenuContent.tsx` into the
  category pages (Appearance / Accounts / Notifications / etc).
  ChatShellMenuContent shrinks to ~200 LOC of ambient menu items
  (tab actions, group toggles).
- Wire `Cmd-,` to open Settings.

### Phase 3 — Decompose ChatShell.tsx (1 release, ~3–5 days)

Split 8268 LOC + 200 hooks into focused files. State stays in
`ChatShell` for now; behavior unchanged.

Targets:
- `ChatShellTopBar` (already exists, keep)
- `ChatShellTabBar` (already exists, keep)
- `ChatWorkspace` → owns column layout + message-stream wiring
- `ChatComposerPanel` → owns composer + send routing
- `ChatModerationLayer` → owns the moderation popovers and message-menu
- `ChatNotificationLayer` → owns mentions, snooze, alerts
- `chatMessage.ts` → pure helpers from lines 312–1178

Rough target: ChatShell drops from 8268 → ~1500 LOC of orchestration.

### Phase 4 — Simple-by-default + Cmd-K palette (1 release, ~2–4 days)

- Default new users to simple mode (today: advanced is default).
- Hide analytics-strip, dock-sidebar, account-strip, quick-actions
  in simple mode.
- New `components/CommandPalette.tsx` powered by a flat command
  registry. Commands include: open settings, switch tab, sign-in
  per platform, toggle filter profile, jump to mention, switch
  account profile, etc.
- `Cmd-K` opens it. Type to filter. Enter to run.
- Existing IPC and store actions are reused — palette is a thin
  shell over what already works.

### Phase 5 — Visual polish (optional, ~1 day)

After 1–4 land, add micro-interactions: tab close animations,
toast slide-in for sends, subtle row highlight on new mention.
Skip if user wants to ship.

## Migration notes

- Existing user settings stay valid; new keys land with sane
  defaults and migrations.
- Power users with `isAdvancedMode=true` see no surface change in
  Phase 4 (they're already opted in).
- New users: simple mode default. They can opt into advanced from
  Settings → Advanced → "Show all panels".

## Out of scope

- Multi-account (we already discussed; deferred).
- Mobile / iOS layout changes (separate Expo app).
- Renaming `Chatrix` or rebranding.
- Localization.
