#!/usr/bin/env bash
# Prépare l'archive ZIP du site à publier sur GitHub.
# Exclut node_modules, data (générée au 1er démarrage) et les uploads (générés/téléversés).
set -euo pipefail

cd "$(dirname "$0")"

OUT="hc-dinan-quevert-site.zip"

# Supprime l'ancienne archive si présente
[ -f "$OUT" ] && rm -f "$OUT"

zip -r "$OUT" . \
  -x "node_modules/*" \
  -x "data/*" \
  -x "public/uploads/*" \
  -x "*.zip" \
  -x ".git/*" >/dev/null

echo "Archive créée : $OUT"
unzip -l "$OUT" | tail -n 3
