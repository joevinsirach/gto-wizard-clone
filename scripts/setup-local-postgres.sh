#!/usr/bin/env bash
# Create the gto_wizard database on your local PostgreSQL server.
# Safe to run multiple times — only creates the database if missing.
#
# Usage:
#   export PGUSER=your_user
#   export PGPASSWORD=your_password   # if required
#   export PGHOST=localhost
#   export PGPORT=5432
#   bash scripts/setup-local-postgres.sh
#
# Or with a full URL:
#   DATABASE_URL=postgresql://user:pass@localhost:5432/gto_wizard bash scripts/setup-local-postgres.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
if [[ -f "${ROOT_DIR}/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${ROOT_DIR}/.env"
  set +a
fi

DB_NAME="${GTO_DB_NAME:-gto_wizard}"

if [[ -n "${DATABASE_URL:-}" && -z "${PGUSER:-}" ]]; then
  # Parse postgresql://user:pass@host:port/dbname when PG* vars not set
  if [[ "$DATABASE_URL" =~ postgresql(\+asyncpg)?://([^:@/]+)(:([^@/]*))?@([^:/]+)(:([0-9]+))?/([^?]+) ]]; then
    export PGUSER="${BASH_REMATCH[2]}"
    [[ -n "${BASH_REMATCH[4]:-}" ]] && export PGPASSWORD="${BASH_REMATCH[4]}"
    export PGHOST="${BASH_REMATCH[5]}"
    export PGPORT="${BASH_REMATCH[7]:-5432}"
    DB_NAME="${BASH_REMATCH[8]}"
  fi
fi

PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-${USER}}"
DB_NAME="${PGDATABASE:-${DB_NAME:-gto_wizard}}"

echo "→ PostgreSQL: ${PGUSER}@${PGHOST}:${PGPORT}"
echo "→ Database cible: ${DB_NAME}"

exists=$(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d postgres -tAc \
  "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'" 2>/dev/null || true)

if [[ "$exists" == "1" ]]; then
  echo "✓ La base '${DB_NAME}' existe déjà."
else
  echo "→ Création de la base '${DB_NAME}'..."
  psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d postgres -c "CREATE DATABASE \"${DB_NAME}\";"
  echo "✓ Base '${DB_NAME}' créée."
fi

echo ""
echo "Prochaines étapes:"
echo "  1. Vérifiez DATABASE_URL dans .env"
echo "  2. make install && make seed-all"
echo "  3. make dev   → http://localhost:3000"
