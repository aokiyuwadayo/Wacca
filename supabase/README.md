# Supabase Local Development

This directory contains the Supabase CLI configuration for local development.

```bash
supabase start
supabase status
```

Copy the values from `supabase status` into `.env.local`:

- `API URL` -> `NEXT_PUBLIC_SUPABASE_URL`
- `anon key` -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role key` -> `SUPABASE_SERVICE_ROLE_KEY`

The production Supabase project should be created in the Northeast Asia
(Tokyo) region from the Supabase dashboard. Region is not configured in the
local CLI config.
