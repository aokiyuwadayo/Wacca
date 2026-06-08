-- event_participants: イベントへの「行く」表明。記名のみ。
-- 1 メンバー = 1 表明/イベント。requirements-v0.1.md §5 / Issue #16 に対応。

create table public.event_participants (
  event_id uuid not null references public.events(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (event_id, member_id)
);

create index event_participants_member_id_idx
  on public.event_participants(member_id);

-- 参加表明の整合性を DB 側でも担保（RLS の防御に加えた多層防御）:
--  - 表明者は active member 本人であること
--  - 対象イベントは自分と同じ organization で、status = 'open' であること
--  - 定員ありなら満員でないこと（満員時は参加不可）
create or replace function public.validate_event_participation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  joiner record;
  ev record;
  current_count int;
begin
  select organization_id, status
  into joiner
  from public.members
  where id = new.member_id;

  if joiner is null or joiner.status <> 'active' then
    raise exception 'participant must be an active member';
  end if;

  select organization_id, status, capacity
  into ev
  from public.events
  where id = new.event_id;

  if ev is null then
    raise exception 'event does not exist';
  end if;

  if ev.organization_id <> joiner.organization_id then
    raise exception 'cannot join an event from another organization';
  end if;

  if ev.status <> 'open' then
    raise exception 'event is not open for participation';
  end if;

  if ev.capacity is not null then
    select count(*)
    into current_count
    from public.event_participants
    where event_id = new.event_id;

    if current_count >= ev.capacity then
      raise exception 'event is already at full capacity';
    end if;
  end if;

  return new;
end;
$$;

comment on function public.validate_event_participation()
is 'Ensures a join is by an active member, on an open event in the same organization, with capacity available.';

revoke all on function public.validate_event_participation() from public;

create trigger validate_event_participation
before insert
on public.event_participants
for each row
execute function public.validate_event_participation();

alter table public.event_participants enable row level security;

create policy "Members can read participants for events in their organization"
on public.event_participants
for select
to authenticated
using (
  exists (
    select 1
    from public.events
    where events.id = event_participants.event_id
      and events.organization_id = public.current_member_organization_id()
  )
);

create policy "Members can declare their own participation"
on public.event_participants
for insert
to authenticated
with check (member_id = auth.uid());

create policy "Members can withdraw their own participation"
on public.event_participants
for delete
to authenticated
using (member_id = auth.uid());

grant select (event_id, member_id, joined_at)
  on public.event_participants to authenticated;
grant insert (event_id, member_id)
  on public.event_participants to authenticated;
grant delete
  on public.event_participants to authenticated;

grant all on public.event_participants to service_role;
