-- ============================================================================
-- 0022 · Assignment & submission files
--
-- Lets tutors attach question files/images to an assignment, and lets learners
-- submit their work as a "digital notebook" (typed text — already the
-- submissions.content column) and/or uploaded images/files. CBT-style homework
-- continues to run through the assessments engine.
--
-- Files live in a PRIVATE `academy-files` bucket; the app reads them back with
-- short-lived signed URLs generated server-side (service role).
-- ============================================================================

-- How a learner answered a piece of homework (informational; content + files
-- carry the actual work).
alter table public.assignment_submissions
  add column if not exists submission_type text not null default 'notebook';

-- Optional link from an assignment to a CBT assessment (homework as a test).
alter table public.assignments
  add column if not exists assessment_id uuid references public.assessments(id) on delete set null;

-- Question files/images the tutor attaches to an assignment.
create table if not exists public.assignment_files (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  path text not null,
  name text not null,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists assignment_files_assignment_idx on public.assignment_files(assignment_id);

-- Files/images a learner uploads as part of a submission.
create table if not exists public.submission_files (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  submission_id uuid not null references public.assignment_submissions(id) on delete cascade,
  learner_id uuid not null references public.learners(id) on delete cascade,
  path text not null,
  name text not null,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);
create index if not exists submission_files_submission_idx on public.submission_files(submission_id);

-- ----------------------------------------------------------------------------
-- RLS: org members have full access; learners/parents may read the files tied
-- to their own work (portal writes go through the service role).
-- ----------------------------------------------------------------------------
alter table public.assignment_files enable row level security;
alter table public.submission_files enable row level security;

drop policy if exists assignment_files_member_all on public.assignment_files;
create policy assignment_files_member_all on public.assignment_files
  for all
  using (public.is_super_admin() or public.is_org_member(organization_id))
  with check (public.is_super_admin() or public.is_org_member(organization_id));

drop policy if exists assignment_files_portal_select on public.assignment_files;
create policy assignment_files_portal_select on public.assignment_files
  for select using (
    exists (
      select 1
      from public.assignment_submissions s
      where s.assignment_id = assignment_files.assignment_id
        and (public.is_self_learner(s.learner_id) or public.is_linked_parent(s.learner_id))
    )
  );

drop policy if exists submission_files_member_all on public.submission_files;
create policy submission_files_member_all on public.submission_files
  for all
  using (public.is_super_admin() or public.is_org_member(organization_id))
  with check (public.is_super_admin() or public.is_org_member(organization_id));

drop policy if exists submission_files_portal_select on public.submission_files;
create policy submission_files_portal_select on public.submission_files
  for select using (public.is_self_learner(learner_id) or public.is_linked_parent(learner_id));

-- ----------------------------------------------------------------------------
-- Private storage bucket for all academy files (question sheets, submissions).
-- Access is mediated server-side with signed URLs; no public policy is granted.
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('academy-files', 'academy-files', false)
on conflict (id) do nothing;
