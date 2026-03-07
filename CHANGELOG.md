# Changelog

All notable changes to MultiChat are documented here.

## [1.0.2] – 2026-03-07

### Fixed

- **ESLint** – Migrated both `apps/desktop` and `packages/chat-core` from the legacy `.eslintrc.cjs` format to the ESLint 9 flat-config format (`eslint.config.js`). Added `typescript-eslint` so TypeScript files are linted correctly. `pnpm lint` was previously completely broken and now passes cleanly.
- **Dead code** – Removed unused `hasTikTokSession` helper function and unused `activeTabGroup` variable in `ChatShell.tsx`.
- **Type safety** – Replaced `any` with `Record<string, unknown>` in the `fetchJsonOrThrow` helper in `runtime.ts`.
- **Unused parameter** – Prefixed the unused `pathname` parameter in `loopbackOAuth.ts` with `_` to satisfy the linter.

### Added

- **ErrorBoundary** – New React `ErrorBoundary` component wraps the entire renderer. Unhandled render errors now show a friendly "Something went wrong" screen with a Reload button instead of leaving users with a blank window.
- **Renderer entry hardening** – `main.tsx` now throws an explicit error when the `#root` DOM element is missing, rather than silently failing.

### Security

- **Renderer sandbox** – Added `sandbox: true` to the `webPreferences` of both the main window and the overlay window. This restricts the renderer to Chromium's process sandbox, reducing the attack surface for any code running in those windows.

### Documentation

- **`.env.example`** – Added all previously undocumented environment variables: `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REDIRECT_URI`, `YOUTUBE_API_KEY`, and `TIKTOK_SIGN_API_KEY`.

---

## [1.0.1] – 2025-01-01

Initial public release.
