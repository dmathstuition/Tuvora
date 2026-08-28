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
create type payment_direction as enum ('platform', 'tutor'); -- Tuvora billing vs tutor→learner billing

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

-- ----------------------------------------------------------------------------
-- Auth helpers
-- ----------------------------------------------------------------------------

-- Is the current user a platform super admin? Read from profiles, not JWT,
-- so revoking the role takes effect immediately.
create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.platform_role = 'super_admin'
  );
$$;

create or replace function public.is_platform_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.platform_role in ('super_admin', 'platform_support')
  );
$$;

-- Is the current user an active member of the given organization?
create or replace function public.is_org_member(org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = org
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

-- Does the current user hold ANY of the given roles in the organization?
create or replace function public.has_org_role(org uuid, roles org_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = org
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role = any(roles)
  );
$$;

-- Convenience: is the current user an owner/admin (can manage) of the org?
create or replace function public.can_manage_org(org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_org_role(org, array['owner','admin']::org_role[]);
$$;
