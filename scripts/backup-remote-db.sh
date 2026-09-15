#!/usr/bin/env bash
# Logical backup of the remote Supabase database via the Supabase CLI.
#
# Reads DATABASE_URL from the repo-root .env (do not hardcode credentials).
# Writes dated SQL dumps under backups/ (gitignored).
#
# Includes: public (Connected Action), knowledge, human, and other non-managed schemas.
# Excludes: auth, storage, extension schemas, and Storage objects.
#
# Requires: supabase CLI, Docker Desktop.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is not set. Add it to the repo-root .env file." >&2
  exit 1
fi

if ! command -v supabase >/dev/null 2>&1; then
  echo "supabase CLI not found. Install: https://supabase.com/docs/guides/local-development/cli/getting-started" >&2
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required for supabase db dump. Install and start Docker Desktop." >&2
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "Docker is installed but not running. Start Docker Desktop and retry." >&2
  exit 1
fi

STAMP="$(date +%Y-%m-%d-%H%M%S)"
OUT_DIR="${ROOT}/backups/${STAMP}"
mkdir -p "$OUT_DIR"

echo "Backing up remote database to ${OUT_DIR}"
echo "Dumping roles..."
supabase db dump --db-url "$DATABASE_URL" -f "${OUT_DIR}/roles.sql" --role-only

echo "Dumping schema..."
supabase db dump --db-url "$DATABASE_URL" -f "${OUT_DIR}/schema.sql"

echo "Dumping data (this can take a while)..."
supabase db dump --db-url "$DATABASE_URL" -f "${OUT_DIR}/data.sql" --use-copy --data-only \
  -x "storage.buckets_vectors" -x "storage.vector_indexes"

echo "Compressing data dump..."
gzip -f "${OUT_DIR}/data.sql"

{
  echo "created_at=${STAMP}"
  echo "tool=supabase db dump"
  echo "files=roles.sql,schema.sql,data.sql.gz"
  echo "excluded=auth schema, storage schema, storage objects"
} > "${OUT_DIR}/manifest.txt"

echo "Backup complete:"
ls -lh "$OUT_DIR"
