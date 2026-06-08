-- 自分がリアクション済みの post_id 一覧を返す。
--
-- post_reactions.member_id は authenticated に select 権限が無い（誰がリアクション
-- したかは他メンバーから見えない privacy 設計）。一方で各メンバーは「自分が
-- リアクション済みか」を知らないとトグル UI を描画できないため、自分の行だけを
-- 返す security definer 関数を用意する。
create or replace function public.my_reacted_post_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select post_id
  from public.post_reactions
  where member_id = auth.uid()
$$;

comment on function public.my_reacted_post_ids()
is 'Returns the post ids the current member has reacted to (own reaction state only).';

revoke all on function public.my_reacted_post_ids() from public;
grant execute on function public.my_reacted_post_ids() to authenticated;
