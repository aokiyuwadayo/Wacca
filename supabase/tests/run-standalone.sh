#!/usr/bin/env bash
#
# DB レイヤ検証ハーネス（Docker / Supabase CLI 不要版）。
#
# 使い捨ての PostgreSQL クラスタを /tmp に起動し、Supabase 相当のシム(shim.sql)を
# 当ててから supabase/migrations/*.sql を順番に適用し、ロジックテスト(logic.test.sql)
# と招待コードの並行消費テストを実行する。終了時にクラスタを破棄する。
#
# 前提: PostgreSQL 17 のバイナリ（initdb/pg_ctl/psql/createdb）。
#   macOS: brew install postgresql@17
#   PG_BIN 環境変数で bin ディレクトリを上書き可能。
#
# 使い方:  bash supabase/tests/run-standalone.sh
#
# Supabase CLI が使える環境なら、本スクリプトの代わりに `supabase db reset` で
# migrations を適用し、psql で logic.test.sql を流してもよい（README 参照）。

set -euo pipefail

PG_BIN="${PG_BIN:-/opt/homebrew/opt/postgresql@17/bin}"
PORT="${PORT:-54399}"
PGDATA="$(mktemp -d /tmp/yuwa-pgtest.XXXXXX)"
DB="yuwa_test"
HERE="$(cd "$(dirname "$0")" && pwd)"
MIGRATIONS="$HERE/../migrations"

if [[ ! -x "$PG_BIN/initdb" ]]; then
  echo "ERROR: PostgreSQL binaries not found at $PG_BIN" >&2
  echo "       set PG_BIN, or: brew install postgresql@17" >&2
  exit 1
fi

PSQL() { "$PG_BIN/psql" -h /tmp -p "$PORT" -U postgres -d "$DB" "$@"; }

cleanup() {
  "$PG_BIN/pg_ctl" -D "$PGDATA" stop -m fast >/dev/null 2>&1 || true
  rm -rf "$PGDATA"
}
trap cleanup EXIT

echo "==> initdb ($PGDATA)"
LC_ALL=en_US.UTF-8 "$PG_BIN/initdb" --locale=en_US.UTF-8 -E UTF-8 -U postgres "$PGDATA" >/dev/null

echo "==> start postgres (port $PORT)"
"$PG_BIN/pg_ctl" -D "$PGDATA" -o "-p $PORT -k /tmp" -l "$PGDATA/server.log" start >/dev/null
for _ in $(seq 1 20); do "$PG_BIN/pg_isready" -h /tmp -p "$PORT" -q && break; sleep 0.3; done
"$PG_BIN/createdb" -h /tmp -p "$PORT" -U postgres "$DB"

echo "==> apply shim"
PSQL -v ON_ERROR_STOP=1 -q -f "$HERE/shim.sql"

echo "==> apply migrations"
for f in "$MIGRATIONS"/0*.sql; do
  printf '    %s\n' "$(basename "$f")"
  PSQL -v ON_ERROR_STOP=1 -q -f "$f"
done

echo "==> load fixtures"
PSQL -v ON_ERROR_STOP=1 -q -f "$HERE/fixtures.sql"

echo "==> logic tests"
PSQL -v ON_ERROR_STOP=1 -q -f "$HERE/logic.test.sql"

echo "==> concurrency test (10 parallel redeem of a max_uses=1 invite)"
PSQL -v ON_ERROR_STOP=1 -q <<'SQL'
insert into public.invite_codes (code, organization_id, max_uses, used_count, expires_at)
values ('RACE0001', '00000000-0000-4000-8000-000000000001', 1, 0, now() + interval '14 days')
on conflict (code) do update set used_count = 0;
insert into auth.users (id, email)
select ('a0000000-0000-4000-8000-' || lpad(g::text,12,'0'))::uuid, 'race'||g||'@example.com'
from generate_series(1,10) g
on conflict (id) do nothing;
delete from public.members where invite_code = 'RACE0001';
SQL

tmp_out="$(mktemp -d)"
for i in $(seq 1 10); do
  uid="a0000000-0000-4000-8000-$(printf '%012d' "$i")"
  ( PSQL -tA -c "select public.redeem_invite_and_create_member('RACE0001','$uid','R$i');" \
      > "$tmp_out/$i.out" 2>&1 ) &
done
wait

created=$(cat "$tmp_out"/*.out | grep -c '^created$' || true)
members=$(PSQL -tA -c "select count(*) from public.members where invite_code='RACE0001';")
used=$(PSQL -tA -c "select used_count from public.invite_codes where code='RACE0001';")
rm -rf "$tmp_out"

echo "    created=$created  members=$members  used_count=$used  (expected 1/1/1)"
if [[ "$created" -ne 1 || "$members" -ne 1 || "$used" -ne 1 ]]; then
  echo "CONCURRENCY TEST FAILED: invite was double-redeemed" >&2
  exit 1
fi
echo "    concurrency test: PASS (no double-redemption)"

echo
echo "==================================================="
echo "ALL DB VERIFICATION PASSED"
echo "==================================================="
