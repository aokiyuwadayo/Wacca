insert into public.organizations (id, name, slug, anonymity_salt)
values (
  '00000000-0000-4000-8000-000000000001',
  '起業部',
  'kigyou-bu',
  'local-dev-kigyou-bu-anonymity-salt-change-in-production'
)
on conflict (slug) do update
set
  name = excluded.name;
