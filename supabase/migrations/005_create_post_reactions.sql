create table public.post_reactions (
  post_id uuid not null references public.posts(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, member_id)
);

create index post_reactions_member_id_idx on public.post_reactions(member_id);

alter table public.post_reactions enable row level security;

create policy "Members can read reactions on approved organization posts"
on public.post_reactions
for select
to authenticated
using (
  exists (
    select 1
    from public.posts
    where posts.id = post_reactions.post_id
      and posts.organization_id = public.current_member_organization_id()
      and posts.status = 'approved'
  )
);

create policy "Members can react to approved organization posts"
on public.post_reactions
for insert
to authenticated
with check (
  member_id = auth.uid()
  and exists (
    select 1
    from public.posts
    where posts.id = post_reactions.post_id
      and posts.organization_id = public.current_member_organization_id()
      and posts.status = 'approved'
  )
);

create policy "Members can remove their own reactions"
on public.post_reactions
for delete
to authenticated
using (member_id = auth.uid());

grant select (
  post_id,
  created_at
) on public.post_reactions to authenticated;

grant insert (
  post_id,
  member_id
) on public.post_reactions to authenticated;

grant delete on public.post_reactions to authenticated;
grant all on public.post_reactions to service_role;
