-- ============================================================================
-- 0018_certificates.sql  (additive)
--
-- Certificates a tutor issues to a learner (completion, achievement, etc.).
-- Learners view and print/save them from their portal. Each has a serial for
-- verification.
-- ============================================================================

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  learner_id uuid not null references public.learners(id) on delete cascade,
  title text not null,
  type text not null default 'achievement',   -- completion | achievement | excellence | participation | term_report
  description text,
  serial text not null,
  issued_by uuid references public.profiles(id) on delete set null,
  issued_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (serial)
);
create index if not exists certificates_org_idx on public.certificates(organization_id);
create index if not exists certificates_learner_idx on public.certificates(learner_id);

alter table public.certificates enable row level security;

drop policy if exists certificates_member_all on public.certificates;
create policy certificates_member_all on public.certificates
  for all using (public.is_super_admin() or public.is_org_member(organization_id))
  with check (public.is_super_admin() or public.is_org_member(organization_id));

drop policy if exists certificates_self_read on public.certificates;
create policy certificates_self_read on public.certificates
  for select using (public.is_self_learner(learner_id) or public.is_linked_parent(learner_id));
