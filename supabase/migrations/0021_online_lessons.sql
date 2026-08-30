-- ============================================================================
-- 0021 · Online lessons — drop the courses/modules LMS concept
--
-- Tuvora is built around live online lessons, not a course catalogue. A tutor
-- or admin creates a class with an online meeting link, then schedules lessons
-- against that class (group) or against a single learner (one-to-one). Learners
-- join from their portal using the meeting link.
--
-- This migration:
--   • adds a default meeting link to classes,
--   • turns calendar_events into the online-lesson store (per-lesson meeting
--     link + optional one-to-one learner),
--   • removes the courses, course_modules and lessons tables entirely.
-- ============================================================================

-- Default join link for a class (per-lesson links can override it).
alter table public.classes
  add column if not exists meeting_url text;

-- calendar_events becomes the online-lesson store.
alter table public.calendar_events
  add column if not exists meeting_url text;

alter table public.calendar_events
  add column if not exists learner_id uuid references public.learners(id) on delete cascade;

create index if not exists calendar_events_learner_idx
  on public.calendar_events(learner_id);

-- ----------------------------------------------------------------------------
-- Drop the courses / modules / course-lessons concept.
-- lessons.module_id -> course_modules and lessons.class_id -> classes, so drop
-- the child table first, then its parents. All are removed with the app change.
-- ----------------------------------------------------------------------------
drop table if exists public.lessons cascade;
drop table if exists public.course_modules cascade;
drop table if exists public.courses cascade;
