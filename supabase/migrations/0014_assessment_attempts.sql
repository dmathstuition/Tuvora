-- ============================================================================
-- 0014_assessment_attempts.sql  (additive)
--
-- Learner attempts at an assessment — the mechanism behind the aptitude /
-- placement CBT. A tutor assigns an assessment to a learner (creating an
-- attempt in 'assigned'); the learner takes it in the portal; on submit it is
-- auto-graded and a placement recommendation is derived from the score.
--
-- Also adds placement metadata to `assessments` so a diagnostic test can carry
-- the subject label and target grade band it is meant to place learners into.
-- ============================================================================

alter table public.assessments
  add column if not exists is_placement boolean not null default false,
  add column if not exists subject_label text,
  add column if not exists grade_band text;

create table public.assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  learner_id uuid not null references public.learners(id) on delete cascade,

  status text not null default 'assigned',   -- assigned | in_progress | submitted | graded
  answers jsonb not null default '{}'::jsonb, -- { question_id: optionId | 'true'|'false' | text }
  score numeric,
  total numeric,
  percentage numeric,
  placement_level text,
  placement_notes text,

  assigned_by uuid references public.profiles(id) on delete set null,
  assigned_at timestamptz not null default now(),
  started_at timestamptz,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assessment_id, learner_id)
);

create index assessment_attempts_org_idx on public.assessment_attempts(organization_id);
create index assessment_attempts_learner_idx on public.assessment_attempts(learner_id);

drop trigger if exists assessment_attempts_set_updated_at on public.assessment_attempts;
create trigger assessment_attempts_set_updated_at
  before update on public.assessment_attempts
  for each row execute function public.set_updated_at();

alter table public.assessment_attempts enable row level security;

-- Organization members manage every attempt in their org.
drop policy if exists assessment_attempts_member_all on public.assessment_attempts;
create policy assessment_attempts_member_all on public.assessment_attempts
  for all
  using (public.is_super_admin() or public.is_org_member(organization_id))
  with check (public.is_super_admin() or public.is_org_member(organization_id));

-- The learner (and a linked parent) can read their own attempts.
drop policy if exists assessment_attempts_self_select on public.assessment_attempts;
create policy assessment_attempts_self_select on public.assessment_attempts
  for select using (
    public.is_self_learner(learner_id) or public.is_linked_parent(learner_id)
  );

-- The learner can update their own attempt (answering / submitting the CBT).
drop policy if exists assessment_attempts_self_update on public.assessment_attempts;
create policy assessment_attempts_self_update on public.assessment_attempts
  for update using (public.is_self_learner(learner_id))
  with check (public.is_self_learner(learner_id));

-- Learners taking a placement test need to read the questions/options of the
-- assessment assigned to them. Grant select on the question bank to a learner
-- who has an attempt for that assessment.
drop policy if exists assessment_questions_attempt_select on public.assessment_questions;
create policy assessment_questions_attempt_select on public.assessment_questions
  for select using (
    exists (
      select 1 from public.assessment_attempts aa
      where aa.assessment_id = assessment_questions.assessment_id
        and public.is_self_learner(aa.learner_id)
    )
  );

drop policy if exists assessment_options_attempt_select on public.assessment_options;
create policy assessment_options_attempt_select on public.assessment_options
  for select using (
    exists (
      select 1
      from public.assessment_questions q
      join public.assessment_attempts aa on aa.assessment_id = q.assessment_id
      where q.id = assessment_options.question_id
        and public.is_self_learner(aa.learner_id)
    )
  );

drop policy if exists assessments_attempt_select on public.assessments;
create policy assessments_attempt_select on public.assessments
  for select using (
    exists (
      select 1 from public.assessment_attempts aa
      where aa.assessment_id = assessments.id
        and public.is_self_learner(aa.learner_id)
    )
  );
