# Authorization

Authorization is **centralized**. There are no scattered `if (role === 'owner')` checks in the
codebase — everything goes through `can()`.

## Roles

**Platform roles** (on `profiles.platform_role`): `super_admin`, `platform_support`, `none`.

**Organization roles** (on `organization_members.role`): `owner`, `admin`, `tutor`,
`assistant`, `accountant`, `staff`.

**External roles**: `learner`, `parent` (modelled via `learners` / `parents` linked to auth
users, with portal RLS policies).

## Permissions

Permissions are `resource.action` strings defined once in `src/constants/roles.ts`
(`PERMISSIONS`). Each role maps to a default set (`ROLE_PERMISSIONS`). Per-member overrides
(`organization_members.permission_overrides`: `{ grant: [], revoke: [] }`) adjust the defaults.

## The `can()` function

```ts
import { getAuthContext } from '@/lib/auth/context';
import { can, assertCan } from '@/lib/permissions';

const ctx = await getAuthContext();
if (!can(ctx, 'learners.create')) { /* hide UI */ }

// In a service / action — throws ForbiddenError:
assertCan(ctx, 'learners.create');
```

Evaluation order:

1. **Super admin** → allowed (platform bypass).
2. **Owner** → allowed (implicit full org permissions).
3. Otherwise → role defaults, then apply overrides (**revoke wins over grant**).

Helpers: `canAll`, `canAny`, `listPermissions` (expands a context to the full list, used to
filter dashboard navigation).

## Where to enforce

- **UI**: `can()` decides what to render (affordance only).
- **Server actions / services**: `assertCan()` is the real gate — always re-derive `ctx`
  server-side.
- **Database**: RLS enforces the tenant boundary independently.

The permission layer is pure and unit-tested (`src/lib/permissions/permissions.test.ts`).

## Admin area

`/admin` is protected **separately** by explicit platform permissions
(`is_super_admin` / `is_platform_staff`). Holding an organization `owner` role never grants
platform administration.
