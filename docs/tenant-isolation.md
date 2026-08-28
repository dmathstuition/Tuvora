# Tenant Isolation

Tenant isolation is the most important security property in Tuvora. **Organization A must
never be able to access Organization B's data.** This is enforced at the database, not in the
frontend.

## Row Level Security (the last line of defence)

Every tenant-owned table has RLS enabled with a uniform policy
(`supabase/migrations/0006_rls.sql`):

```sql
create policy <table>_member_all on public.<table>
  for all
  using (public.is_super_admin() or public.is_org_member(organization_id))
  with check (public.is_super_admin() or public.is_org_member(organization_id));
```

Because all app queries run under the **anon key** (browser and server clients alike), these
policies apply to every read and write. A bug in application code cannot bypass them.

## Avoiding RLS recursion

Membership checks would recurse if a policy on `organization_members` queried
`organization_members`. We solve this with `SECURITY DEFINER` helper functions that run as the
table owner and are marked `STABLE`:

- `is_org_member(org uuid)`
- `has_org_role(org uuid, roles org_role[])`
- `can_manage_org(org uuid)`
- `is_super_admin()`, `is_platform_staff()`
- portal helpers: `is_self_learner`, `is_linked_parent`, `can_view_learner`

Policies call these functions instead of embedding sub-selects, keeping them non-recursive and
fast.

## Portal access (learners & parents)

Layered `SELECT` policies grant a learner access to **their own** data and a parent access to
**their linked children only** — never other learners:

- `learners_portal_select`, `attendance_portal_select`, `grades_portal_select`,
  `submissions_portal_select`, `results_portal_select`, `progress_*_portal_select`,
  `invoices_portal_select`.

## What RLS does *not* do

RLS guarantees the **tenant boundary**. Fine-grained, intra-tenant permissions (e.g. only an
accountant manages billing) are enforced in the application layer via `can()` — this keeps
policies simple and non-recursive. See [authorization](./authorization.md).

## Testing

Tenant isolation and authorization are covered by unit tests for the permission layer, and
should be covered by integration tests that assert cross-tenant reads return zero rows once a
test database is available (see `docs/development.md`).

## Never do this

- ❌ `USING (true)` on a sensitive tenant table.
- ❌ Filtering by `organization_id` only in the frontend.
- ❌ Passing a client-supplied `organization_id` into a trusted write without re-checking
  membership server-side.
