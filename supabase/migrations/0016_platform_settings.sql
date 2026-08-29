-- ============================================================================
-- 0016_platform_settings.sql  (additive)
--
-- A tiny key/value store for platform-wide configuration set by super admins —
-- e.g. which learner-app features are globally available. Per-academy overrides
-- live in organizations.portal_preferences; the effective state is the AND of
-- the two.
-- ============================================================================

create table if not exists public.platform_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.platform_settings enable row level security;

-- Platform staff manage; the value is also readable by any authenticated user
-- (feature availability is not sensitive and the learner app needs it).
drop policy if exists platform_settings_staff_all on public.platform_settings;
create policy platform_settings_staff_all on public.platform_settings
  for all using (public.is_platform_staff()) with check (public.is_platform_staff());

drop policy if exists platform_settings_read on public.platform_settings;
create policy platform_settings_read on public.platform_settings
  for select using (auth.role() = 'authenticated');
