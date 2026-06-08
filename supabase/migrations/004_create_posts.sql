create table public.posts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  author_member_id uuid not null references public.members(id) on delete restrict,
  author_hash text not null check (author_hash ~ '^[a-f0-9]{64}$'),
  is_anonymous boolean not null default true,
  category text not null check (category in ('request', 'idea', 'other')),
  body text not null check (char_length(trim(body)) between 1 and 4000),
  status text not null default 'pending' check (
    status in ('pending', 'approved', 'rejected', 'edit_requested')
  ),
  approved_by uuid references public.members(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  constraint posts_approved_state_check check (
    (
      status = 'approved'
      and approved_by is not null
      and approved_at is not null
    )
    or (
      status <> 'approved'
      and approved_by is null
      and approved_at is null
    )
  )
);

create index idx_posts_org_status_created
  on public.posts (organization_id, status, created_at desc);

create index idx_posts_org_category_created
  on public.posts (organization_id, category, created_at desc)
  where status = 'approved';

create index posts_author_member_id_idx on public.posts(author_member_id);
create index posts_author_hash_idx on public.posts(organization_id, author_hash);

create or replace function public.set_post_author_metadata()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  author_record record;
begin
  select organization_id, anonymous_hash, status
  into author_record
  from public.members
  where id = new.author_member_id;

  if author_record is null or author_record.status <> 'active' then
    raise exception 'post author must be an active member';
  end if;

  if new.organization_id <> author_record.organization_id then
    raise exception 'post organization must match author organization';
  end if;

  new.author_hash := author_record.anonymous_hash;

  return new;
end;
$$;

comment on function public.set_post_author_metadata()
is 'Sets author_hash from members.anonymous_hash and validates author organization.';

revoke all on function public.set_post_author_metadata() from public;

create trigger set_post_author_metadata
before insert or update of organization_id, author_member_id
on public.posts
for each row
execute function public.set_post_author_metadata();

alter table public.posts enable row level security;

create policy "Members can read approved posts in their organization"
on public.posts
for select
to authenticated
using (
  organization_id = public.current_member_organization_id()
  and status = 'approved'
);

create policy "Moderators can read posts in their organization"
on public.posts
for select
to authenticated
using (
  organization_id = public.current_member_organization_id()
  and public.current_member_role() in ('moderator', 'admin')
);

create policy "Members can create their own pending posts"
on public.posts
for insert
to authenticated
with check (
  organization_id = public.current_member_organization_id()
  and author_member_id = auth.uid()
  and status = 'pending'
  and approved_by is null
  and approved_at is null
);

create policy "Moderators can update posts in their organization"
on public.posts
for update
to authenticated
using (
  organization_id = public.current_member_organization_id()
  and public.current_member_role() in ('moderator', 'admin')
)
with check (
  organization_id = public.current_member_organization_id()
  and public.current_member_role() in ('moderator', 'admin')
);

grant select (
  id,
  organization_id,
  is_anonymous,
  category,
  body,
  status,
  approved_by,
  approved_at,
  created_at
) on public.posts to authenticated;

grant insert (
  organization_id,
  author_member_id,
  is_anonymous,
  category,
  body
) on public.posts to authenticated;

grant update (
  status,
  approved_by,
  approved_at
) on public.posts to authenticated;

grant all on public.posts to service_role;

create or replace function public.list_moderation_posts()
returns table (
  id uuid,
  organization_id uuid,
  author_hash_prefix text,
  is_anonymous boolean,
  category text,
  body text,
  status text,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    posts.id,
    posts.organization_id,
    left(posts.author_hash, 4) as author_hash_prefix,
    posts.is_anonymous,
    posts.category,
    posts.body,
    posts.status,
    posts.approved_by,
    posts.approved_at,
    posts.created_at
  from public.posts
  where posts.organization_id = public.current_member_organization_id()
    and public.current_member_role() in ('moderator', 'admin')
  order by posts.created_at desc
$$;

comment on function public.list_moderation_posts()
is 'Returns moderator-visible posts with only the first four characters of author_hash.';

revoke all on function public.list_moderation_posts() from public;
grant execute on function public.list_moderation_posts() to authenticated;
