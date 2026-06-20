#!/usr/bin/env bash
# Démarre l'API FastAPI + le frontend Next.js en local (sans Docker).
#
# Prérequis : PostgreSQL local, Node.js 18+, Python 3.12+, uv
# Redis optionnel — laisser REDIS_URL vide dans .env pour fakeredis.
#
# Usage:
#   bash scripts/dev-local.sh          # API + web
#   bash scripts/dev-local.sh api      # API seulement
#   bash scripts/dev-local.sh web      # web seulement

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

MODE="${1:-all}"

run_uvicorn() {
  if command -v uv >/dev/null 2>&1; then
    PYTHONPATH=apps/api uv run uvicorn "$@"
  elif [[ -x "${ROOT_DIR}/.venv/bin/uvicorn" ]]; then
    PYTHONPATH=apps/api "${ROOT_DIR}/.venv/bin/uvicorn" "$@"
  else
    echo "Erreur : dépendances Python absentes. Lancez : make install"
    exit 1
  fi
}

if [[ -f "${ROOT_DIR}/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${ROOT_DIR}/.env"
  set +a
fi

API_PORT="${API_PORT:-8000}"
API_HOST="${API_HOST:-0.0.0.0}"
WEB_PORT="${WEB_PORT:-3000}"

API_PID=""

cleanup() {
  if [[ -n "${API_PID}" ]] && kill -0 "${API_PID}" 2>/dev/null; then
    echo ""
    echo "→ Arrêt de l'API (pid ${API_PID})..."
    kill "${API_PID}" 2>/dev/null || true
    wait "${API_PID}" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

start_api() {
  echo "→ API : http://localhost:${API_PORT}"
  echo "  Docs : http://localhost:${API_PORT}/docs"
  run_uvicorn main:app --reload --host "${API_HOST}" --port "${API_PORT}"
}

start_web() {
  if ! command -v npm >/dev/null 2>&1; then
    echo "Erreur : 'npm' introuvable."
    exit 1
  fi
  echo "→ Web : http://localhost:${WEB_PORT}"
  cd "${ROOT_DIR}/apps/web"
  npm run dev -- --port "${WEB_PORT}"
}

case "${MODE}" in
  api)
    start_api
    ;;
  web)
    start_web
    ;;
  all)
    echo "=== GTO Wizard — dev local (sans Docker) ==="
    echo ""
    run_uvicorn main:app --reload --host "${API_HOST}" --port "${API_PORT}" &
    API_PID=$!
    sleep 2
    if ! kill -0 "${API_PID}" 2>/dev/null; then
      echo "Erreur : l'API n'a pas démarré. Vérifiez DATABASE_URL dans .env"
      exit 1
    fi
    start_web
    ;;
  *)
    echo "Usage: $0 [all|api|web]"
    exit 1
    ;;
esac
