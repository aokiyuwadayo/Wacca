create table public.banned_hashes (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  hash text not null check (hash ~ '^[a-f0-9]{64}$'),
  banned_by uuid not null references public.members(id) on delete restrict,
  reason text,
  created_at timestamptz not null default now(),
  primary key (organization_id, hash)
);

create index idx_banned_hashes_org_hash
  on public.banned_hashes (organization_id, hash);

create index banned_hashes_banned_by_idx on public.banned_hashes(banned_by);

alter table public.banned_hashes enable row level security;

create policy "Moderators can read banned hashes in their organization"
on public.banned_hashes
for select
to authenticated
using (
  organization_id = public.current_member_organization_id()
  and public.current_member_role() in ('moderator', 'admin')
);

create policy "Moderators can create banned hashes in their organization"
on public.banned_hashes
for insert
to authenticated
with check (
  organization_id = public.current_member_organization_id()
  and banned_by = auth.uid()
  and public.current_member_role() in ('moderator', 'admin')
);

grant select (
  organization_id,
  banned_by,
  reason,
  created_at
) on public.banned_hashes to authenticated;

grant insert (
  organization_id,
  hash,
  banned_by,
  reason
) on public.banned_hashes to authenticated;
grant all on public.banned_hashes to service_role;

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

  if exists (
    select 1
    from public.banned_hashes
    where banned_hashes.organization_id = new.organization_id
      and banned_hashes.hash = author_record.anonymous_hash
  ) then
    raise exception 'post author is banned';
  end if;

  new.author_hash := author_record.anonymous_hash;

  return new;
end;
$$;

comment on function public.set_post_author_metadata()
is 'Sets author_hash from members.anonymous_hash, validates organization, and blocks banned authors.';
