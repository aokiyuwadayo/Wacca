-- 招待コードの消費と member 作成を 1 トランザクションでアトミックに行う。
--
-- 以前は signup.ts 側で「used_count を読む → 残回数を検証 → member を insert →
-- used_count を +1」という非アトミックな手順だったため、max_uses=1 の招待に対して
-- 別ユーザー 2 人が同時にコールバックすると、両者とも used_count=0 を読んで検証を
-- 通過し、それぞれ別の member 行（id/anonymous_hash が異なり unique 制約に当たらない）
-- を作成できてしまう二重消費レースがあった。
--
-- ここでは「条件を満たす行だけを +1 する UPDATE ... RETURNING」で招待を消費する。
-- UPDATE は対象行をロックして直列化するため、最後の 1 枠を争う同時実行では片方しか
-- used_count < max_uses を満たさず、もう片方は 0 行更新となって弾かれる。member insert
-- まで同一トランザクション内で行うため、insert が失敗すれば used_count の増加も
-- まとめてロールバックされる。
create or replace function public.redeem_invite_and_create_member(
  p_code text,
  p_user_id uuid,
  p_display_name text
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_hash text;
begin
  -- 冪等: 既に member なら招待は消費しない（再ログイン）。
  if exists (select 1 from public.members where id = p_user_id) then
    return 'exists';
  end if;

  -- アトミックに招待を消費。条件を満たす行が無ければ 0 行更新 → v_org は null。
  update public.invite_codes
     set used_count = used_count + 1
   where code = p_code
     and used_count < max_uses
     and expires_at > now()
  returning organization_id into v_org;

  if v_org is null then
    return 'no_invite';
  end if;

  v_hash := public.generate_member_anonymous_hash(p_user_id, v_org);
  if v_hash is null then
    raise exception 'failed to generate anonymous_hash for organization %', v_org;
  end if;

  insert into public.members (
    id,
    organization_id,
    display_name,
    role,
    invite_code,
    anonymous_hash,
    status
  )
  values (
    p_user_id,
    v_org,
    p_display_name,
    'member',
    p_code,
    v_hash,
    'active'
  );

  return 'created';
end;
$$;

comment on function public.redeem_invite_and_create_member(text, uuid, text)
is 'Atomically redeems an invite code and creates the member in one transaction, preventing double-redemption of limited-use codes.';

revoke all on function public.redeem_invite_and_create_member(text, uuid, text) from public;
grant execute on function public.redeem_invite_and_create_member(text, uuid, text) to service_role;
