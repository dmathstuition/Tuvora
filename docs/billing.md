# Billing

There are **two distinct billing systems**. Do not conflate them.

| System | Direction | Tables |
| --- | --- | --- |
| **Platform billing** | Organization → Tuvoria | `subscriptions`, `payments(direction='platform')`, `invoices(direction='platform')` |
| **Tutor billing** | Parent/Learner → Tutor org | `payments(direction='tutor')`, `invoices(direction='tutor')` |

## Money representation

All amounts are stored in **minor units** (cents/kobo) as `bigint` to avoid floating-point
drift. Formatting happens only at the edge (`formatMoney`).

## Learner-seat model

Base subscription includes N learners; each additional **active** learner is a billable seat.

```
10 learners (included=10) → base only
20 learners               → base + 10 seats
30 learners               → base + 20 seats
```

Prices (`additional_learner_price_minor`) and `included_learners` come from the plan record —
never hardcoded. The math lives in `src/lib/billing/seats.ts` (unit-tested).

### Definition of an active learner

`learners.status = 'active' AND archived_at IS NULL`. Inactive/archived learners are preserved
but do **not** consume a seat.

### Three-layer enforcement

1. **UI**: the add button is disabled at the limit (affordance only).
2. **Service**: `canAddLearner(orgId)` checks before insert.
3. **Database**: the `enforce_learner_limit()` trigger raises `learner_limit_exceeded` — the
   final backstop that even a compromised client cannot bypass.

## Payment provider abstraction

Business logic depends only on the `PaymentProvider` interface
(`src/lib/payments/types.ts`). Adapters (`stripe.ts`, `paystack.ts`) implement it; the factory
(`getPaymentProvider`) selects one. Adding a provider never touches subscription logic.

```ts
interface PaymentProvider {
  createCustomer, createCheckout, getSubscription,
  cancelSubscription, pauseSubscription, resumeSubscription,
  verifyAndParseWebhook  // normalizes to a canonical event with a dedupeKey
}
```

## Webhook idempotency & ordering

Webhooks may arrive **twice or out of order**. `verifyAndParseWebhook` produces a canonical
event with a `dedupeKey` (the provider event id). Processing inserts into `billing_events`
which has a `UNIQUE (provider, event_id)` constraint — a replay is a no-op, and processing is
keyed on event data, never on arrival order.

## Edge cases to handle

subscription expires · payment fails/succeeds · learner removed/archived/reactivated · plan
upgrade/downgrade · cancellation · monthly/yearly renewal · duplicate webhook · out-of-order
webhook · provider unavailable. Never assume a webhook arrives exactly once or in order.
