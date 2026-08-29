-- ============================================================================
-- 0020_revision_cards.sql  (additive)
--
-- Flashcard decks a tutor builds for their academy; learners flip through them
-- to revise. Decks are academy-wide (visible to all the academy's learners).
-- ============================================================================

create table if not exists public.revision_decks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  subject text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists revision_decks_org_idx on public.revision_decks(organization_id);

create table if not exists public.revision_cards (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  deck_id uuid not null references public.revision_decks(id) on delete cascade,
  front text not null,
  back text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists revision_cards_deck_idx on public.revision_cards(deck_id);

drop trigger if exists revision_decks_set_updated_at on public.revision_decks;
create trigger revision_decks_set_updated_at
  before update on public.revision_decks
  for each row execute function public.set_updated_at();

alter table public.revision_decks enable row level security;
alter table public.revision_cards enable row level security;

drop policy if exists revision_decks_member_all on public.revision_decks;
create policy revision_decks_member_all on public.revision_decks
  for all using (public.is_super_admin() or public.is_org_member(organization_id))
  with check (public.is_super_admin() or public.is_org_member(organization_id));

drop policy if exists revision_decks_learner_read on public.revision_decks;
create policy revision_decks_learner_read on public.revision_decks
  for select using (
    exists (select 1 from public.learners l
            where l.organization_id = revision_decks.organization_id
              and public.is_self_learner(l.id))
  );

drop policy if exists revision_cards_member_all on public.revision_cards;
create policy revision_cards_member_all on public.revision_cards
  for all using (public.is_super_admin() or public.is_org_member(organization_id))
  with check (public.is_super_admin() or public.is_org_member(organization_id));

drop policy if exists revision_cards_learner_read on public.revision_cards;
create policy revision_cards_learner_read on public.revision_cards
  for select using (
    exists (select 1 from public.learners l
            where l.organization_id = revision_cards.organization_id
              and public.is_self_learner(l.id))
  );
