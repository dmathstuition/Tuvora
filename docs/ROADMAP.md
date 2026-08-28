# Tuvora — Implementation Roadmap

Development proceeds in phases. Foundational security (tenant isolation, authorization,
entitlements) is completed before product modules are layered on top.

## Phase 1 — Foundation ✅ (implemented)

- [x] Project setup, tooling (TS strict, ESLint, Prettier, Vitest, Playwright)
- [x] Token-driven design system + core UI primitives
- [x] Multi-tenant database schema (`0001`–`0004`)
- [x] Row Level Security across all tenant tables (`0006`)
- [x] Centralized RBAC (`can()`), roles + permission catalogue
- [x] Supabase clients (browser/server/admin/middleware), auth context resolver
- [x] Authentication (sign up, login, logout, forgot password) + session middleware
- [x] Organization onboarding (atomic org + owner membership + trial)
- [x] Marketing site + database-driven pricing

## Phase 2 — SaaS billing & entitlements ✅ (core implemented)

- [x] Plans, features, plan_features (admin-configured, seeded)
- [x] Subscriptions, items, usage, payments, invoices, billing_events
- [x] Entitlement engine (`hasFeature`, `getFeatureLimit`, `canUseFeature`, …) + tests
- [x] Learner-seat billing math + DB enforcement (function + trigger) + tests
- [x] Payment-provider abstraction (Paystack + Stripe adapters, factory)
- [ ] Provider SDK wiring (checkout, webhook signature verification)
- [ ] Billing UI (plan selection, seat management, invoices)

## Phase 3 — Core LMS (schema ready; UI in progress)

- [x] Schema for learners, classes, courses, lessons, assignments, assessments,
      attendance, grades, progress, resources
- [x] Learners module (list, create with seat enforcement, audit) — reference pattern
- [ ] Classes, courses, lessons UI + services
- [ ] Assignments + submissions workflow
- [ ] Assessment engine (questions, attempts, auto-grading)
- [ ] Attendance + grading + progress dashboards

## Phase 4 — Portals

- [ ] Learner portal (own data only — RLS policies in place)
- [ ] Parent portal (linked children only — RLS policies in place)

## Phase 5 — Business management

- [ ] Tutor payments + invoices (parent/learner → tutor)
- [ ] Reports (progress, attendance, assessment, class, performance) + export
- [ ] Messaging + notifications
- [ ] Calendar

## Phase 6 — Advanced

- [ ] Analytics + SaaS metrics (MRR, ARR, churn, ARPU)
- [ ] AI service abstraction (assignment/quiz/report generation, insights)
- [ ] Intervention detection (declining scores, low attendance)
- [ ] Automation, custom branding, custom domains, API access
- [ ] Platform admin area (organizations, plans, features, revenue, audit)

## Architectural risks & mitigations

| Risk | Mitigation |
| --- | --- |
| RLS recursion on membership checks | `SECURITY DEFINER` helper functions (`is_org_member`, `has_org_role`) |
| Client bypassing seat limits | DB trigger `enforce_learner_limit()` as the final backstop |
| Provider lock-in | `PaymentProvider` interface; business logic never imports SDKs |
| Duplicate/out-of-order webhooks | `billing_events (provider, event_id)` unique idempotency key |
| Hardcoded plans/prices | All plan/feature/limit data lives in the database |
| Hand-authored DB types drifting | `pnpm db:types` regenerates from the live schema |
