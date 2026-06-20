#!/usr/bin/env bash
# Installe les dépendances Python (uv ou venv+pip).

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

if command -v uv >/dev/null 2>&1; then
  echo "→ Installation Python via uv..."
  uv sync --group runtime
  uv pip install -e packages/poker-core
else
  echo "→ uv absent — installation via venv + pip..."
  if [[ ! -d .venv ]]; then
    python3 -m venv .venv
  fi
  # shellcheck disable=SC1091
  source .venv/bin/activate
  pip install -q --upgrade pip
  pip install -q -r apps/api/requirements.txt
  pip install -q fakeredis aiosqlite python-dotenv
  pip install -q -e packages/poker-core
  echo "✓ venv créé dans .venv/"
fi
