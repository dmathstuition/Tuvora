-- ============================================================================
-- 0010_learner_portal_invites.sql  (additive)
--
-- First-class learner portal invitations. A tutor invites a learner to their
-- portal; the invite carries a token. When the learner signs up via the invite
-- link, the signup action consumes the token (service role) and links the
-- learner record to the new auth user — more reliable than email matching.
-- ============================================================================

create table public.learner_portal_invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  learner_id uuid not null references public.learners(id) on delete cascade,
  email citext not null,
  token text not null unique,
  invited_by uuid references public.profiles(id) on delete set null,
  accepted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now(),
  -- One active invite per learner (re-inviting replaces it via upsert).
  unique (learner_id)
);

create index learner_portal_invites_token_idx on public.learner_portal_invites(token);
create index learner_portal_invites_org_idx on public.learner_portal_invites(organization_id);

-- RLS: organization members manage invites for their tenant. The signup
-- consume path runs under the service role and bypasses RLS.
alter table public.learner_portal_invites enable row level security;

drop policy if exists learner_portal_invites_member_all on public.learner_portal_invites;
create policy learner_portal_invites_member_all on public.learner_portal_invites
  for all
  using (public.is_super_admin() or public.is_org_member(organization_id))
  with check (public.is_super_admin() or public.is_org_member(organization_id));
