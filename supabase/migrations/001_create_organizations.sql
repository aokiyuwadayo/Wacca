create extension if not exists "pgcrypto";

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  anonymity_salt text not null check (char_length(anonymity_salt) >= 32),
  created_at timestamptz not null default now()
);

alter table public.organizations enable row level security;

grant select (id, name, slug, created_at) on public.organizations to authenticated;
grant all on public.organizations to service_role;
