-- ============================================================================
-- 0001_extensions_and_helpers.sql
-- Foundational extensions, enums, and SECURITY DEFINER helper functions used
-- by Row Level Security across all tenant tables.
--
-- DESIGN NOTES ON RLS HELPERS
-- Supabase RLS policies that need to check membership can easily recurse
-- (a policy on organization_members that itself queries organization_members).
-- To avoid recursion we centralise membership/permission checks in
-- SECURITY DEFINER functions owned by the table owner. These functions bypass
-- RLS internally (they run as the definer) and are marked STABLE so Postgres
-- can cache them per-statement.
-- ============================================================================

create extension if not exists "pgcrypto"; -- gen_random_uuid()
create extension if not exists "citext";   -- case-insensitive emails

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
create type organization_type as enum (
  'independent_tutor',
  'tutoring_business',
  'tutoring_centre',
  'online_tutor',
  'coaching_business',
  'other'
);

-- Organization-scoped roles. Platform roles live on profiles.platform_role.
create type org_role as enum (
  'owner',
  'admin',
  'tutor',
  'assistant',
  'accountant',
  'staff'
);

create type platform_role as enum (
  'none',
  'platform_support',
  'super_admin'
);

create type membership_status as enum ('active', 'invited', 'suspended', 'removed');

create type learner_status as enum ('active', 'inactive', 'archived');

create type subscription_status as enum (
  'trialing',
  'active',
  'past_due',
  'paused',
  'cancelled',
  'expired',
  'incomplete'
);

create type billing_interval as enum ('monthly', 'yearly');

create type feature_type as enum ('boolean', 'numeric', 'unlimited');

create type class_status as enum ('draft', 'active', 'completed', 'archived');
create type class_mode as enum ('one_to_one', 'group');

create type course_status as enum ('draft', 'published', 'archived');

create type assignment_status as enum ('draft', 'published', 'archived');
create type submission_status as enum ('assigned', 'submitted', 'late', 'graded', 'returned');

create type assessment_type as enum ('quiz', 'test', 'exam', 'diagnostic');
create type question_type as enum ('multiple_choice', 'true_false', 'short_answer');

create type attendance_status as enum ('present', 'absent', 'late', 'excused');

create type invoice_status as enum ('draft', 'open', 'paid', 'void', 'uncollectible');
create type payment_status as enum ('pending', 'succeeded', 'failed', 'refunded');
create type payment_direction as enum ('platform', 'tutor'); -- Tuvoria billing vs tutor→learner billing

-- ----------------------------------------------------------------------------
-- updated_at trigger helper
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- NOTE: The membership/permission auth helper functions (is_super_admin,
-- is_platform_staff, is_org_member, has_org_role, can_manage_org) are defined in
-- 0006_rls.sql. They are `LANGUAGE sql`, whose body is validated at CREATE time,
-- so they must be created AFTER the tables they read (profiles,
-- organization_members) exist — which is 0002. 0006 is the first migration that
-- uses them (RLS policies), so they live there alongside the portal helpers.
