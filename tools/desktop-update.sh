#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "==> Pull latest source"
git pull --ff-only

echo "==> Install dependencies"
npm install

echo "==> Load Rust toolchain"
if [ -f "$HOME/.cargo/env" ]; then
  # shellcheck source=/dev/null
  . "$HOME/.cargo/env"
fi

echo "==> Build desktop app"
npm run desktop:build

APP_PATH="apps/desktop/src-tauri/target/release/bundle/macos/Timebox.app"
if [ -d "$APP_PATH" ]; then
  echo "==> Launch app"
  open "$APP_PATH"
  echo "Done: $APP_PATH"
else
  echo "Build finished, but app bundle was not found: $APP_PATH"
  exit 1
fi
