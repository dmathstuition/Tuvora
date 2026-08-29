-- ============================================================================
-- 0019_class_join_codes.sql  (additive)
--
-- A shareable join code/link per class. A tutor posts the link when scheduling
-- a class; a learner opens it (or enters the code) to enrol themselves.
-- ============================================================================

alter table public.classes add column if not exists join_code text;

-- Backfill existing classes with a random 8-char code.
update public.classes
  set join_code = upper(substr(md5(random()::text || id::text), 1, 8))
  where join_code is null;

create unique index if not exists classes_join_code_key
  on public.classes(join_code)
  where join_code is not null;
