-- ============================================================================
-- 0011_coupons.sql  (additive)
--
-- Platform discount coupons, managed by super admins. Redemption tracking is a
-- simple counter here; wiring codes into checkout comes with the payment
-- provider integration.
-- ============================================================================

create type coupon_discount_type as enum ('percent', 'fixed');

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code citext not null unique,
  description text,
  discount_type coupon_discount_type not null,
  -- percent: 1-100; fixed: amount in minor units of `currency`.
  discount_value integer not null,
  currency text,                     -- required for fixed-amount coupons
  duration text not null default 'once',  -- 'once' | 'forever' | 'repeating'
  max_redemptions integer,           -- null = unlimited
  times_redeemed integer not null default 0,
  is_active boolean not null default true,
  expires_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index coupons_active_idx on public.coupons(is_active);

drop trigger if exists coupons_set_updated_at on public.coupons;
create trigger coupons_set_updated_at
  before update on public.coupons
  for each row execute function public.set_updated_at();

alter table public.coupons enable row level security;

-- Platform staff may read; only super admins may write.
drop policy if exists coupons_staff_read on public.coupons;
create policy coupons_staff_read on public.coupons
  for select using (public.is_platform_staff());

drop policy if exists coupons_admin_write on public.coupons;
create policy coupons_admin_write on public.coupons
  for all using (public.is_super_admin()) with check (public.is_super_admin());
