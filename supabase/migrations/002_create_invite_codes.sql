create table public.invite_codes (
  code text primary key check (code ~ '^[A-Z0-9]{6,32}$'),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  issued_by uuid,
  max_uses integer not null default 1 check (max_uses > 0),
  used_count integer not null default 0 check (used_count >= 0),
  expires_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now(),
  constraint invite_codes_used_count_lte_max_uses check (used_count <= max_uses)
);

create index invite_codes_organization_id_idx on public.invite_codes(organization_id);
create index invite_codes_expires_at_idx on public.invite_codes(expires_at);

alter table public.invite_codes enable row level security;

create policy "Anyone can read usable invite codes"
on public.invite_codes
for select
to anon, authenticated
using (
  expires_at > now()
  and used_count < max_uses
);

grant select on public.invite_codes to anon, authenticated;
grant all on public.invite_codes to service_role;
