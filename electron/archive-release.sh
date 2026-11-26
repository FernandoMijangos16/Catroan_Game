#!/usr/bin/env bash
# Before a new build: moves the previous executables to release/versiones-antiguas/<date>_<time>/ so nothing is lost.
#   bash electron/archive-release.sh win     → .exe (and their .blockmap / latest.yml)
#   bash electron/archive-release.sh linux   → .AppImage (and latest-linux.yml)
#   bash electron/archive-release.sh         → both
set -euo pipefail
cd "$(dirname "$0")/../release" 2>/dev/null || exit 0
what="${1:-all}"
files=()
shopt -s nullglob
if [[ $what == win || $what == all ]]; then files+=(*.exe *.exe.blockmap latest.yml); fi
if [[ $what == linux || $what == all ]]; then files+=(*.AppImage latest-linux.yml); fi
(( ${#files[@]} )) || exit 0
dest="versiones-antiguas/$(date +%Y-%m-%d_%H%M)"
mkdir -p "$dest"
mv -- "${files[@]}" "$dest/"
echo "Versiones anteriores guardadas en release/$dest"
