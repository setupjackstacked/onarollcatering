#!/usr/bin/env bash
# Spins up a throwaway PostgreSQL 16 cluster, applies the Supabase shim,
# all migrations and the seed, then runs every supabase/tests/*.test.sql file.
# Each test file uses DO blocks that RAISE EXCEPTION on failure.
set -euo pipefail
shopt -s nullglob
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PGBIN="${PGBIN:-/usr/lib/postgresql/16/bin}"
DATA="${DB_TEST_DIR:-${TMPDIR:-/tmp}/oar-pg-test}"
PORT="${DB_TEST_PORT:-55432}"
export PGHOST=localhost PGPORT="$PORT" PGUSER=postgres PGDATABASE=postgres

# Postgres refuses to run as root (CI containers often are) — drop to an unprivileged user.
if [ "$(id -u)" = "0" ]; then
  RUNAS="${DB_TEST_USER:-postgres}"
  id "$RUNAS" >/dev/null 2>&1 || useradd -m "$RUNAS"
  PG() { su -s /bin/bash "$RUNAS" -c "$*"; }
else
  PG() { bash -c "$*"; }
fi
cleanup() { PG "'$PGBIN/pg_ctl' -D '$DATA' stop -m immediate" >/dev/null 2>&1 || true; rm -rf "$DATA"; }
trap cleanup EXIT
rm -rf "$DATA"; mkdir -p "$DATA"; [ "$(id -u)" = "0" ] && chown "$RUNAS" "$DATA"
PG "'$PGBIN/initdb' -D '$DATA' -U postgres -A trust" >/dev/null
PG "'$PGBIN/pg_ctl' -D '$DATA' -o '-p $PORT -k /tmp -c log_min_messages=warning' -l '$DATA/log' start" >/dev/null
for i in $(seq 1 30); do "$PGBIN/pg_isready" -q && break; sleep 0.3; done

run() { psql -v ON_ERROR_STOP=1 -q -X -f "$1"; }
echo "▸ shim";        run "$ROOT/supabase/tests/00_supabase_shim.sql"
for f in "$ROOT"/supabase/migrations/*.sql; do echo "▸ migration $(basename "$f")"; run "$f"; done
echo "▸ seed";        run "$ROOT/supabase/seed.sql"
for f in "$ROOT"/supabase/tests/*.test.sql; do echo "▸ test $(basename "$f")"; run "$f"; done
echo "✓ database tests passed"
