-- ============================================================================
-- 0006_rls.sql
-- Row Level Security. This is the last line of defence for tenant isolation:
-- even if application code has a bug, Postgres will not return another
-- organization's rows.
--
-- LAYERED AUTHORIZATION MODEL
--   RLS (here)         guarantees the TENANT BOUNDARY: a user only ever sees
--                      rows for organizations they actively belong to (plus
--                      their own learner/parent portal rows), and platform
--                      super admins reach everything through an explicit check.
--   Application `can()` enforces FINE-GRAINED PERMISSIONS within a tenant
--                      (e.g. only accountants manage billing). RLS deliberately
--                      does not encode every permission — that keeps policies
--                      non-recursive and fast; see docs/authorization.md.
--
-- The service role key bypasses RLS entirely and is used only in trusted server
-- code (webhooks, admin services). Never ship it to the browser.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Membership / permission auth helpers, SECURITY DEFINER to avoid RLS recursion.
-- Defined here (not in 0001) because they are `LANGUAGE sql` — Postgres
-- validates the function body at CREATE time, so the tables they read
-- (profiles, organization_members) must already exist. 0006 is also the first
-- place they are used (the policies below).
-- ----------------------------------------------------------------------------

-- Is the current user a platform super admin? Read from profiles, not the JWT,
-- so revoking the role takes effect immediately.
create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.platform_role = 'super_admin'
  );
$$;

create or replace function public.is_platform_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.platform_role in ('super_admin', 'platform_support')
  );
$$;

-- Is the current user an active member of the given organization?
create or replace function public.is_org_member(org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = org
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

-- Does the current user hold ANY of the given roles in the organization?
create or replace function public.has_org_role(org uuid, roles org_role[])
returns boolean language sql stable security definer set search_path = public as $$
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
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_org_role(org, array['owner','admin']::org_role[]);
$$;

-- ----------------------------------------------------------------------------
-- Portal access helpers (learner / parent), SECURITY DEFINER to avoid recursion.
-- ----------------------------------------------------------------------------
create or replace function public.is_self_learner(learner uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.learners l
    where l.id = learner and l.user_id = auth.uid()
  );
$$;

create or replace function public.is_linked_parent(learner uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.parent_learners pl
    join public.parents p on p.id = pl.parent_id
    where pl.learner_id = learner and p.user_id = auth.uid()
  );
$$;

-- Can the current user read a given learner's data (staff, the learner, a parent)?
create or replace function public.can_view_learner(learner uuid, org uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_org_member(org)
      or public.is_self_learner(learner)
      or public.is_linked_parent(learner);
$$;

-- ----------------------------------------------------------------------------
-- Enable RLS + uniform tenant-boundary policies on standard tenant tables.
-- Each of these tables has an organization_id column and the same access rule:
--   read/write allowed to active org members; super admins bypass.
-- Portal-specific read policies are layered on afterwards for learner-facing
-- tables.
-- ----------------------------------------------------------------------------
do $$
declare
  t text;
  tenant_tables text[] := array[
    'subjects','learners','parents','parent_learners',
    'courses','course_modules','lessons','classes','class_members',
    'assignments','assignment_submissions',
    'assessments','assessment_questions','assessment_options',
    'assessment_attempts','assessment_answers','assessment_results',
    'attendance','grading_scales','grades',
    'progress_records','progress_reports',
    'files','resources','message_threads','messages',
    'notifications','calendar_events',
    'subscriptions','subscription_items','subscription_usage',
    'payments','invoices','invoice_items'
  ];
begin
  foreach t in array tenant_tables loop
    execute format('alter table public.%I enable row level security;', t);

    -- Members of the owning organization have full access; super admins bypass.
    execute format($f$
      create policy %1$I_member_all on public.%1$I
        for all
        using (
          public.is_super_admin()
          or public.is_org_member(organization_id)
        )
        with check (
          public.is_super_admin()
          or public.is_org_member(organization_id)
        );
    $f$, t);
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- profiles — a user sees their own profile; platform staff read all; org
-- managers can read profiles of co-members (resolved via a membership overlap).
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;

create policy profiles_self_select on public.profiles
  for select using (id = auth.uid() or public.is_platform_staff());

create policy profiles_comember_select on public.profiles
  for select using (
    exists (
      select 1
      from public.organization_members m1
      join public.organization_members m2
        on m1.organization_id = m2.organization_id
      where m1.user_id = auth.uid() and m1.status = 'active'
        and m2.user_id = public.profiles.id
    )
  );

create policy profiles_self_update on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- ----------------------------------------------------------------------------
-- organizations — members read; owners/admins update; super admin all.
-- Insert is performed by the onboarding server action (creates org + owner
-- membership atomically) so any authenticated user may insert an org they own.
-- ----------------------------------------------------------------------------
alter table public.organizations enable row level security;

create policy organizations_member_select on public.organizations
  for select using (public.is_super_admin() or public.is_org_member(id));

create policy organizations_owner_insert on public.organizations
  for insert with check (owner_id = auth.uid());

create policy organizations_manage_update on public.organizations
  for update using (public.is_super_admin() or public.can_manage_org(id))
  with check (public.is_super_admin() or public.can_manage_org(id));

-- ----------------------------------------------------------------------------
-- organization_members — members read the roster; owners/admins manage.
-- The initial owner row is created by the onboarding action under the service
-- role, so a self-insert policy is intentionally NOT provided (prevents users
-- from granting themselves membership).
-- ----------------------------------------------------------------------------
alter table public.organization_members enable row level security;

create policy org_members_read on public.organization_members
  for select using (
    public.is_super_admin()
    or user_id = auth.uid()
    or public.is_org_member(organization_id)
  );

create policy org_members_manage on public.organization_members
  for all
  using (public.is_super_admin() or public.can_manage_org(organization_id))
  with check (public.is_super_admin() or public.can_manage_org(organization_id));

-- ----------------------------------------------------------------------------
-- organization_invitations — managers manage; invited users may read their own
-- invite by email to accept it.
-- ----------------------------------------------------------------------------
alter table public.organization_invitations enable row level security;

create policy org_invites_manage on public.organization_invitations
  for all
  using (public.is_super_admin() or public.can_manage_org(organization_id))
  with check (public.is_super_admin() or public.can_manage_org(organization_id));

create policy org_invites_self_read on public.organization_invitations
  for select using (
    email = (select p.email from public.profiles p where p.id = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- Public catalogue: subscription_plans, features, plan_features.
-- Anyone (including anonymous visitors on the pricing page) may read ACTIVE,
-- PUBLIC plans and the feature catalogue. Only super admins may write.
-- ----------------------------------------------------------------------------
alter table public.subscription_plans enable row level security;
alter table public.features enable row level security;
alter table public.plan_features enable row level security;

create policy plans_public_read on public.subscription_plans
  for select using (is_active and is_public or public.is_platform_staff());
create policy plans_admin_write on public.subscription_plans
  for all using (public.is_super_admin()) with check (public.is_super_admin());

create policy features_public_read on public.features
  for select using (true);
create policy features_admin_write on public.features
  for all using (public.is_super_admin()) with check (public.is_super_admin());

create policy plan_features_public_read on public.plan_features
  for select using (true);
create policy plan_features_admin_write on public.plan_features
  for all using (public.is_super_admin()) with check (public.is_super_admin());

-- ----------------------------------------------------------------------------
-- billing_events + audit_logs — never client-writable.
--   billing_events: service role only (RLS enabled, no permissive policy →
--                   only the service role, which bypasses RLS, can touch it).
--   audit_logs:     org members may READ their org's log; writes happen via
--                   service role / SECURITY DEFINER logging helpers.
-- ----------------------------------------------------------------------------
alter table public.billing_events enable row level security;
create policy billing_events_admin_read on public.billing_events
  for select using (public.is_platform_staff());

alter table public.audit_logs enable row level security;
create policy audit_logs_member_read on public.audit_logs
  for select using (
    public.is_super_admin()
    or (organization_id is not null and public.is_org_member(organization_id))
  );

-- ----------------------------------------------------------------------------
-- Portal read policies for learner-facing tables. These ADD read access for a
-- learner viewing their own data and a parent viewing a linked child, on top of
-- the member policy already created in the loop above.
-- ----------------------------------------------------------------------------
create policy learners_portal_select on public.learners
  for select using (public.is_self_learner(id) or public.is_linked_parent(id));

create policy attendance_portal_select on public.attendance
  for select using (public.is_self_learner(learner_id) or public.is_linked_parent(learner_id));

create policy grades_portal_select on public.grades
  for select using (public.is_self_learner(learner_id) or public.is_linked_parent(learner_id));

create policy submissions_portal_select on public.assignment_submissions
  for select using (public.is_self_learner(learner_id) or public.is_linked_parent(learner_id));

create policy results_portal_select on public.assessment_results
  for select using (public.is_self_learner(learner_id) or public.is_linked_parent(learner_id));

create policy progress_records_portal_select on public.progress_records
  for select using (public.is_self_learner(learner_id) or public.is_linked_parent(learner_id));

create policy progress_reports_portal_select on public.progress_reports
  for select using (public.is_self_learner(learner_id) or public.is_linked_parent(learner_id));

create policy invoices_portal_select on public.invoices
  for select using (
    (bill_to_learner_id is not null and public.is_self_learner(bill_to_learner_id))
    or (bill_to_learner_id is not null and public.is_linked_parent(bill_to_learner_id))
  );
