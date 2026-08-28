-- ============================================================================
-- demo.sql — Populate a full demo academy for an EXISTING signed-up account.
--
-- HOW TO USE
--   1. Sign up in the app (creates the auth user + profile).
--   2. Edit the email below to match that account.
--   3. Run this file in the Supabase SQL editor.
--
-- It creates: an organization (owner = you), an active subscription, learners
-- (with per-learner billing), classes + enrolments, an assignment with graded
-- submissions, attendance, and reward points — so every dashboard, the admin
-- area and the leaderboard have data. Safe to re-run (it upserts on a fixed
-- slug and clears the demo org's child rows first).
-- ============================================================================

do $$
declare
  demo_email citext := 'you@example.com';   -- <-- CHANGE THIS
  owner_id uuid;
  org_id uuid;
  plan_id uuid;
  sub_id uuid;
  class_id uuid;
  assignment_id uuid;
  l record;
  learner_ids uuid[] := '{}';
  names text[] := array['Amara','David','Zainab','Tunde','Chidi','Fatima','Kemi','Uche'];
  surnames text[] := array['Okafor','Bello','Ade','Musa','Nwosu','Sani','Cole','Eze'];
  i int;
  new_learner uuid;
begin
  select id into owner_id from public.profiles where email = demo_email;
  if owner_id is null then
    raise exception 'No profile for %. Sign up first, then set demo_email.', demo_email;
  end if;

  -- Organization (fixed slug so re-runs update the same demo org).
  insert into public.organizations (name, slug, type, owner_id, country, currency, timezone, subjects, employs_tutors, portal_preferences)
  values ('Bright Minds Academy', 'bright-minds-demo', 'tutoring_business', owner_id, 'NG', 'NGN', 'Africa/Lagos',
          array['Mathematics','English','Science'], true,
          '{"displayName":"Bright Minds Academy","welcome":"Welcome back — ready to learn?","themeColor":"#4F46E5"}'::jsonb)
  on conflict (slug) do update set name = excluded.name
  returning id into org_id;

  -- Clear previous demo child rows for a clean re-run.
  delete from public.reward_events where organization_id = org_id;
  delete from public.attendance where organization_id = org_id;
  delete from public.assignment_submissions where organization_id = org_id;
  delete from public.assignments where organization_id = org_id;
  delete from public.class_members where organization_id = org_id;
  delete from public.classes where organization_id = org_id;
  delete from public.learner_billing where organization_id = org_id;
  delete from public.learners where organization_id = org_id;

  -- Owner membership.
  insert into public.organization_members (organization_id, user_id, role, status, joined_at)
  values (org_id, owner_id, 'owner', 'active', now())
  on conflict (organization_id, user_id) do update set role = 'owner', status = 'active';

  update public.profiles set last_active_organization_id = org_id where id = owner_id;

  -- Subscription on the Professional plan.
  select id into plan_id from public.subscription_plans where slug = 'professional';
  if plan_id is not null then
    insert into public.subscriptions (organization_id, plan_id, status, interval, current_period_end)
    values (org_id, plan_id, 'active', 'monthly', now() + interval '1 month')
    on conflict (organization_id) where status in ('trialing','active','past_due','paused','incomplete')
    do update set plan_id = excluded.plan_id, status = 'active'
    returning id into sub_id;
  end if;

  -- A class.
  insert into public.classes (organization_id, name, description, mode, status, capacity, start_date)
  values (org_id, 'JSS2 Mathematics', 'Junior secondary maths group', 'group', 'active', 20, current_date - 30)
  returning id into class_id;

  -- Learners (first is trial, rest paid/open), enrol in the class, give points.
  for i in 1..8 loop
    insert into public.learners (organization_id, first_name, last_name, email, status, avatar_key, theme_key)
    values (org_id, names[i], surnames[i], lower(names[i]) || '@example.com', 'active',
            (array['fox','owl','rocket','star','panda','unicorn','lion','robot'])[i],
            (array['indigo','ocean','sunset','forest','grape','candy','indigo','ocean'])[i])
    returning id into new_learner;
    learner_ids := learner_ids || new_learner;

    insert into public.learner_billing (organization_id, learner_id, status, is_trial, current_period_start, current_period_end)
    values (org_id, new_learner, case when i = 1 then 'trialing' else 'active' end, i = 1, now(), now() + interval '1 month');

    insert into public.class_members (organization_id, class_id, learner_id) values (org_id, class_id, new_learner);

    insert into public.reward_events (organization_id, learner_id, kind, points, category, reason, awarded_by)
    values (org_id, new_learner, 'reward', (9 - i) * 100 + 40, 'achievement', 'Great progress', owner_id);
  end loop;

  -- An assignment with graded submissions.
  insert into public.assignments (organization_id, class_id, title, instructions, status, max_points, due_at, created_by)
  values (org_id, class_id, 'Algebra Worksheet 3', 'Complete questions 1–10.', 'published', 100, now() + interval '3 days', owner_id)
  returning id into assignment_id;

  i := 0;
  foreach new_learner in array learner_ids loop
    i := i + 1;
    insert into public.assignment_submissions (organization_id, assignment_id, learner_id, status, score, submitted_at, graded_at, graded_by)
    values (org_id, assignment_id, new_learner, 'returned', 60 + ((i * 7) % 40), now() - interval '2 days', now() - interval '1 day', owner_id);

    insert into public.attendance (organization_id, class_id, learner_id, session_date, status, recorded_by)
    values (org_id, class_id, new_learner, current_date - 1,
            (array['present','present','late','present','absent','present','present','present'])[i]::attendance_status, owner_id);
  end loop;

  raise notice 'Demo academy ready for % (org %).', demo_email, org_id;
end $$;
