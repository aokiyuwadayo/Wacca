# DB レイヤ検証ハーネス

`supabase/migrations/*.sql` が実際に適用でき、RLS・トリガ・主要 RPC が意図通り動くことを
**実 DB で**検証するためのテスト一式。Issue #25（e2e 検証）の DB レイヤ部分に対応する。

## 何を検証するか

- **全 migration の適用** — 001〜011 を順番に流し、SQL エラー無く適用できること
- **招待コードのアトミック消費（`redeem_invite_and_create_member`）** — 機能・冪等性に加え、
  **10 並列の同時消費で max_uses=1 の招待が二重消費されないこと**（PR #27 で修正した BLOCKER の回帰防止）
- **posts トリガ** — `author_hash` が `members.anonymous_hash` から自動設定され、BAN 済み
  ハッシュの投稿がブロックされること
- **RLS** — 一般会員は承認済み投稿のみ閲覧可・他人の pending は不可、非モデレーターは
  モデキュー（`list_moderation_posts`）が空、モデレーターには先頭 4 文字のみ見えること

## 実行方法

### A. Docker / Supabase CLI 不要（推奨・素の Postgres）

PostgreSQL 17 のバイナリさえあれば動く。使い捨てクラスタを `/tmp` に立てて検証し、終了時に破棄する。

```bash
# macOS
brew install postgresql@17
bash supabase/tests/run-standalone.sh
```

`PG_BIN`（bin ディレクトリ）と `PORT` を環境変数で上書き可能。
このモードでは Supabase が本来提供する auth スキーマ・ロール・`auth.uid()`・拡張を
[`shim.sql`](./shim.sql) で再現する。

### B. Supabase CLI（Docker あり）

```bash
supabase start
supabase db reset            # migrations を適用
psql "$(supabase status -o env | grep DB_URL | cut -d= -f2-)" \
  -f supabase/tests/fixtures.sql \
  -f supabase/tests/logic.test.sql
```

この場合 `shim.sql` は不要（Supabase 本体が提供するため）。

## ファイル

| ファイル | 役割 |
|---|---|
| `run-standalone.sh` | 使い捨て Postgres を立て、shim→migrations→fixtures→tests→並行テストを実行 |
| `shim.sql` | 素の Postgres 用の Supabase 互換シム（モード B では不要） |
| `fixtures.sql` | 組織・ユーザー・招待コード等のテストデータ |
| `logic.test.sql` | 招待 / posts トリガ / BAN / RLS のアサーション（`assert` で FAIL 時に停止） |

## カバー範囲の注意

ここで検証するのは **DB レイヤ**（SQL・RLS・トリガ・RPC）まで。Google OAuth の
HTTP/PKCE/cookie を通した**アプリ全体の e2e** は、本物の Supabase プロジェクト + OAuth
クライアント（#9）が必要で、本ハーネスの対象外（#25 の残タスク）。
