#!/usr/bin/env bash
# Generates src/lib/supabase/types.ts from a throwaway local Postgres with the
# migrations applied (no Supabase project, no Docker needed). scripts/gen-types.py
# emits the same `Database` shape supabase-js expects.
set -euo pipefail
shopt -s nullglob
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PGBIN="${PGBIN:-/usr/lib/postgresql/16/bin}"
DATA="${TMPDIR:-/tmp}/oar-pg-types"
PORT="${DB_TYPES_PORT:-55433}"
export PGHOST=localhost PGPORT="$PORT" PGUSER=postgres PGDATABASE=postgres
if [ "$(id -u)" = "0" ]; then RUNAS="${DB_TEST_USER:-postgres}"; PG() { su -s /bin/bash "$RUNAS" -c "$*"; }; else PG() { bash -c "$*"; }; fi
cleanup() { PG "'$PGBIN/pg_ctl' -D '$DATA' stop -m immediate" >/dev/null 2>&1 || true; rm -rf "$DATA"; }
trap cleanup EXIT
rm -rf "$DATA"; mkdir -p "$DATA"; [ "$(id -u)" = "0" ] && chown "$RUNAS" "$DATA"
PG "'$PGBIN/initdb' -D '$DATA' -U postgres -A trust" >/dev/null
PG "'$PGBIN/pg_ctl' -D '$DATA' -o '-p $PORT -k /tmp -c log_min_messages=warning' -l '$DATA/log' start" >/dev/null
for i in $(seq 1 30); do "$PGBIN/pg_isready" -q && break; sleep 0.3; done
psql -v ON_ERROR_STOP=1 -q -X -f "$ROOT/supabase/tests/00_supabase_shim.sql"
for f in "$ROOT"/supabase/migrations/*.sql; do psql -v ON_ERROR_STOP=1 -q -X -f "$f"; done
OUT="$ROOT/src/lib/supabase/types.ts"
{
  echo "/**"
  echo " * GENERATED — do not edit. Run \`npm run db:types\` after changing migrations."
  echo " * Source: supabase/migrations applied to a local PostgreSQL via scripts/db-types.sh"
  echo " */"
  python3 "$ROOT/scripts/gen-types.py" --debug 2>&1
} > "$OUT"
npx prettier --write "$OUT" >/dev/null
python3 - "$OUT" <<'PY'
import re, sys
out = sys.argv[1]
src = open(out).read()
m = re.search(r"\n    Enums: \{\n(.*?)\n    \};", src, re.S)
names = re.findall(r"^\s{6}(\w+):", m.group(1), re.M) if m else []
pascal = lambda n: "".join(w.capitalize() for w in n.split("_"))
lines = ["", "// ---- convenience aliases (one per enum, generated) ---------------------------"]
lines += [f'export type {pascal(n)} = Database["public"]["Enums"]["{n}"];' for n in names]
lines += ['export type TablesInsert<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"];',
          'export type TablesUpdate<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"];', ""]
open(out, "a").write("\n".join(lines))
PY
npx prettier --write "$OUT" >/dev/null
echo "✓ wrote $OUT"
