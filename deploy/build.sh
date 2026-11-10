#!/usr/bin/env bash
# Builds the static site for the home server into dist/: copies docs/ (the same
# files GitHub Pages serves) and adds a content hash to the CSS/JS URLs
# (style.css?v=<hash>), because Cloudflare caches CSS and JS for hours even when
# the server says no-cache, while HTML always arrives fresh.
set -euo pipefail
cd "$(dirname "$0")/.."

rm -rf dist
mkdir -p dist
cp docs/index.html docs/system.css docs/theme.js docs/style.css docs/life.js docs/ui.js docs/favicon.svg dist/

for f in system.css theme.js style.css life.js ui.js favicon.svg; do
  v=$(sha256sum "dist/$f" | cut -c1-10)
  sed -i -E "s#(src|href)=\"$f\"#\1=\"$f?v=$v\"#" dist/index.html
done

grep -oE '(src|href)="[^"]+"' dist/index.html
echo "dist/ ready"
