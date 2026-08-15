#!/usr/bin/env bash
set -e
cd /d/moodie-pet || { echo "cannot cd"; exit 1; }
echo "build cwd: $(pwd)"

# Point electron-builder at the pre-seeded archive cache (verified sha256 matches),
# so downloadAndExtract short-circuits on the cached .7z instead of hitting the
# network (which hangs via got on this machine's proxy).
export ELECTRON_BUILDER_CACHE="D:/moodie-pet/.eb-cache"
# Provide 7za.exe directly — skips the 7zip toolset download AND is used to extract
# the cached nsis/winCodeSign .7z archives.
export ELECTRON_BUILDER_7ZIP_PATH="D:/moodie-pet/.eb-7zip/7zip/bin/7za.exe"
# Fallback mirror (shouldn't be needed, but set in case something else downloads).
export ELECTRON_BUILDER_BINARIES_MIRROR="https://registry.npmmirror.com/-/binary/electron-builder-binaries/"

./node_modules/.bin/electron-builder --win portable
