# Development

## Setup

```bash
pnpm install
cp .env.example .env.local     # fill in Supabase keys at minimum
pnpm dev
```

Without Supabase configured, marketing pages render (pricing degrades to an empty state) but
auth/dashboard require a working Supabase project.

## Quality gates (run before every commit)

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build       # catches RSC/prerender issues
```

CI should run all four. Do not merge with a failing gate or an unresolved tenant-isolation
concern.

## Conventions

- **Server-only** modules import `'server-only'`; secrets live behind `serverEnv()`.
- **Business logic** goes in `src/services/*` and `src/lib/*`, never in components.
- **Validation** with Zod in `src/schemas/*`; parse at every trust boundary.
- **No `any`** (ESLint enforces `@typescript-eslint/no-explicit-any: error`).
- **No hardcoded** plan names, prices, org ids, or role-string checks — use the entitlement
  engine and `can()`.
- Keep components small; prefer Server Components; avoid unnecessary `useEffect`.

## Testing

- **Unit** (Vitest): pure logic — permissions, entitlement engine, seat billing. Add tests
  alongside code as `*.test.ts`.
- **E2E** (Playwright, `tests/e2e/`): signup → onboarding → add learner → reach limit →
  upgrade → create class → assignment → submit → grade → report.
- **Priority coverage**: tenant isolation, authorization, learner limits, entitlements,
  subscription states, billing calculations, webhook idempotency.

## Adding a module (the learners pattern)

1. Migration for the table(s) with `organization_id` + RLS (follow `0006`).
2. Zod schema in `src/schemas/`.
3. Service in `src/services/<module>/` — `assertCan`, entitlement checks, audit log.
4. Server component page with loading / empty / error states.
5. Client form via `useActionState` calling the service action.
6. Unit tests for any pure logic; extend e2e for the flow.

## Database types

After schema changes on a linked project: `pnpm db:types`.
