# Architecture

Tuvoria is a multi-tenant SaaS built on Next.js (App Router) and Supabase. The guiding
principle: **security and billing are foundational**, product modules sit on top.

## Layers

```
┌───────────────────────────────────────────────────────────────┐
│  UI (Server + Client Components)  — no business logic           │
├───────────────────────────────────────────────────────────────┤
│  Services (src/services/*)        — domain logic, server-only   │
│  Server Actions / Route Handlers  — validated entry points      │
├───────────────────────────────────────────────────────────────┤
│  lib/*                            — permissions, entitlements,  │
│                                     billing, payments, auth      │
├───────────────────────────────────────────────────────────────┤
│  Supabase (Postgres + RLS, Auth, Storage)                       │
└───────────────────────────────────────────────────────────────┘
```

- **UI components never contain business logic.** They call services / server actions.
- **Services are server-only** and always re-derive the acting user + organization from the
  session (`getAuthContext`). They never trust client-supplied ids, roles, or counts.
- **`lib/` is pure and testable** where possible (permissions, entitlement engine, seat math
  have no I/O and are unit-tested).

## The tenant model

```
auth.users ─1:1─ profiles ─< organization_members >─ organizations
                                                          │
                        subjects, learners, parents, classes, courses,
                        lessons, assignments, assessments, attendance,
                        grades, progress, resources, messages, …
```

Every tenant-owned row carries `organization_id`. A user may belong to multiple
organizations; `organization_members` is the membership + role table. The active
organization is resolved server-side (defaulting to `profiles.last_active_organization_id`).

## Request lifecycle (protected route)

1. `middleware.ts` refreshes the Supabase session and redirects unauthenticated users.
2. The dashboard layout resolves `AuthContext` (user, platform role, org, org role,
   permission overrides) — all server-side.
3. Navigation and actions are gated by `can(ctx, permission)`.
4. Every query runs under the anon key, so **RLS is always in force** — even a logic bug
   cannot leak another tenant's data.

## Trusted server surface

The **service role** key bypasses RLS and is used only in:

- `src/lib/supabase/admin.ts` consumers: onboarding (atomic org + owner membership),
  webhook processing, and platform-admin services.

It is never exposed to the browser.

See also: [authorization](./authorization.md), [tenant-isolation](./tenant-isolation.md),
[subscriptions](./subscriptions.md), [billing](./billing.md), [database](./database.md).
