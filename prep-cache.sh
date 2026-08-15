#!/usr/bin/env bash
set -e
CACHE=/d/moodie-pet/.eb-cache
BASE=https://registry.npmmirror.com/-/binary/electron-builder-binaries
mkdir -p "$CACHE/nsis-3.0.4.1" "$CACHE/nsis-resources-3.4.1" "$CACHE/winCodeSign-2.6.0"

echo "[1/4] nsis-3.0.4.1.7z"
curl -sL --max-time 120 -o "$CACHE/nsis-3.0.4.1/nsis-3.0.4.1.7z" "$BASE/nsis-3.0.4.1/nsis-3.0.4.1.7z"
echo "[2/4] nsis-resources-3.4.1.7z"
curl -sL --max-time 120 -o "$CACHE/nsis-resources-3.4.1/nsis-resources-3.4.1.7z" "$BASE/nsis-resources-3.4.1/nsis-resources-3.4.1.7z"
echo "[3/4] winCodeSign-2.6.0.7z"
curl -sL --max-time 120 -o "$CACHE/winCodeSign-2.6.0/winCodeSign-2.6.0.7z" "$BASE/winCodeSign-2.6.0/winCodeSign-2.6.0.7z"
echo "[4/4] 7zip-win-x64.tar.gz (for 7za.exe)"
curl -sL --max-time 120 -o /tmp/7zip-win-x64.tar.gz "$BASE/7zip@1.0.0/7zip-win-x64.tar.gz"

echo "=== sha256 verify (must match expected) ==="
printf "nsis-3.0.4.1   expect 9877df90...  got %s\n" "$(sha256sum "$CACHE/nsis-3.0.4.1/nsis-3.0.4.1.7z" | cut -d' ' -f1)"
printf "nsis-resources expect 593a9a92...  got %s\n" "$(sha256sum "$CACHE/nsis-resources-3.4.1/nsis-resources-3.4.1.7z" | cut -d' ' -f1)"
printf "winCodeSign    expect cdaec715...  got %s\n" "$(sha256sum "$CACHE/winCodeSign-2.6.0/winCodeSign-2.6.0.7z" | cut -d' ' -f1)"
printf "7zip-win-x64   expect be071f15...  got %s\n" "$(sha256sum /tmp/7zip-win-x64.tar.gz | cut -d' ' -f1)"

echo "=== extract 7zip → 7za.exe ==="
mkdir -p /d/moodie-pet/.eb-7zip
tar -xzf /tmp/7zip-win-x64.tar.gz -C /d/moodie-pet/.eb-7zip
ls -la /d/moodie-pet/.eb-7zip/bin/7za.exe 2>&1
echo "7ZA_PATH=/d/moodie-pet/.eb-7zip/bin/7za.exe"
