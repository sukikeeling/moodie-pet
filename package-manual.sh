#!/usr/bin/env bash
set -e
cd /d/moodie-pet
SRC=node_modules/electron/dist
OUT=dist/MoodiePet
echo "clean + copy electron runtime..."
rm -rf "$OUT"
mkdir -p "$OUT/resources/app"
# copy the whole electron prebuilt (electron.exe, resources/, locales/, *.dll, *.pak, etc.)
cp -r "$SRC"/* "$OUT"/
# remove electron's default demo app so our app is the one that runs
rm -f "$OUT/resources/default_app.asar"
# install THIS project's app as resources/app/  (electron auto-runs resources/app/package.json)
cp main.js preload.js pet.html data.js package.json "$OUT/resources/app/"
# friendly exe name
mv "$OUT/electron.exe" "$OUT/Moodie Pet.exe"
echo "=== packaged ==="
ls "$OUT" | head -20
echo "--- resources/app ---"
ls "$OUT/resources/app/"
echo "--- exe ---"
ls -la "$OUT/Moodie Pet.exe"
