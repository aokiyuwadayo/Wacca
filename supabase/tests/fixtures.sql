-- 検証用フィクスチャ（postgres ロールで投入）。
set client_min_messages = warning;

-- 組織
insert into public.organizations (id, name, slug, anonymity_salt)
values ('00000000-0000-4000-8000-000000000001', '起業部', 'kigyou-bu', 'local-test-anonymity-salt-0123456789abcdef')
on conflict (id) do nothing;

-- auth.users（メンバーの id 参照先）
insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'u1@example.com'),
  ('22222222-2222-4222-8222-222222222222', 'u2@example.com'),
  ('33333333-3333-4333-8333-333333333333', 'u3@example.com'),
  ('44444444-4444-4444-8444-444444444444', 'mod@example.com')
on conflict (id) do nothing;

-- 招待コード
insert into public.invite_codes (code, organization_id, max_uses, used_count, expires_at) values
  ('INVITE01', '00000000-0000-4000-8000-000000000001', 1, 0, now() + interval '14 days'),
  ('INVITE02', '00000000-0000-4000-8000-000000000001', 2, 0, now() + interval '14 days'),
  ('EXPIRED1', '00000000-0000-4000-8000-000000000001', 5, 0, now() - interval '1 day')
on conflict (code) do nothing;

-- モデレーター会員（hash は DB 関数で生成）
insert into public.members (id, organization_id, display_name, role, anonymous_hash, status)
values (
  '44444444-4444-4444-8444-444444444444',
  '00000000-0000-4000-8000-000000000001',
  'モデレーター',
  'moderator',
  public.generate_member_anonymous_hash('44444444-4444-4444-8444-444444444444', '00000000-0000-4000-8000-000000000001'),
  'active'
) on conflict (id) do nothing;
