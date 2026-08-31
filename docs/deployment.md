# Deployment

Tuvoria is Vercel-compatible and runs against a Supabase project.

## Prerequisites

1. A Supabase project (Database, Auth, Storage).
2. Payment provider accounts (Paystack and/or Stripe) — optional until billing goes live.
3. A Resend account for transactional email — optional until email goes live.

## Steps

1. **Database**: apply `supabase/migrations/0001`–`0006` in order (Supabase SQL editor or
   `supabase db push`). Then run `supabase/seed/seed.sql`.
2. **Storage**: create buckets for org assets/resources; objects are tracked in `files` and
   scoped by `organization_id`.
3. **Environment**: set the variables from `.env.example` in Vercel (Project → Settings →
   Environment Variables). Keep `SUPABASE_SERVICE_ROLE_KEY` and provider secrets as
   server-only.
4. **Deploy**: import the repo into Vercel. Build command `pnpm build`, output is the default
   Next.js build.
5. **Webhooks**: point provider webhooks at `/api/webhooks/stripe` and
   `/api/webhooks/paystack` once billing is wired. Processing is idempotent
   (`billing_events`).

## Environment variables

See `.env.example` for the full list. Public (`NEXT_PUBLIC_*`) values are browser-safe;
everything else is server-only. Never expose the service role key or provider secrets to the
client. Never commit `.env.local`.

## Post-deploy checks

- Sign up → onboarding → dashboard works.
- Pricing page shows seeded plans.
- RLS is enabled (Supabase advisor should report no tables without RLS).
- Adding learners past the plan limit is rejected by the DB trigger.
