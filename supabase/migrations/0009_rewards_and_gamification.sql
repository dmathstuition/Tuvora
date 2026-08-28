-- ============================================================================
-- 0009_rewards_and_gamification.sql  (additive)
--
-- Reward & sanction system + per-academy leaderboard (D-Maths style), plus
-- learner avatar/theme personalisation for the learner portal.
--
--   * reward_events: a signed points ledger. A reward adds points, a sanction
--     subtracts them. The leaderboard is the sum of points per learner within
--     an organization (each academy has its own leaderboard).
--   * learners gain avatar_key / theme_key for the colourful learner dashboard.
-- ============================================================================

create type reward_kind as enum ('reward', 'sanction');

create table public.reward_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  learner_id uuid not null references public.learners(id) on delete cascade,
  kind reward_kind not null,
  -- Signed: rewards store positive points, sanctions store negative points.
  points integer not null,
  category text,                         -- e.g. 'behaviour', 'achievement', 'homework'
  reason text,
  awarded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index reward_events_org_idx on public.reward_events(organization_id, created_at desc);
create index reward_events_learner_idx on public.reward_events(learner_id);

-- Learner personalisation for the portal.
alter table public.learners
  add column if not exists avatar_key text,
  add column if not exists theme_key text;

-- Sum of a learner's points (the leaderboard value). SECURITY DEFINER so the
-- portal/parent can read their own total without broad table access.
create or replace function public.learner_points(learner uuid)
returns integer language sql stable security definer set search_path = public as $$
  select coalesce(sum(points), 0)::integer
  from public.reward_events e
  where e.learner_id = learner;
$$;

-- RLS: staff manage; learner/parent may read the learner's own events.
alter table public.reward_events enable row level security;

drop policy if exists reward_events_member_all on public.reward_events;
create policy reward_events_member_all on public.reward_events
  for all
  using (public.is_super_admin() or public.is_org_member(organization_id))
  with check (public.is_super_admin() or public.is_org_member(organization_id));

drop policy if exists reward_events_portal_select on public.reward_events;
create policy reward_events_portal_select on public.reward_events
  for select using (
    public.is_self_learner(learner_id) or public.is_linked_parent(learner_id)
  );
