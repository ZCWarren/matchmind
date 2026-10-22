#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEMO_REPO="${DEMO_REPO:-https://github.com/ruziniuuuuu/matchmind-demo.git}"
TMP="$(mktemp -d)"

cd "$ROOT"
uv run python scripts/export_static_demo.py
(cd web && npm run build:static)

cp -r web/dist-static/. "$TMP/"
cp scripts/demo-readme.md "$TMP/README.md"
cp LICENSE "$TMP/LICENSE"
mkdir -p "$TMP/.github/workflows"
cp scripts/pages-workflow.yml "$TMP/.github/workflows/pages.yml"

cd "$TMP"
git init -b main
git add -A
git -c user.name="MatchMind" -c user.email="ruziniuuuuu@users.noreply.github.com" \
  commit -m "static demo build"
git remote add origin "$DEMO_REPO"
git push -f -u origin main
