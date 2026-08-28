-- ============================================================================
-- seed.sql — Catalogue seed (safe to run on every environment).
-- Seeds the FEATURE catalogue and default subscription PLANS.
--
-- IMPORTANT: these values live in the DATABASE as admin-editable configuration.
-- The application never hardcodes plan names, prices or limits — it reads them
-- from these tables. Editing a plan in the admin UI updates entitlements live.
--
-- Run demo tenant data separately via supabase/seed/demo.sql (needs auth users).
-- Never put real secrets in seed files.
-- ============================================================================

-- --- Feature catalogue -------------------------------------------------------
insert into public.features (slug, name, description, type, default_value) values
  ('learners',           'Learners',            'Number of active learner seats',            'numeric',   '{"limit":0}'),
  ('classes',            'Classes',             'Number of classes',                          'numeric',   '{"limit":0}'),
  ('courses',            'Courses',             'Number of courses',                          'numeric',   '{"limit":0}'),
  ('staff',              'Staff members',       'Number of staff/tutor seats',                'numeric',   '{"limit":1}'),
  ('storage',            'Storage',             'File storage in MB',                         'numeric',   '{"limit":500}'),
  ('assignments',        'Assignments',         'Create and grade assignments',               'boolean',   'true'),
  ('assessments',        'Assessments',         'Quizzes, tests and exams',                   'boolean',   'true'),
  ('attendance',         'Attendance',          'Attendance tracking',                        'boolean',   'true'),
  ('reports',            'Reports',             'Standard reports',                           'boolean',   'true'),
  ('advanced_reports',   'Advanced reports',    'Advanced analytics and exports',             'boolean',   'false'),
  ('parent_portal',      'Parent portal',       'Parent access to children data',             'boolean',   'false'),
  ('messaging',          'Messaging',           'Internal messaging',                         'boolean',   'true'),
  ('payments',           'Payments',            'Collect payments from parents/learners',     'boolean',   'false'),
  ('invoices',           'Invoices',            'Issue invoices',                             'boolean',   'false'),
  ('certificates',       'Certificates',        'Issue certificates',                         'boolean',   'false'),
  ('custom_branding',    'Custom branding',     'Logo, colours and white-labelling',          'boolean',   'false'),
  ('custom_domain',      'Custom domain',       'Serve the portal on a custom domain',        'boolean',   'false'),
  ('ai_tools',           'AI tools',            'AI-assisted content and insights',           'boolean',   'false'),
  ('automation',         'Automation',          'Workflow automation',                        'boolean',   'false'),
  ('multiple_tutors',    'Multiple tutors',     'More than one tutor/staff account',          'boolean',   'false'),
  ('api_access',         'API access',          'Programmatic API access',                    'boolean',   'false'),
  ('advanced_analytics', 'Advanced analytics',  'Business analytics dashboards',              'boolean',   'false')
on conflict (slug) do nothing;

-- --- Plans -------------------------------------------------------------------
-- Prices are in MINOR units (cents). Currency USD by default; admin-editable.
insert into public.subscription_plans (
  slug, name, description,
  monthly_price_minor, yearly_price_minor, currency,
  included_learners, additional_learner_price_minor,
  staff_limit, class_limit, course_limit, storage_limit_mb,
  is_active, is_public, is_recommended, sort_order, trial_days
) values
  ('starter', 'Starter', 'For independent tutors getting started.',
    1900, 19000, 'USD',
    10, 150,
    1, 5, 3, 1000,
    true, true, false, 1, 14),
  ('professional', 'Professional', 'For growing tutors and small teams.',
    4900, 49000, 'USD',
    50, 120,
    5, null, null, 10000,
    true, true, true, 2, 14),
  ('business', 'Business', 'For tutoring centres and businesses.',
    9900, 99000, 'USD',
    100, 90,
    null, null, null, 50000,
    true, true, false, 3, 14)
on conflict (slug) do nothing;

-- --- Plan → feature entitlements --------------------------------------------
-- Helper: attach a feature value to a plan by slug.
do $$
declare
  starter uuid;      professional uuid;      business uuid;
begin
  select id into starter from public.subscription_plans where slug = 'starter';
  select id into professional from public.subscription_plans where slug = 'professional';
  select id into business from public.subscription_plans where slug = 'business';

  -- Starter
  insert into public.plan_features (plan_id, feature_id, value)
  select starter, f.id, v.value
  from (values
    ('learners','{"limit":10}'::jsonb),
    ('classes','{"limit":5}'::jsonb),
    ('courses','{"limit":3}'::jsonb),
    ('staff','{"limit":1}'::jsonb),
    ('assignments','true'::jsonb),
    ('assessments','true'::jsonb),
    ('attendance','true'::jsonb),
    ('reports','true'::jsonb),
    ('advanced_reports','false'::jsonb),
    ('parent_portal','false'::jsonb),
    ('messaging','true'::jsonb),
    ('multiple_tutors','false'::jsonb)
  ) as v(slug, value)
  join public.features f on f.slug = v.slug
  on conflict (plan_id, feature_id) do update set value = excluded.value;

  -- Professional
  insert into public.plan_features (plan_id, feature_id, value)
  select professional, f.id, v.value
  from (values
    ('learners','{"limit":50}'::jsonb),
    ('classes','{"unlimited":true}'::jsonb),
    ('courses','{"unlimited":true}'::jsonb),
    ('staff','{"limit":5}'::jsonb),
    ('assignments','true'::jsonb),
    ('assessments','true'::jsonb),
    ('attendance','true'::jsonb),
    ('reports','true'::jsonb),
    ('advanced_reports','true'::jsonb),
    ('parent_portal','true'::jsonb),
    ('messaging','true'::jsonb),
    ('payments','true'::jsonb),
    ('invoices','true'::jsonb),
    ('multiple_tutors','true'::jsonb)
  ) as v(slug, value)
  join public.features f on f.slug = v.slug
  on conflict (plan_id, feature_id) do update set value = excluded.value;

  -- Business
  insert into public.plan_features (plan_id, feature_id, value)
  select business, f.id, v.value
  from (values
    ('learners','{"limit":100}'::jsonb),
    ('classes','{"unlimited":true}'::jsonb),
    ('courses','{"unlimited":true}'::jsonb),
    ('staff','{"unlimited":true}'::jsonb),
    ('assignments','true'::jsonb),
    ('assessments','true'::jsonb),
    ('attendance','true'::jsonb),
    ('reports','true'::jsonb),
    ('advanced_reports','true'::jsonb),
    ('parent_portal','true'::jsonb),
    ('messaging','true'::jsonb),
    ('payments','true'::jsonb),
    ('invoices','true'::jsonb),
    ('certificates','true'::jsonb),
    ('custom_branding','true'::jsonb),
    ('custom_domain','true'::jsonb),
    ('ai_tools','true'::jsonb),
    ('automation','true'::jsonb),
    ('multiple_tutors','true'::jsonb),
    ('api_access','true'::jsonb),
    ('advanced_analytics','true'::jsonb)
  ) as v(slug, value)
  join public.features f on f.slug = v.slug
  on conflict (plan_id, feature_id) do update set value = excluded.value;
end $$;
