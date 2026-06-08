\set ON_ERROR_STOP on
set client_min_messages = notice;

-- ============================================================
-- Test A: 招待コードのアトミック消費 + 冪等性（BLOCKER 修正の核）
-- ============================================================
do $$
declare r text;
begin
  -- max_uses=1 の INVITE01 を u1 が消費 → created
  r := public.redeem_invite_and_create_member('INVITE01', '11111111-1111-4111-8111-111111111111', 'User1');
  assert r = 'created', format('A1 expected created, got %s', r);

  -- 同じ枯渇コードを u2 が使う → no_invite（二重消費されない）
  r := public.redeem_invite_and_create_member('INVITE01', '22222222-2222-4222-8222-222222222222', 'User2');
  assert r = 'no_invite', format('A2 expected no_invite, got %s', r);

  -- u1 が再ログイン → exists（冪等・招待は消費しない）
  r := public.redeem_invite_and_create_member('INVITE01', '11111111-1111-4111-8111-111111111111', 'User1');
  assert r = 'exists', format('A3 expected exists, got %s', r);

  -- 期限切れコード → no_invite
  r := public.redeem_invite_and_create_member('EXPIRED1', '33333333-3333-4333-8333-333333333333', 'User3');
  assert r = 'no_invite', format('A4 expected no_invite (expired), got %s', r);

  raise notice 'Test A (redeem functional + idempotency): PASS';
end $$;

do $$
declare c int; uc int;
begin
  select count(*) into c from public.members where invite_code = 'INVITE01';
  select used_count into uc from public.invite_codes where code = 'INVITE01';
  assert c = 1, format('A5 member count expected 1, got %s', c);
  assert uc = 1, format('A6 used_count expected 1, got %s', uc);
  -- 枯渇コードで member が増えていない（u2 は作られていない）
  assert not exists (select 1 from public.members where id = '22222222-2222-4222-8222-222222222222'),
    'A7 u2 should NOT have been created from exhausted invite';
  raise notice 'Test A (counts: members=%, used_count=%): PASS', c, uc;
end $$;

-- ============================================================
-- Test B: posts トリガ（author_hash 自動設定）+ BAN ブロック
-- ============================================================
do $$
declare h text; pid uuid;
begin
  -- u1（active member）が投稿 → author_hash が members.anonymous_hash と一致、status=pending
  insert into public.posts (organization_id, author_member_id, category, body)
  values ('00000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'idea', 'はじめての投稿')
  returning author_hash, id into h, pid;

  assert h = (select anonymous_hash from public.members where id = '11111111-1111-4111-8111-111111111111'),
    'B1 author_hash should equal member anonymous_hash';
  assert (select status from public.posts where id = pid) = 'pending', 'B2 new post status should be pending';
  raise notice 'Test B1 (author_hash trigger): PASS';
end $$;

do $$
declare banned_ok boolean := false;
begin
  -- u1 のハッシュを BAN
  insert into public.banned_hashes (organization_id, hash, banned_by)
  values (
    '00000000-0000-4000-8000-000000000001',
    (select anonymous_hash from public.members where id = '11111111-1111-4111-8111-111111111111'),
    '44444444-4444-4444-8444-444444444444'
  );

  -- BAN 後に u1 が投稿 → 例外（post author is banned）
  begin
    insert into public.posts (organization_id, author_member_id, category, body)
    values ('00000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'idea', 'BAN後の投稿');
  exception when others then
    if sqlerrm like '%banned%' then banned_ok := true; end if;
  end;
  assert banned_ok, 'B3 banned author should be blocked from posting';
  raise notice 'Test B2 (banned-hash blocks posting): PASS';
end $$;

-- ============================================================
-- Test C: RLS（authenticated ロールでの可視性）
-- ============================================================
-- 準備: u3 を会員化（INVITE02）し、u3 の pending 投稿と、承認済み投稿を1件ずつ用意
do $$
declare r text; approved_id uuid;
begin
  r := public.redeem_invite_and_create_member('INVITE02', '33333333-3333-4333-8333-333333333333', 'User3');
  assert r = 'created', format('C0 expected created, got %s', r);

  -- u3 の pending 投稿
  insert into public.posts (organization_id, author_member_id, category, body)
  values ('00000000-0000-4000-8000-000000000001', '33333333-3333-4333-8333-333333333333', 'request', 'u3 の保留投稿');

  -- モデレーターの投稿を作って承認済みにする（approved には approved_by/at 必須）
  insert into public.posts (organization_id, author_member_id, category, body)
  values ('00000000-0000-4000-8000-000000000001', '44444444-4444-4444-8444-444444444444', 'other', '承認済み投稿')
  returning id into approved_id;
  update public.posts set status='approved', approved_by='44444444-4444-4444-8444-444444444444', approved_at=now()
  where id = approved_id;
end $$;

-- authenticated ロール + auth.uid()=u3 で SELECT。承認済みのみ見え、他人の pending は見えない。
set role authenticated;
select set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333333', false);

do $$
declare visible int; pending_visible int;
begin
  select count(*) into visible from public.posts;
  select count(*) into pending_visible from public.posts where status = 'pending';
  assert visible = 1, format('C1 authenticated member should see only 1 approved post, got %s', visible);
  assert pending_visible = 0, format('C2 member should NOT see any pending posts, got %s', pending_visible);
  raise notice 'Test C1 (RLS: members read only approved): PASS (visible=%)', visible;
end $$;

-- 一般会員はモデレーション関数（先頭4文字）を呼んでも 0 件（role が member のため）
do $$
declare modcount int;
begin
  select count(*) into modcount from public.list_moderation_posts();
  assert modcount = 0, format('C3 non-moderator should get 0 from list_moderation_posts, got %s', modcount);
  raise notice 'Test C2 (RLS: non-moderator sees no moderation queue): PASS';
end $$;

reset role;
select set_config('request.jwt.claim.sub', '44444444-4444-4444-8444-444444444444', false);
set role authenticated;

-- モデレーターはモデキューで保留投稿が見え、author_hash は先頭4文字+省略記号のみ
do $$
declare modcount int; sample text;
begin
  select count(*) into modcount from public.list_moderation_posts() where status = 'pending';
  assert modcount >= 1, format('C4 moderator should see pending posts in queue, got %s', modcount);
  select author_hash_prefix into sample from public.list_moderation_posts() limit 1;
  assert length(sample) = 4, format('C5 moderation prefix should be 4 chars, got %s (len %s)', sample, length(sample));
  raise notice 'Test C3 (RLS: moderator sees queue, hash prefix=%): PASS', sample;
end $$;

reset role;

\echo '==================================================='
\echo 'ALL LOGIC TESTS PASSED'
\echo '==================================================='
