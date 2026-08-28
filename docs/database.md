# Database

PostgreSQL on Supabase. Schema is defined as ordered SQL migrations in
`supabase/migrations/`. Apply them in order.

## Migrations

| File | Contents |
| --- | --- |
| `0001_extensions_and_helpers.sql` | Extensions, enums, `updated_at` trigger |
| `0002_core_tenancy.sql` | `profiles`, `organizations`, `organization_members`, invitations; new-user trigger |
| `0003_billing_and_entitlements.sql` | `features`, `subscription_plans`, `plan_features`, `subscriptions`, items, usage, `payments`, `invoices`, `billing_events` |
| `0004_lms_domain.sql` | subjects, learners, parents, courses/modules/lessons, classes, assignments, assessments, attendance, grading, progress, resources, messaging, notifications, calendar, files, audit logs |
| `0005_learner_limits.sql` | `get_active_learner_count`, `get_learner_limit`, `can_add_learner`, `enforce_learner_limit` trigger |
| `0006_rls.sql` | SECURITY DEFINER auth/portal helper functions + Row Level Security for every table |
| `0007_multicurrency_and_onboarding.sql` | Org fields (`employs_tutors`, `portal_preferences`) + `plan_prices` (multi-currency: USD, NGN, …). Additive. |
| `0008_learner_billing.sql` | Per-learner monthly billing (`learner_billing`); drops the seat-cap trigger. Free trial = 1 learner, 1 month. Additive. |
| `0009_rewards_and_gamification.sql` | Reward/sanction points ledger (`reward_events`) + learner avatar/theme. Additive. |
| `0010_learner_portal_invites.sql` | Token-based learner portal invitations (`learner_portal_invites`). Additive. |
| `0011_coupons.sql` | Platform discount `coupons` (super-admin managed). Additive. |

Seed the catalogue with `supabase/seed/seed.sql` (features + plans + plan_features).

## Conventions

- **UUID primary keys** (`gen_random_uuid()`).
- **`created_at` / `updated_at`** timestamps; `updated_at` maintained by the `set_updated_at`
  trigger.
- **Foreign keys** with sensible `on delete` (`cascade` for tenant children, `set null` for
  optional references).
- **Indexes** on `organization_id` and common filter columns.
- **Money** in minor units as `bigint`.
- **Soft delete / archive** via `status` + `archived_at` (learners, classes, courses, orgs)
  rather than hard deletes — see [data lifecycle](#data-lifecycle).
- **Enums** for constrained domains (roles, statuses, intervals, question types, …).

## Types

`src/types/database.types.ts` mirrors the generated Supabase shape. In a linked environment,
regenerate it:

```bash
pnpm db:types   # supabase gen types typescript --local
```

The hand-authored file currently covers the tables referenced by application code; the
migrations remain the source of truth for the schema.

## Data lifecycle

- **Archived learners**: preserved, excluded from seat counts and active lists.
- **Cancelled/expired subscriptions**: data preserved, premium features restricted, renewal
  allowed.
- **Deleted organizations**: cascade to tenant children (consider a soft-delete/retention
  window before hard delete in production).
- **Files**: `files` rows track Supabase Storage objects scoped by `organization_id`.
