# Accounts & test data

## There are no user accounts in the seed files

`supabase/seed/seed.sql` and `seed_prices.sql` seed only the **plan/feature/price
catalogue**. User accounts are created through **Supabase Auth** (sign-up), not by
SQL, so they are never in the seed.

## Create a super admin

Platform admin access is controlled by `profiles.platform_role`. To make an
account a super admin:

1. **Sign up** in the app with the email you want to use (this creates the auth
   user and its `profiles` row automatically).
2. In the **Supabase SQL editor**, run:

   ```sql
   update public.profiles
   set platform_role = 'super_admin'
   where email = 'you@example.com';
   ```

3. Log in again — you'll be routed to **`/admin`** (the platform command centre).

`platform_support` is a lower tier (`set platform_role = 'platform_support'`).
Note: cross-tenant tenant data (organizations, learners, payments…) is only
fully visible to `super_admin` — RLS intentionally restricts `platform_support`
from tenant tables.

## Populate a demo academy (for testing every dashboard)

`supabase/seed/demo.sql` creates a full demo organization for an **existing**
account so the tutor dashboard, learner portal, leaderboard and admin area all
have data.

1. Sign up (as above).
2. Edit the `demo_email` value at the top of `supabase/seed/demo.sql` to your
   account's email.
3. Run it in the Supabase SQL editor.

It creates an organization (**Bright Minds Academy**, you as owner) with an
active subscription, 8 learners (first on the free trial, the rest paid/open),
a class with enrolments, a graded assignment, attendance and reward points.
Safe to re-run — it refreshes the same demo org.

## Roles recap

- **Platform**: `super_admin`, `platform_support` (→ `/admin`)
- **Organization**: `owner`, `admin`, `tutor`, `assistant`, `accountant`, `staff` (→ `/dashboard`)
- **Learner**: a `learners` row linked to an auth user (→ `/portal`); invite from a
  learner's profile, or a learner who signs up with the email you entered is
  auto-linked.
