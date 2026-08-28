-- ============================================================================
-- 0002_core_tenancy.sql
-- Profiles, organizations, memberships and invitations — the multi-tenant spine.
-- Every tenant-owned table added later carries organization_id and inherits the
-- isolation pattern established here.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- profiles — one row per auth.users row (1:1). Never store secrets here.
-- ----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email citext not null,
  full_name text,
  avatar_url text,
  platform_role platform_role not null default 'none',
  -- Convenience pointer to the org the user last used; not an authz source.
  last_active_organization_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-provision a profile when a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- organizations — the tenant boundary.
-- ----------------------------------------------------------------------------
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug citext unique not null,
  type organization_type not null default 'independent_tutor',
  owner_id uuid not null references public.profiles(id),
  -- Localisation
  country text,          -- ISO 3166-1 alpha-2
  currency text not null default 'USD', -- ISO 4217
  timezone text not null default 'UTC',
  subjects text[] not null default '{}',
  -- Branding (settings surface expands in 0009)
  logo_url text,
  favicon_url text,
  brand_color text,
  -- Lifecycle
  onboarding_completed_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index organizations_owner_idx on public.organizations(owner_id);
create index organizations_type_idx on public.organizations(type);

create trigger organizations_set_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- organization_members — a user's membership + role in an organization.
-- A user MAY belong to multiple organizations. (user_id, organization_id) unique.
-- ----------------------------------------------------------------------------
create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role org_role not null default 'staff',
  status membership_status not null default 'active',
  -- Optional per-member permission overrides layered on top of role defaults.
  -- Shape: { "grant": ["billing.manage"], "revoke": ["learners.delete"] }
  permission_overrides jsonb not null default '{}'::jsonb,
  invited_by uuid references public.profiles(id),
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index org_members_user_idx on public.organization_members(user_id);
create index org_members_org_idx on public.organization_members(organization_id);

create trigger org_members_set_updated_at
  before update on public.organization_members
  for each row execute function public.set_updated_at();

-- Add the FK from profiles.last_active_organization_id now that orgs exist.
alter table public.profiles
  add constraint profiles_last_active_org_fkey
  foreign key (last_active_organization_id)
  references public.organizations(id) on delete set null;

-- ----------------------------------------------------------------------------
-- organization_invitations — pending invites accepted via a token link.
-- ----------------------------------------------------------------------------
create table public.organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email citext not null,
  role org_role not null default 'staff',
  token text not null unique,
  invited_by uuid references public.profiles(id),
  accepted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '14 days'),
  created_at timestamptz not null default now(),
  unique (organization_id, email)
);

create index org_invites_email_idx on public.organization_invitations(email);
create index org_invites_token_idx on public.organization_invitations(token);
