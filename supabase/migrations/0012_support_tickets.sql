-- ============================================================================
-- 0012_support_tickets.sql  (additive)
--
-- Support tickets raised by organizations, worked by platform staff.
-- ============================================================================

create type support_ticket_status as enum ('open', 'pending', 'resolved', 'closed');
create type support_ticket_priority as enum ('low', 'normal', 'high');

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  subject text not null,
  message text not null,
  status support_ticket_status not null default 'open',
  priority support_ticket_priority not null default 'normal',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index support_tickets_status_idx on public.support_tickets(status);
create index support_tickets_org_idx on public.support_tickets(organization_id);

drop trigger if exists support_tickets_set_updated_at on public.support_tickets;
create trigger support_tickets_set_updated_at
  before update on public.support_tickets
  for each row execute function public.set_updated_at();

alter table public.support_tickets enable row level security;

-- Organization members read + create their own org's tickets.
drop policy if exists support_tickets_member_read on public.support_tickets;
create policy support_tickets_member_read on public.support_tickets
  for select using (
    public.is_platform_staff()
    or (organization_id is not null and public.is_org_member(organization_id))
  );

drop policy if exists support_tickets_member_create on public.support_tickets;
create policy support_tickets_member_create on public.support_tickets
  for insert with check (
    organization_id is not null and public.is_org_member(organization_id) and created_by = auth.uid()
  );

-- Platform staff update (triage / resolve) any ticket.
drop policy if exists support_tickets_staff_update on public.support_tickets;
create policy support_tickets_staff_update on public.support_tickets
  for update using (public.is_platform_staff()) with check (public.is_platform_staff());
