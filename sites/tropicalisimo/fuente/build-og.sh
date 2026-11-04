#!/bin/sh
# Genera ../og.jpg (miniatura de WhatsApp, 1200×630, <300 KB) a partir de og.html.
set -e
cd "$(dirname "$0")"
tmp=$(mktemp -d)
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars \
  --force-device-scale-factor=1 --window-size=1200,630 --virtual-time-budget=5000 --allow-file-access-from-files \
  --user-data-dir="$tmp/chrome" --screenshot="$tmp/og.png" "file://$PWD/og.html" >/dev/null 2>&1
magick "$tmp/og.png" -strip -interlace JPEG -sampling-factor 4:2:0 -quality 84 ../og.jpg
rm -rf "$tmp"
echo "../og.jpg — $(($(stat -f%z ../og.jpg) / 1024)) KB"
