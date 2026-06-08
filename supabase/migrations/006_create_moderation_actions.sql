create table public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  moderator_id uuid not null references public.members(id) on delete restrict,
  action text not null check (action in ('approve', 'reject', 'request_edit', 'ban_hash')),
  reason text,
  created_at timestamptz not null default now()
);

create index moderation_actions_post_id_idx on public.moderation_actions(post_id);
create index moderation_actions_moderator_id_idx on public.moderation_actions(moderator_id);

alter table public.moderation_actions enable row level security;

create policy "Moderators can read moderation actions in their organization"
on public.moderation_actions
for select
to authenticated
using (
  public.current_member_role() in ('moderator', 'admin')
  and exists (
    select 1
    from public.posts
    where posts.id = moderation_actions.post_id
      and posts.organization_id = public.current_member_organization_id()
  )
);

create policy "Moderators can create moderation actions in their organization"
on public.moderation_actions
for insert
to authenticated
with check (
  moderator_id = auth.uid()
  and public.current_member_role() in ('moderator', 'admin')
  and exists (
    select 1
    from public.posts
    where posts.id = moderation_actions.post_id
      and posts.organization_id = public.current_member_organization_id()
  )
);

grant select, insert on public.moderation_actions to authenticated;
grant all on public.moderation_actions to service_role;
