#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "==> Update and build desktop app"
bash tools/desktop-update.sh

APP_SRC="apps/desktop/src-tauri/target/release/bundle/macos/Timebox.app"
APP_DST="/Applications/Timebox.app"

if [ ! -d "$APP_SRC" ]; then
  echo "App bundle not found: $APP_SRC"
  exit 1
fi

echo "==> Close running Timebox"
killall "Timebox" 2>/dev/null || true

echo "==> Install to /Applications"
rm -rf "$APP_DST"
cp -R "$APP_SRC" "$APP_DST"

echo "==> Launch /Applications/Timebox.app"
open "$APP_DST"

echo "Done: $APP_DST"
