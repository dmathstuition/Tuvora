-- ============================================================================
-- 0004_lms_domain.sql
-- Core teaching domain: learners, parents, subjects, courses/modules/lessons,
-- classes, assignments, assessments, attendance, grading, progress, resources,
-- messaging, calendar, notifications, files.
--
-- Every table here is tenant-owned and carries organization_id. RLS in 0006
-- enforces isolation; the column + index are declared here.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- subjects — org-scoped taxonomy reused across classes/courses/assessments.
-- ----------------------------------------------------------------------------
create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  color text,
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);
create index subjects_org_idx on public.subjects(organization_id);

-- ----------------------------------------------------------------------------
-- learners — the monetised entity. "Active" is defined in 0005.
-- ----------------------------------------------------------------------------
create table public.learners (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  -- Optional link to an auth user (learner portal login). Null if managed-only.
  user_id uuid references public.profiles(id) on delete set null,
  first_name text not null,
  last_name text,
  email citext,
  phone text,
  date_of_birth date,
  avatar_url text,
  country text,
  timezone text,
  emergency_contact jsonb,
  notes text,
  status learner_status not null default 'active',
  enrolled_at timestamptz not null default now(),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index learners_org_idx on public.learners(organization_id);
create index learners_org_status_idx on public.learners(organization_id, status);
create trigger learners_set_updated_at
  before update on public.learners for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- parents + parent_learners (many-to-many).
-- ----------------------------------------------------------------------------
create table public.parents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  first_name text not null,
  last_name text,
  email citext,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index parents_org_idx on public.parents(organization_id);
create trigger parents_set_updated_at
  before update on public.parents for each row execute function public.set_updated_at();

create table public.parent_learners (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  parent_id uuid not null references public.parents(id) on delete cascade,
  learner_id uuid not null references public.learners(id) on delete cascade,
  relationship text,
  created_at timestamptz not null default now(),
  unique (parent_id, learner_id)
);
create index parent_learners_org_idx on public.parent_learners(organization_id);
create index parent_learners_learner_idx on public.parent_learners(learner_id);

-- Wire up the deferred payer references from 0003.
alter table public.payments
  add constraint payments_payer_learner_fkey foreign key (payer_learner_id)
    references public.learners(id) on delete set null,
  add constraint payments_payer_parent_fkey foreign key (payer_parent_id)
    references public.parents(id) on delete set null;
alter table public.invoices
  add constraint invoices_bill_learner_fkey foreign key (bill_to_learner_id)
    references public.learners(id) on delete set null,
  add constraint invoices_bill_parent_fkey foreign key (bill_to_parent_id)
    references public.parents(id) on delete set null;

-- ----------------------------------------------------------------------------
-- courses -> modules -> lessons.
-- ----------------------------------------------------------------------------
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  title text not null,
  description text,
  level text,
  cover_image_url text,
  status course_status not null default 'draft',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index courses_org_idx on public.courses(organization_id);
create trigger courses_set_updated_at
  before update on public.courses for each row execute function public.set_updated_at();

create table public.course_modules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index course_modules_course_idx on public.course_modules(course_id);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  module_id uuid references public.course_modules(id) on delete cascade,
  class_id uuid, -- set below after classes exists
  title text not null,
  description text,
  content jsonb,                 -- rich text / block content
  video_url text,
  objectives text[],
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index lessons_org_idx on public.lessons(organization_id);
create index lessons_module_idx on public.lessons(module_id);
create trigger lessons_set_updated_at
  before update on public.lessons for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- classes + class_members. Supports one-to-one and group.
-- ----------------------------------------------------------------------------
create table public.classes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  name text not null,
  description text,
  mode class_mode not null default 'group',
  status class_status not null default 'active',
  tutor_id uuid references public.profiles(id) on delete set null,
  capacity integer,
  -- Schedule stored as structured recurrence rules; expanded into calendar_events.
  schedule jsonb,
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index classes_org_idx on public.classes(organization_id);
create trigger classes_set_updated_at
  before update on public.classes for each row execute function public.set_updated_at();

-- Now that classes exists, add lessons.class_id FK.
alter table public.lessons
  add constraint lessons_class_fkey foreign key (class_id)
    references public.classes(id) on delete cascade;

create table public.class_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  learner_id uuid not null references public.learners(id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  unique (class_id, learner_id)
);
create index class_members_class_idx on public.class_members(class_id);
create index class_members_learner_idx on public.class_members(learner_id);

-- ----------------------------------------------------------------------------
-- assignments + submissions.
-- ----------------------------------------------------------------------------
create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  title text not null,
  instructions text,
  status assignment_status not null default 'draft',
  max_points numeric,
  allow_resubmission boolean not null default false,
  due_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index assignments_org_idx on public.assignments(organization_id);
create index assignments_class_idx on public.assignments(class_id);
create trigger assignments_set_updated_at
  before update on public.assignments for each row execute function public.set_updated_at();

create table public.assignment_submissions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  learner_id uuid not null references public.learners(id) on delete cascade,
  status submission_status not null default 'assigned',
  content text,
  submitted_at timestamptz,
  score numeric,
  feedback text,
  graded_by uuid references public.profiles(id),
  graded_at timestamptz,
  returned_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assignment_id, learner_id)
);
create index submissions_org_idx on public.assignment_submissions(organization_id);
create index submissions_assignment_idx on public.assignment_submissions(assignment_id);
create trigger submissions_set_updated_at
  before update on public.assignment_submissions for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- assessments engine: assessments -> questions -> options; attempts -> answers;
-- results.
-- ----------------------------------------------------------------------------
create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  class_id uuid references public.classes(id) on delete set null,
  subject_id uuid references public.subjects(id) on delete set null,
  title text not null,
  description text,
  type assessment_type not null default 'quiz',
  time_limit_minutes integer,
  attempt_limit integer,
  randomize boolean not null default false,
  total_marks numeric,
  pass_mark numeric,
  status assignment_status not null default 'draft',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index assessments_org_idx on public.assessments(organization_id);
create trigger assessments_set_updated_at
  before update on public.assessments for each row execute function public.set_updated_at();

create table public.assessment_questions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  type question_type not null,
  prompt text not null,
  marks numeric not null default 1,
  position integer not null default 0,
  -- For short_answer: accepted answers; for auto-grading true_false: correct value.
  answer_key jsonb,
  created_at timestamptz not null default now()
);
create index assessment_questions_assessment_idx on public.assessment_questions(assessment_id);

create table public.assessment_options (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  question_id uuid not null references public.assessment_questions(id) on delete cascade,
  label text not null,
  is_correct boolean not null default false,
  position integer not null default 0
);
create index assessment_options_question_idx on public.assessment_options(question_id);

create table public.assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  learner_id uuid not null references public.learners(id) on delete cascade,
  attempt_number integer not null default 1,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (assessment_id, learner_id, attempt_number)
);
create index assessment_attempts_org_idx on public.assessment_attempts(organization_id);

create table public.assessment_answers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  attempt_id uuid not null references public.assessment_attempts(id) on delete cascade,
  question_id uuid not null references public.assessment_questions(id) on delete cascade,
  selected_option_id uuid references public.assessment_options(id) on delete set null,
  answer_text text,
  awarded_marks numeric,
  is_correct boolean,
  created_at timestamptz not null default now()
);
create index assessment_answers_attempt_idx on public.assessment_answers(attempt_id);

create table public.assessment_results (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  attempt_id uuid not null references public.assessment_attempts(id) on delete cascade,
  learner_id uuid not null references public.learners(id) on delete cascade,
  score numeric not null default 0,
  total numeric not null default 0,
  percentage numeric,
  passed boolean,
  created_at timestamptz not null default now(),
  unique (attempt_id)
);
create index assessment_results_learner_idx on public.assessment_results(learner_id);

-- ----------------------------------------------------------------------------
-- attendance.
-- ----------------------------------------------------------------------------
create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  learner_id uuid not null references public.learners(id) on delete cascade,
  session_date date not null,
  status attendance_status not null default 'present',
  note text,
  recorded_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (class_id, learner_id, session_date)
);
create index attendance_org_idx on public.attendance(organization_id);
create index attendance_learner_idx on public.attendance(learner_id);

-- ----------------------------------------------------------------------------
-- grading scales + grades.
-- ----------------------------------------------------------------------------
create table public.grading_scales (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  is_default boolean not null default false,
  -- [{ "label": "A", "min": 80, "max": 100 }, ...]
  bands jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index grading_scales_org_idx on public.grading_scales(organization_id);

create table public.grades (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  learner_id uuid not null references public.learners(id) on delete cascade,
  class_id uuid references public.classes(id) on delete set null,
  subject_id uuid references public.subjects(id) on delete set null,
  -- Polymorphic source of the grade (assignment/assessment/manual).
  source_type text,
  source_id uuid,
  raw_score numeric,
  max_score numeric,
  percentage numeric,
  letter text,
  recorded_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create index grades_org_idx on public.grades(organization_id);
create index grades_learner_idx on public.grades(learner_id);

-- ----------------------------------------------------------------------------
-- progress records + reports.
-- ----------------------------------------------------------------------------
create table public.progress_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  learner_id uuid not null references public.learners(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  metric text not null,        -- 'average_score' | 'attendance_pct' | 'completion_pct'
  value numeric not null,
  period_start date,
  period_end date,
  created_at timestamptz not null default now()
);
create index progress_records_learner_idx on public.progress_records(learner_id);

create table public.progress_reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  learner_id uuid not null references public.learners(id) on delete cascade,
  title text not null,
  period_start date,
  period_end date,
  summary text,
  data jsonb,
  generated_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create index progress_reports_learner_idx on public.progress_reports(learner_id);

-- ----------------------------------------------------------------------------
-- resources + files (Supabase Storage object metadata).
-- ----------------------------------------------------------------------------
create table public.files (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  bucket text not null,
  path text not null,
  name text not null,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create index files_org_idx on public.files(organization_id);

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  description text,
  kind text not null default 'file',   -- 'file' | 'link' | 'video'
  url text,
  file_id uuid references public.files(id) on delete set null,
  class_id uuid references public.classes(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete cascade,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create index resources_org_idx on public.resources(organization_id);

-- ----------------------------------------------------------------------------
-- messaging: threads + messages.
-- ----------------------------------------------------------------------------
create table public.message_threads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  subject text,
  kind text not null default 'direct',  -- 'direct' | 'announcement'
  class_id uuid references public.classes(id) on delete cascade,
  created_by uuid references public.profiles(id),
  -- Participant profile ids for fast membership checks in RLS.
  participant_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index message_threads_org_idx on public.message_threads(organization_id);
create trigger message_threads_set_updated_at
  before update on public.message_threads for each row execute function public.set_updated_at();

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  thread_id uuid not null references public.message_threads(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null,
  body text not null,
  read_by uuid[] not null default '{}',
  created_at timestamptz not null default now()
);
create index messages_thread_idx on public.messages(thread_id);

-- ----------------------------------------------------------------------------
-- notifications + calendar events.
-- ----------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications(user_id) where read_at is null;

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  kind text not null default 'event',  -- 'class' | 'lesson' | 'assessment' | 'assignment_due' | 'event'
  class_id uuid references public.classes(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz,
  all_day boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index calendar_events_org_time_idx on public.calendar_events(organization_id, starts_at);

-- ----------------------------------------------------------------------------
-- audit_logs — append-only record of significant actions.
-- ----------------------------------------------------------------------------
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  resource_type text,
  resource_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_org_idx on public.audit_logs(organization_id, created_at desc);
