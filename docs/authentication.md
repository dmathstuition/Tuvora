# Authentication

Authentication uses **Supabase Auth**. Sessions are cookie-based and refreshed on every
request by `middleware.ts`.

## Flows implemented

- Sign up (email/password) → email verification → onboarding
- Login / logout
- Forgot password / reset password
- Protected routes (`/dashboard`, `/admin`, `/onboarding`) via middleware
- Organization onboarding, invite users, accept invitation (schema + action in place)

Server actions live in `src/app/(auth)/actions.ts` and are Zod-validated. Password reset
responses are intentionally uniform to avoid leaking which emails are registered.

## Profile provisioning

A Postgres trigger (`handle_new_user`, `0002`) creates a `profiles` row automatically when an
`auth.users` row is inserted, copying `full_name` / `avatar_url` from sign-up metadata.

## Clients

- `src/lib/supabase/client.ts` — browser (anon key, RLS-enforced)
- `src/lib/supabase/server.ts` — server components / actions (anon key, RLS-enforced)
- `src/lib/supabase/middleware.ts` — session refresh + route gating
- `src/lib/supabase/admin.ts` — service role (bypasses RLS; trusted server code only)

## Future OAuth

The architecture is OAuth-ready (Google, Microsoft, others). Supabase Auth providers can be
enabled without changing the app's session handling; add provider buttons that call
`supabase.auth.signInWithOAuth`.

## Server security rules

Never trust client-provided: `organization_id`, role, subscription, learner count, or
permissions. Always resolve them server-side via `getAuthContext`. Validate every input with
Zod. Guard every server action and route handler.
