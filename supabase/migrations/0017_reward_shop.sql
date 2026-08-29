-- ============================================================================
-- 0017_reward_shop.sql  (additive)
--
-- Rewards shop: per-academy items learners can redeem with the points they earn
-- from games, homework and good behaviour. Redeeming reserves points; a tutor
-- approves/fulfils or rejects (which frees the points and restocks the item).
--
-- Points math: lifetime points stay in reward_events (drives level/leaderboard);
-- a learner's SPENDABLE balance is lifetime minus points reserved by active
-- redemptions — so spending never lowers a learner's rank.
-- ============================================================================

create table if not exists public.reward_shop_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  emoji text,
  description text,
  cost integer not null check (cost >= 0),
  stock integer,                     -- null = unlimited
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists reward_shop_items_org_idx on public.reward_shop_items(organization_id);

create table if not exists public.reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  learner_id uuid not null references public.learners(id) on delete cascade,
  item_id uuid references public.reward_shop_items(id) on delete set null,
  item_name text not null,
  points_spent integer not null check (points_spent >= 0),
  status text not null default 'pending',  -- pending | approved | fulfilled | rejected | cancelled
  decided_by uuid references public.profiles(id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists reward_redemptions_org_idx on public.reward_redemptions(organization_id);
create index if not exists reward_redemptions_learner_idx on public.reward_redemptions(learner_id);

drop trigger if exists reward_shop_items_set_updated_at on public.reward_shop_items;
create trigger reward_shop_items_set_updated_at
  before update on public.reward_shop_items
  for each row execute function public.set_updated_at();

drop trigger if exists reward_redemptions_set_updated_at on public.reward_redemptions;
create trigger reward_redemptions_set_updated_at
  before update on public.reward_redemptions
  for each row execute function public.set_updated_at();

alter table public.reward_shop_items enable row level security;
alter table public.reward_redemptions enable row level security;

-- Organization members manage the shop; learners read the catalogue.
drop policy if exists reward_shop_items_member_all on public.reward_shop_items;
create policy reward_shop_items_member_all on public.reward_shop_items
  for all using (public.is_super_admin() or public.is_org_member(organization_id))
  with check (public.is_super_admin() or public.is_org_member(organization_id));

drop policy if exists reward_shop_items_learner_read on public.reward_shop_items;
create policy reward_shop_items_learner_read on public.reward_shop_items
  for select using (
    exists (
      select 1 from public.learners l
      where l.organization_id = reward_shop_items.organization_id
        and public.is_self_learner(l.id)
    )
  );

-- Members manage redemptions; a learner (or linked parent) sees their own.
drop policy if exists reward_redemptions_member_all on public.reward_redemptions;
create policy reward_redemptions_member_all on public.reward_redemptions
  for all using (public.is_super_admin() or public.is_org_member(organization_id))
  with check (public.is_super_admin() or public.is_org_member(organization_id));

drop policy if exists reward_redemptions_self_read on public.reward_redemptions;
create policy reward_redemptions_self_read on public.reward_redemptions
  for select using (public.is_self_learner(learner_id) or public.is_linked_parent(learner_id));
