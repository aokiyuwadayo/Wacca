create table public.members (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  display_name text not null check (
    char_length(trim(display_name)) between 1 and 80
  ),
  role text not null default 'member' check (role in ('member', 'moderator', 'admin')),
  joined_at timestamptz not null default now(),
  invite_code text references public.invite_codes(code) on delete set null,
  anonymous_hash text not null check (anonymous_hash ~ '^[a-f0-9]{64}$'),
  status text not null default 'active' check (status in ('active', 'suspended', 'left')),
  constraint members_organization_anonymous_hash_key unique (organization_id, anonymous_hash)
);

create index members_organization_id_idx on public.members(organization_id);
create index members_invite_code_idx on public.members(invite_code);
create index members_status_idx on public.members(status);

alter table public.invite_codes
  add constraint invite_codes_issued_by_fkey
  foreign key (issued_by)
  references public.members(id)
  on delete set null;

create or replace function public.current_member_organization_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id
  from public.members
  where id = auth.uid()
    and status = 'active'
  limit 1
$$;

comment on function public.current_member_organization_id()
is 'Returns the current active member organization for RLS policies.';

create or replace function public.current_member_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.members
  where id = auth.uid()
    and status = 'active'
  limit 1
$$;

comment on function public.current_member_role()
is 'Returns the current active member role for RLS policies.';

create or replace function public.generate_member_anonymous_hash(
  member_id uuid,
  member_organization_id uuid
)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select encode(
    digest(member_id::text || organizations.anonymity_salt, 'sha256'),
    'hex'
  )
  from public.organizations
  where organizations.id = member_organization_id
  limit 1
$$;

comment on function public.generate_member_anonymous_hash(uuid, uuid)
is 'Generates the per-organization anonymous hash for a member id.';

revoke all on function public.current_member_organization_id() from public;
revoke all on function public.current_member_role() from public;
revoke all on function public.generate_member_anonymous_hash(uuid, uuid) from public;

alter table public.members enable row level security;

create policy "Members can read their organization"
on public.organizations
for select
to authenticated
using (id = public.current_member_organization_id());

create policy "Members can read members in their organization"
on public.members
for select
to authenticated
using (organization_id = public.current_member_organization_id());

create policy "Members can update their own profile"
on public.members
for update
to authenticated
using (id = auth.uid())
with check (
  id = auth.uid()
  and organization_id = public.current_member_organization_id()
);

grant execute on function public.current_member_organization_id() to authenticated;
grant execute on function public.current_member_role() to authenticated;
grant execute on function public.generate_member_anonymous_hash(uuid, uuid) to service_role;

grant select (
  id,
  organization_id,
  display_name,
  role,
  joined_at,
  invite_code,
  status
) on public.members to authenticated;
grant update (display_name) on public.members to authenticated;
grant all on public.members to service_role;
