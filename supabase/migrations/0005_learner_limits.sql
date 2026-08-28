-- ============================================================================
-- 0005_learner_limits.sql
-- Server/database enforcement of the learner-seat billing model.
--
-- DEFINITION OF AN "ACTIVE LEARNER":
--   A learner counts toward the seat limit when learners.status = 'active'
--   AND learners.archived_at IS NULL. Inactive and archived learners are
--   preserved (never deleted) but do not consume a seat.
--
-- The limit is derived from the organization's subscription plan:
--   included_learners  +  purchased additional learner seats.
-- These come from admin-configured DATA, never hardcoded.
--
-- Enforcement is defence-in-depth:
--   1. Application services call can_add_learner() before inserting.
--   2. A BEFORE INSERT/UPDATE trigger on learners rejects seat-limit breaches
--      so a compromised or buggy client cannot exceed the paid plan.
-- ============================================================================

-- Count of active (seat-consuming) learners in an organization.
create or replace function public.get_active_learner_count(org uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
  from public.learners l
  where l.organization_id = org
    and l.status = 'active'
    and l.archived_at is null;
$$;

-- The learner seat limit for an organization = plan.included_learners +
-- sum(quantity) of 'learner_seat' subscription items on the active subscription.
-- Returns NULL when the plan grants unlimited learners (via the 'learners'
-- feature configured as unlimited). NULL means "no cap".
create or replace function public.get_learner_limit(org uuid)
returns integer
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  sub record;
  plan record;
  extra_seats integer := 0;
  is_unlimited boolean := false;
begin
  select * into sub
  from public.subscriptions s
  where s.organization_id = org
    and s.status in ('trialing','active','past_due','paused')
  order by s.created_at desc
  limit 1;

  -- No active subscription: fall back to zero-cost onboarding allowance handled
  -- by the application. Treat as the smallest configured public plan's included
  -- learners is out of scope here; return 0 so callers must attach a plan.
  if sub is null then
    return 0;
  end if;

  select * into plan from public.subscription_plans p where p.id = sub.plan_id;
  if plan is null then
    return 0;
  end if;

  -- Does the plan grant unlimited learners via the entitlement catalogue?
  select coalesce((pf.value->>'unlimited')::boolean, false) into is_unlimited
  from public.plan_features pf
  join public.features f on f.id = pf.feature_id
  where pf.plan_id = plan.id and f.slug = 'learners';

  if is_unlimited then
    return null;
  end if;

  select coalesce(sum(si.quantity), 0) into extra_seats
  from public.subscription_items si
  where si.subscription_id = sub.id and si.kind = 'learner_seat';

  return plan.included_learners + coalesce(extra_seats, 0);
end;
$$;

-- Can the organization add one more active learner right now?
create or replace function public.can_add_learner(org uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  lim integer;
begin
  lim := public.get_learner_limit(org);
  if lim is null then
    return true; -- unlimited
  end if;
  return public.get_active_learner_count(org) < lim;
end;
$$;

-- Trigger guard: block inserts/updates that would push active learners over the
-- limit. Runs on INSERT of an active learner and on UPDATE that transitions a
-- learner into the active/unarchived state.
create or replace function public.enforce_learner_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  lim integer;
  becoming_active boolean;
begin
  if tg_op = 'INSERT' then
    becoming_active := (new.status = 'active' and new.archived_at is null);
  else -- UPDATE
    becoming_active := (new.status = 'active' and new.archived_at is null)
      and not (old.status = 'active' and old.archived_at is null);
  end if;

  if not becoming_active then
    return new;
  end if;

  lim := public.get_learner_limit(new.organization_id);
  if lim is null then
    return new; -- unlimited
  end if;

  if public.get_active_learner_count(new.organization_id) >= lim then
    raise exception 'learner_limit_exceeded'
      using hint = 'Upgrade the plan or purchase additional learner seats.',
            errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger learners_enforce_limit
  before insert or update on public.learners
  for each row execute function public.enforce_learner_limit();
