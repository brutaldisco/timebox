# Desktop (Tauri) Integration

## Goal
Add a macOS desktop app layer without changing existing Next.js web behavior on Vercel.

## Coexistence model
- Existing Next.js app remains at repository root (unchanged runtime path for Vercel).
- `apps/web` is a monorepo shim to target web commands.
- `apps/desktop` is the native Tauri shell.

## Option A vs Option B

### Option A (Preferred): local production web build
- Implemented as default for release build.
- `DESKTOP_EXPORT=1 next build` produces static export (`out/`), then copied to `apps/desktop/dist`.
- Tauri release loads `WebviewUrl::App("index.html")` from bundled local assets.
- Pros:
  - Offline-capable desktop packaging path.
  - No dependency on remote network to render UI.
  - Desktop release can be fully self-contained.
- Cons:
  - Heavier packaging and more build orchestration.
  - Need to keep local server/static export workflow in sync with Next.js features.

### Option B: remote Vercel URL
- Available as override via env:
  - Dev: `TIMEBOX_DEV_URL=https://timebox.vercel.app`
  - Build: `TIMEBOX_REMOTE_URL=https://timebox.vercel.app`
- Pros:
  - Safest for existing app; no Next.js refactor.
  - Very lightweight desktop wrapper.
  - One source of truth for deployed UI.
- Cons:
  - Requires network to load.
  - Desktop reflects deployed state, not local un-deployed code.

## Native features included
- Always-on-top small fixed window (360x520), centered, non-resizable.
- Global shortcut: `Cmd+Shift+T` focuses the app window.
- Auto-launch plugin is enabled (macOS LaunchAgent).
- Notification plugin is enabled.
- Persistent storage stays in web layer (localStorage/IndexedDB as already implemented).

## Commands

### Web development (existing app)
```bash
npm run web:dev
```

### Desktop development (remote URL mode)
```bash
npm run desktop:dev
```

This runs with local web dev server (`http://127.0.0.1:3000`) by default.

### Desktop development (explicit remote override)
```bash
npm run desktop:dev:remote
```

### Build desktop macOS app (.app)
```bash
npm run desktop:build
```

This triggers:
1) `npm run desktop:web:bundle` (Option A local bundle generation)
2) `tauri build` with bundled local assets

### Build desktop macOS app with remote URL override (Option B)
```bash
npm --prefix apps/desktop run tauri:build:remote
```

### Build/deploy web
```bash
npm run web:build
git push origin main
```

Vercel production is updated from `main` push as before.
