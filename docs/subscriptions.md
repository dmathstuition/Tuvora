# Subscriptions & Entitlements

Subscription is a core part of Tuvora. Features are restricted by subscription through a
central **entitlement engine** — never by hardcoded plan checks in components.

## Data model (all admin-configured, nothing hardcoded)

- `features` — the catalogue (`slug`, `type`: boolean | numeric | unlimited, default value).
- `subscription_plans` — prices (minor units), included learners, additional-learner price,
  staff/class/course/storage limits, trial days, active/public/recommended flags.
- `plan_features` — per-plan feature values (`{ enabled }`, `{ limit }`, `{ unlimited }`).
- `subscriptions` — one active subscription per org, provider linkage, period + grace window.
- `subscription_items` — line items, notably purchased `learner_seat`s.
- `subscription_usage` — periodic metered snapshots.

## Entitlement engine

Pure logic in `src/lib/entitlements/engine.ts` (unit-tested), fed by
`src/lib/entitlements/service.ts` which loads the active plan's entitlements from the DB:

```ts
hasFeature(entitlements, 'advanced_reports')      // boolean availability
getFeatureLimit(entitlements, 'learners')          // number | null (null = unlimited)
getRemainingCapacity(entitlements, 'classes', n)   // Infinity when unlimited
canUseFeature(entitlements, 'learners', usage)     // create-one-more check
```

## Subscription states

`trialing`, `active`, `past_due`, `paused`, `cancelled`, `expired`, `incomplete`.

- **Full access**: `trialing`, `active`, `past_due` (during the configurable grace window).
- **Read-only, data preserved**: `paused`, `cancelled`, `expired`.

> **We never delete tenant data because a subscription lapsed.** On expiry we restrict premium
> functionality, show upgrade notices, and allow renewal. Data lifecycle uses archive /
> soft-delete (`docs/billing.md`).

## Learner-seat billing

See [billing](./billing.md). Base plan includes N learners; extra active learners are billed
as additional seats. Prices come from the plan record. Limits are enforced by
`get_learner_limit()`, `can_add_learner()` and the `enforce_learner_limit()` trigger.
