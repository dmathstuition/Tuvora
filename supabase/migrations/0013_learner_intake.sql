-- ============================================================================
-- 0013_learner_intake.sql  (additive)
--
-- Enrollment intake: the detailed form a parent completes when a learner is
-- first invited — parent/guardian details, the learner's academic background,
-- goals, availability/capacity and logistics. One record per learner.
-- ============================================================================

create table if not exists public.learner_intake (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  learner_id uuid not null references public.learners(id) on delete cascade,

  -- Parent / guardian
  parent_name text,
  parent_email text,
  parent_phone text,
  relationship text,
  parent_occupation text,

  -- Learner academic background
  date_of_birth date,
  current_school text,
  current_grade text,
  subjects_of_interest text[],
  strengths text,
  weaknesses text,
  learning_goals text,
  special_needs text,

  -- Availability / capacity
  preferred_mode text,              -- 'online' | 'in_person' | 'hybrid'
  sessions_per_week integer,
  preferred_days text[],
  preferred_times text,

  -- Other
  emergency_contact_name text,
  emergency_contact_phone text,
  how_heard text,
  extra jsonb not null default '{}'::jsonb,

  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (learner_id)
);

create index if not exists learner_intake_org_idx on public.learner_intake(organization_id);

drop trigger if exists learner_intake_set_updated_at on public.learner_intake;
create trigger learner_intake_set_updated_at
  before update on public.learner_intake
  for each row execute function public.set_updated_at();

-- RLS: organization members read/manage. Public submission happens through the
-- enrollment page under the service role (token-verified), so no anon policy.
alter table public.learner_intake enable row level security;

drop policy if exists learner_intake_member_all on public.learner_intake;
create policy learner_intake_member_all on public.learner_intake
  for all
  using (public.is_super_admin() or public.is_org_member(organization_id))
  with check (public.is_super_admin() or public.is_org_member(organization_id));

drop policy if exists learner_intake_portal_select on public.learner_intake;
create policy learner_intake_portal_select on public.learner_intake
  for select using (
    public.is_self_learner(learner_id) or public.is_linked_parent(learner_id)
  );
