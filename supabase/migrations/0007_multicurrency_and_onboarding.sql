-- ============================================================================
-- 0007_multicurrency_and_onboarding.sql  (additive — safe to run on an existing DB)
--
-- Adds:
--   * organization fields for the business model (solo vs employing tutors)
--     and portal preferences captured during a richer onboarding.
--   * a plan_prices table so a plan can be priced in multiple currencies
--     (USD, NGN, …). Currency selection at signup routes checkout to the right
--     provider (NGN -> Paystack, USD -> Stripe). Includes a per-learner monthly
--     price to support the per-learner billing model in a later migration.
-- ============================================================================

-- --- Organizations: business model + portal preferences ---------------------
alter table public.organizations
  add column if not exists employs_tutors boolean not null default false,
  add column if not exists portal_preferences jsonb not null default '{}'::jsonb;

comment on column public.organizations.employs_tutors is
  'true = tutoring business that employs multiple tutors; false = solo tutor.';
comment on column public.organizations.portal_preferences is
  'Learner/parent portal look & feel chosen at onboarding: theme, display name, welcome message, etc.';

-- --- Multi-currency plan pricing --------------------------------------------
create table if not exists public.plan_prices (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.subscription_plans(id) on delete cascade,
  currency text not null,                          -- ISO 4217, e.g. 'USD', 'NGN'
  monthly_price_minor bigint not null default 0,   -- minor units (cents/kobo)
  yearly_price_minor bigint not null default 0,
  additional_learner_price_minor bigint not null default 0,
  per_learner_monthly_price_minor bigint not null default 0, -- for per-learner billing
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (plan_id, currency)
);

create index if not exists plan_prices_plan_idx on public.plan_prices(plan_id);

drop trigger if exists plan_prices_set_updated_at on public.plan_prices;
create trigger plan_prices_set_updated_at
  before update on public.plan_prices
  for each row execute function public.set_updated_at();

-- Public read of prices (pricing page for anonymous visitors); admin write only.
alter table public.plan_prices enable row level security;

drop policy if exists plan_prices_public_read on public.plan_prices;
create policy plan_prices_public_read on public.plan_prices
  for select using (true);

drop policy if exists plan_prices_admin_write on public.plan_prices;
create policy plan_prices_admin_write on public.plan_prices
  for all using (public.is_super_admin()) with check (public.is_super_admin());
