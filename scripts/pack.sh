#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
python3 "$root/scripts/generate-icons.py"
out="$root/responsiveness.zip"
rm -f "$out"
cd "$root"
zip -r "$out" \
  manifest.json \
  background \
  viewer \
  popup \
  options \
  icons \
  privacy.html \
  LICENSE \
  -x "*.DS_Store" \
  -x "*__pycache__*"
echo "Wrote $out"
