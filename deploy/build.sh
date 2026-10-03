#!/usr/bin/env bash
# Builds the static site into dist/: copies web/ and adds a content hash to the
# CSS/JS URLs (style.css?v=<hash>), because Cloudflare caches CSS and JS for
# hours even when the server says no-cache, while HTML always arrives fresh.
set -euo pipefail
cd "$(dirname "$0")/.."

rm -rf dist
mkdir -p dist
cp web/index.html web/life.js web/ui.js web/style.css web/favicon.png dist/

for f in life.js ui.js style.css favicon.png; do
  v=$(sha256sum "dist/$f" | cut -c1-10)
  sed -i -E "s#(src|href)=\"$f\"#\1=\"$f?v=$v\"#" dist/index.html
done

grep -oE '(src|href)="[^"]+"' dist/index.html
echo "dist/ ready"
