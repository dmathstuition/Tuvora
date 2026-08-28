-- ============================================================================
-- 0008_learner_billing.sql  (additive)
--
-- Per-learner monthly billing. The monetization model becomes pay-per-learner:
-- a learner account can only be "open" (usable) once that learner is paid for
-- the current month. The free trial is exactly ONE learner for ONE month.
--
-- This supersedes the plan seat-cap enforcement (0005): there is no longer an
-- included-learners hard cap — you pay per active learner. The old
-- enforce_learner_limit trigger is therefore removed; get_active_learner_count
-- stays (still used for "active learners" metrics).
-- ============================================================================

create type learner_billing_status as enum ('trialing', 'active', 'past_due', 'expired');

create table public.learner_billing (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  learner_id uuid not null references public.learners(id) on delete cascade,
  status learner_billing_status not null default 'past_due',
  is_trial boolean not null default false,
  current_period_start timestamptz,
  current_period_end timestamptz,
  -- Provider linkage for when checkout is wired (Paystack/Stripe).
  provider text,
  provider_reference text,
  last_payment_id uuid references public.payments(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (learner_id)
);

create index learner_billing_org_idx on public.learner_billing(organization_id);
create index learner_billing_status_idx on public.learner_billing(organization_id, status);

create trigger learner_billing_set_updated_at
  before update on public.learner_billing
  for each row execute function public.set_updated_at();

-- Remove the seat-cap enforcement — the per-learner model replaces it.
drop trigger if exists learners_enforce_limit on public.learners;

-- Has the organization already used its single free-trial learner?
create or replace function public.org_free_trial_used(org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.learner_billing b
    where b.organization_id = org and b.is_trial
  );
$$;

-- Is a learner's account open (paid or on a live trial for the current period)?
create or replace function public.learner_account_open(learner uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.learner_billing b
    where b.learner_id = learner
      and b.status in ('trialing', 'active')
      and (b.current_period_end is null or b.current_period_end > now())
  );
$$;

-- Count of learners whose account is currently open (billable/paid or trialing).
create or replace function public.get_open_learner_count(org uuid)
returns integer language sql stable security definer set search_path = public as $$
  select count(*)::integer
  from public.learner_billing b
  where b.organization_id = org
    and b.status in ('trialing', 'active')
    and (b.current_period_end is null or b.current_period_end > now());
$$;

-- RLS: standard tenant-member access.
alter table public.learner_billing enable row level security;
drop policy if exists learner_billing_member_all on public.learner_billing;
create policy learner_billing_member_all on public.learner_billing
  for all
  using (public.is_super_admin() or public.is_org_member(organization_id))
  with check (public.is_super_admin() or public.is_org_member(organization_id));

-- Portal read: a learner/parent may see the learner's own billing state.
drop policy if exists learner_billing_portal_select on public.learner_billing;
create policy learner_billing_portal_select on public.learner_billing
  for select using (
    public.is_self_learner(learner_id) or public.is_linked_parent(learner_id)
  );
