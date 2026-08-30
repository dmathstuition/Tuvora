-- ============================================================================
-- 0023 · Premium onboarding wizard
--
-- The first-run onboarding is now a resumable multi-step wizard. This adds the
-- columns it needs — without duplicating fields the organization already has
-- (name, country, currency, timezone, subjects, logo_url, email, brand_color).
--
--   organizations.website          contact website
--   organizations.phone            business phone
--   organizations.city             city / locality
--   organizations.settings         flexible jsonb for wizard answers that don't
--                                   warrant their own column (teaching profile,
--                                   learner profile, chosen modules, workspace
--                                   preferences, raw onboarding draft)
--   organizations.onboarding_step  furthest wizard step reached (0-based), for
--                                   resume-after-leaving
--   profiles.phone / country / timezone   the "About you" personal details
--
-- RLS is already correct: organizations' member_all policy lets the owner (a
-- member) read/write their org, and profiles_self_update lets a user edit their
-- own profile — so the owner can only ever touch their own onboarding data.
-- ============================================================================

alter table public.organizations add column if not exists website text;
alter table public.organizations add column if not exists phone text;
alter table public.organizations add column if not exists city text;
alter table public.organizations add column if not exists settings jsonb not null default '{}'::jsonb;
alter table public.organizations add column if not exists onboarding_step integer not null default 0;

alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists country text;
alter table public.profiles add column if not exists timezone text;
