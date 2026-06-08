-- Supabase 相当の最小シム（Docker 無しの素の Postgres で migration を検証するため）。
--
-- 本番 / `supabase start` の環境ではこのファイルは不要。Supabase が auth スキーマ・
-- ロール・auth.uid()・拡張を提供するため。run-standalone.sh から呼ばれる。

create extension if not exists pgcrypto;  -- digest()（generate_member_anonymous_hash で使用）

-- Supabase のロール
do $$
begin
  if not exists (select from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;
end $$;

-- auth スキーマ + users（members.id の参照先）
create schema if not exists auth;
grant usage on schema auth to anon, authenticated, service_role;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text
);

-- auth.uid(): Supabase 同様、セッション GUC からカレントユーザ id を読む。
-- テストでは `select set_config('request.jwt.claim.sub', '<uuid>', false)` で設定する。
create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

grant usage on schema public to anon, authenticated, service_role;
