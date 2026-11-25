#!/usr/bin/env bash
# Builds the Windows .exe files (nsis installer + portable) inside Docker, so no local Wine is needed.
# The image electronuserland/builder:wine brings a working Wine; electron/electron-builder caches are reused.
set -euo pipefail
cd "$(dirname "$0")/.."
node build.mjs
mkdir -p "$HOME/.cache/electron" "$HOME/.cache/electron-builder"
docker run --rm \
  -v "$PWD":/project -w /project \
  -v "$HOME/.cache/electron":/root/.cache/electron \
  -v "$HOME/.cache/electron-builder":/root/.cache/electron-builder \
  electronuserland/builder:wine \
  bash -c "npx electron-builder --win nsis portable; s=\$?; chown -R $(id -u):$(id -g) release; exit \$s"
