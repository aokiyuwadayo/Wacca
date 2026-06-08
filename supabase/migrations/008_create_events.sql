-- events: イベント掲示板の募集（「一人で行きづらいイベントに一緒に行く仲間を探す」）。
-- 記名投稿のみ（匿名なし）。requirements-v0.1.md §5 events / Issue #16 に対応。

create table public.events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null references public.members(id) on delete restrict,
  title text not null check (char_length(trim(title)) between 1 and 120),
  description text not null default '' check (char_length(description) <= 4000),
  starts_at timestamptz not null,
  location text not null default '' check (char_length(location) <= 200),
  capacity int check (capacity is null or capacity >= 1),
  status text not null default 'open' check (status in ('open', 'closed', 'cancelled')),
  created_at timestamptz not null default now()
);

-- 一覧（自org・募集中・開催日順）と、募集者別の引きを想定したインデックス。
create index idx_events_org_status_starts
  on public.events (organization_id, status, starts_at);
create index events_created_by_idx on public.events(created_by);

-- 募集者が自org の active member であり、organization_id が募集者の所属と
-- 一致することを検証する（posts の set_post_author_metadata と同方式：
-- クライアントが渡した値を検証し、不一致なら例外。RLS との評価順に依存しない）。
create or replace function public.set_event_creator_metadata()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  creator record;
begin
  select organization_id, status
  into creator
  from public.members
  where id = new.created_by;

  if creator is null or creator.status <> 'active' then
    raise exception 'event creator must be an active member';
  end if;

  if new.organization_id <> creator.organization_id then
    raise exception 'event organization must match creator organization';
  end if;

  return new;
end;
$$;

comment on function public.set_event_creator_metadata()
is 'Validates the event creator is an active member and that organization_id matches their membership.';

revoke all on function public.set_event_creator_metadata() from public;

create trigger set_event_creator_metadata
before insert or update of organization_id, created_by
on public.events
for each row
execute function public.set_event_creator_metadata();

alter table public.events enable row level security;

create policy "Members can read events in their organization"
on public.events
for select
to authenticated
using (organization_id = public.current_member_organization_id());

create policy "Members can create events in their organization"
on public.events
for insert
to authenticated
with check (
  created_by = auth.uid()
  and organization_id = public.current_member_organization_id()
);

create policy "Creators can update their own events"
on public.events
for update
to authenticated
using (
  created_by = auth.uid()
  and organization_id = public.current_member_organization_id()
)
with check (
  created_by = auth.uid()
  and organization_id = public.current_member_organization_id()
);

grant select (
  id,
  organization_id,
  created_by,
  title,
  description,
  starts_at,
  location,
  capacity,
  status,
  created_at
) on public.events to authenticated;

grant insert (
  organization_id,
  created_by,
  title,
  description,
  starts_at,
  location,
  capacity
) on public.events to authenticated;

grant update (
  title,
  description,
  starts_at,
  location,
  capacity,
  status
) on public.events to authenticated;

grant all on public.events to service_role;
