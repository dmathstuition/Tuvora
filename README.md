# Tuvora

**Manage. Teach. Grow.** — the operating system for independent tutors and tutoring businesses.

Tuvora is a production-grade, multi-tenant SaaS platform that lets tutors and tutoring
businesses run their entire operation from one place: learners, classes, courses, lessons,
assignments, assessments, attendance, grades, progress, reports, resources, messaging,
scheduling, payments, invoices, subscriptions and analytics.

> This is not a simple CRUD LMS. The architecture is built as a scalable multi-tenant SaaS
> from day one — tenant isolation, RBAC, an entitlement engine and a payment-provider
> abstraction are foundational, not bolted on.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router), React 19, TypeScript (strict) |
| Styling | Tailwind CSS + a token-driven design system |
| UI | Radix primitives, shadcn-style components, Lucide icons |
| Database | Supabase PostgreSQL with Row Level Security |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Payments | Provider abstraction (Paystack + Stripe) |
| Email | Resend-compatible |
| Validation | Zod + React Hook Form |
| Charts / Tables | Recharts / TanStack Table |
| Testing | Vitest (unit) + Playwright (e2e) |
| Tooling | ESLint, Prettier, pnpm |
| Deploy | Vercel-compatible |

## Getting started

```bash
pnpm install
cp .env.example .env.local   # fill in Supabase + provider keys

# Apply the database schema (Supabase CLI or SQL editor), in order:
#   supabase/migrations/0001 … 0006
# Then seed the plan/feature catalogue:
#   supabase/seed/seed.sql

pnpm dev        # http://localhost:3000
```

### Scripts

```bash
pnpm dev          # start the dev server
pnpm build        # production build
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint
pnpm test         # vitest unit tests
pnpm test:e2e     # playwright
pnpm db:types     # regenerate src/types/database.types.ts from the linked DB
```

## Architecture at a glance

```
User ──< organization_members >── Organization (tenant boundary)
                                      └── Learners / Classes / Courses / …
```

- **Tenant isolation** is enforced by PostgreSQL RLS (`supabase/migrations/0006_rls.sql`),
  not by frontend filtering. Organization A can never read Organization B's data.
- **Authorization** is centralized: `can(ctx, 'learners.create')` — no scattered role checks.
- **Entitlements** (plans, features, limits, prices) live in the database as admin-editable
  data. Nothing is hardcoded in the app.
- **Learner-seat billing** is enforced at three layers: UI affordance, server service, and a
  database trigger backstop.
- **Payments** depend only on the `PaymentProvider` interface, so Paystack/Stripe/anything
  else can be swapped without touching business logic. Webhooks are idempotent.

See [`docs/`](./docs) for the full architecture, database, authorization, subscriptions,
billing, tenant-isolation, deployment and development guides.

## Project structure

```
src/
  app/              # App Router: (marketing) (auth) (dashboard) admin api
  components/       # ui/ brand/ marketing/ dashboard/
  lib/              # supabase/ auth/ permissions/ entitlements/ billing/ payments/ …
  services/         # domain services (learners, billing, organizations, …)
  schemas/          # Zod schemas
  constants/        # roles, permissions, org types, features, subscription states
  config/           # site + navigation config
  types/            # database types
supabase/
  migrations/       # ordered SQL schema + RLS
  seed/             # plan/feature catalogue + demo data
docs/               # architecture documentation
tests/              # unit + e2e
```

## Status

Phase 1 (foundation) and the SaaS billing/entitlement core are implemented and validated
(typecheck, lint, unit tests, production build all green). See `docs/ROADMAP.md` for the
phased plan and what comes next.
