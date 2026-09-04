#!/usr/bin/env bash
# Prépare l'archive ZIP du site statique à publier sur GitHub Pages.
set -euo pipefail

cd "$(dirname "$0")"

OUT="hc-dinan-quevert-site.zip"

[ -f "$OUT" ] && rm -f "$OUT"

zip -r "$OUT" . \
  -x "node_modules/*" \
  -x "*.zip" \
  -x ".git/*" >/dev/null

echo "Archive créée : $OUT"
unzip -l "$OUT" | tail -n 3
