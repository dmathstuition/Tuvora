-- ============================================================================
-- 0003_billing_and_entitlements.sql
-- Platform (Tuvora) billing: plans, features, entitlements, subscriptions,
-- learner-seat items, usage, payments, invoices, webhook idempotency.
--
-- KEY PRINCIPLE: prices, limits and feature flags are DATA, never code.
-- Nothing here hardcodes a plan name or price — the admin configures plans and
-- attaches features; the app reads entitlements at runtime.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- features — the catalogue of things a plan can grant. Admin-managed.
-- ----------------------------------------------------------------------------
create table public.features (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,           -- e.g. 'learners', 'advanced_reports'
  name text not null,
  description text,
  type feature_type not null,          -- boolean | numeric | unlimited
  -- Default when a plan does not explicitly configure this feature.
  default_value jsonb not null default 'false'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger features_set_updated_at
  before update on public.features
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- subscription_plans — admin-configured plans. No hardcoding in the app.
-- ----------------------------------------------------------------------------
create table public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  -- Money is stored in minor units (cents/kobo) to avoid float drift.
  monthly_price_minor bigint not null default 0,
  yearly_price_minor bigint not null default 0,
  currency text not null default 'USD',
  -- Learner-seat billing model
  included_learners integer not null default 0,
  additional_learner_price_minor bigint not null default 0, -- per extra learner / interval
  -- Hard resource limits (null = unlimited)
  staff_limit integer,
  class_limit integer,
  course_limit integer,
  storage_limit_mb integer,
  -- Presentation / lifecycle
  is_active boolean not null default true,
  is_public boolean not null default true,   -- shown on marketing pricing page
  is_recommended boolean not null default false,
  sort_order integer not null default 0,
  trial_days integer not null default 14,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger plans_set_updated_at
  before update on public.subscription_plans
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- plan_features — the many-to-many join carrying the per-plan value.
-- value shape depends on feature.type:
--   boolean   -> true / false
--   numeric   -> { "limit": 50 }
--   unlimited -> { "unlimited": true }
-- ----------------------------------------------------------------------------
create table public.plan_features (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.subscription_plans(id) on delete cascade,
  feature_id uuid not null references public.features(id) on delete cascade,
  value jsonb not null,
  created_at timestamptz not null default now(),
  unique (plan_id, feature_id)
);

create index plan_features_plan_idx on public.plan_features(plan_id);

-- ----------------------------------------------------------------------------
-- subscriptions — one active subscription per organization (history retained).
-- ----------------------------------------------------------------------------
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id),
  status subscription_status not null default 'trialing',
  interval billing_interval not null default 'monthly',
  -- Payment provider linkage — abstracted; never provider-specific logic in app.
  provider text,                       -- 'stripe' | 'paystack'
  provider_customer_id text,
  provider_subscription_id text,
  -- Period + lifecycle timestamps
  trial_ends_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  grace_period_ends_at timestamptz,    -- configurable dunning window
  cancel_at_period_end boolean not null default false,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Only one non-terminal subscription per org at a time.
create unique index subscriptions_one_active_per_org
  on public.subscriptions(organization_id)
  where status in ('trialing','active','past_due','paused','incomplete');

create index subscriptions_org_idx on public.subscriptions(organization_id);
create index subscriptions_provider_sub_idx on public.subscriptions(provider_subscription_id);

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- subscription_items — line items, notably purchased additional learner seats.
-- ----------------------------------------------------------------------------
create table public.subscription_items (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  kind text not null,                  -- 'base' | 'learner_seat'
  quantity integer not null default 1,
  unit_price_minor bigint not null default 0,
  currency text not null default 'USD',
  provider_item_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index subscription_items_sub_idx on public.subscription_items(subscription_id);

create trigger subscription_items_set_updated_at
  before update on public.subscription_items
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- subscription_usage — periodic snapshots of metered usage (learners, storage…).
-- ----------------------------------------------------------------------------
create table public.subscription_usage (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  metric text not null,                -- 'active_learners' | 'storage_mb' | ...
  quantity numeric not null default 0,
  recorded_at timestamptz not null default now(),
  unique (organization_id, metric, recorded_at)
);

create index subscription_usage_org_metric_idx
  on public.subscription_usage(organization_id, metric);

-- ----------------------------------------------------------------------------
-- payments — money movements. direction distinguishes:
--   'platform' = organization pays Tuvora
--   'tutor'    = parent/learner pays the tutor organization
-- ----------------------------------------------------------------------------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  direction payment_direction not null,
  status payment_status not null default 'pending',
  amount_minor bigint not null,
  currency text not null default 'USD',
  provider text,
  provider_payment_id text,
  -- For tutor billing: who paid (nullable for platform payments).
  payer_learner_id uuid,
  payer_parent_id uuid,
  invoice_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payments_org_idx on public.payments(organization_id);
create index payments_provider_idx on public.payments(provider, provider_payment_id);

create trigger payments_set_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- invoices + invoice_items — used for both platform and tutor billing.
-- ----------------------------------------------------------------------------
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  direction payment_direction not null,
  number text not null,
  status invoice_status not null default 'draft',
  currency text not null default 'USD',
  subtotal_minor bigint not null default 0,
  total_minor bigint not null default 0,
  -- Recipient (tutor billing). Null for platform invoices.
  bill_to_learner_id uuid,
  bill_to_parent_id uuid,
  due_at timestamptz,
  issued_at timestamptz,
  paid_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, number)
);

create index invoices_org_idx on public.invoices(organization_id);

create trigger invoices_set_updated_at
  before update on public.invoices
  for each row execute function public.set_updated_at();

create table public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  description text not null,
  quantity integer not null default 1,
  unit_price_minor bigint not null default 0,
  amount_minor bigint not null default 0,
  created_at timestamptz not null default now()
);

create index invoice_items_invoice_idx on public.invoice_items(invoice_id);

-- Deferred FK: payments.invoice_id -> invoices.id (declared after invoices).
alter table public.payments
  add constraint payments_invoice_fkey
  foreign key (invoice_id) references public.invoices(id) on delete set null;

-- ----------------------------------------------------------------------------
-- billing_events — raw provider webhook events, kept for idempotency + audit.
-- The unique (provider, event_id) index is the idempotency guard: webhooks may
-- arrive twice or out of order, so processing is keyed on the provider event id.
-- ----------------------------------------------------------------------------
create table public.billing_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,              -- 'stripe' | 'paystack'
  event_id text not null,              -- provider's event identifier
  event_type text not null,
  payload jsonb not null,
  processed_at timestamptz,
  error text,
  created_at timestamptz not null default now(),
  unique (provider, event_id)
);

create index billing_events_unprocessed_idx
  on public.billing_events(created_at)
  where processed_at is null;
