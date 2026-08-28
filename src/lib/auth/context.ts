import 'server-only';
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import type { AuthContext, PermissionOverrides } from '@/lib/permissions';
import type { OrgRole } from '@/constants/roles';

/**
 * Resolve the current user's authorization context for a given organization,
 * entirely server-side. NEVER trust a client-supplied organization id, role or
 * permission set — this is the only sanctioned source.
 *
 * Wrapped in React `cache` so repeated calls within one request/render dedupe.
 */
export const getUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getProfile = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('id, email, full_name, avatar_url, platform_role, last_active_organization_id')
    .eq('id', user.id)
    .single();
  return data;
});

/**
 * Build the AuthContext for the active organization. If `organizationId` is
 * omitted, falls back to the profile's last active organization.
 * Returns null when the user is unauthenticated.
 */
export async function getAuthContext(organizationId?: string): Promise<AuthContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('platform_role, last_active_organization_id')
    .eq('id', user.id)
    .single();

  const orgId = organizationId ?? profile?.last_active_organization_id ?? null;

  let role: OrgRole | null = null;
  let overrides: PermissionOverrides = {};

  if (orgId) {
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role, permission_overrides, status')
      .eq('organization_id', orgId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (membership) {
      role = membership.role;
      overrides = (membership.permission_overrides as PermissionOverrides) ?? {};
    }
  }

  return {
    userId: user.id,
    platformRole: profile?.platform_role ?? 'none',
    organizationId: orgId,
    role,
    overrides,
  };
}

/** List every organization the current user actively belongs to. */
export async function getUserOrganizations() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('organization_members')
    .select('role, organization:organizations(id, name, slug, type, logo_url)')
    .eq('user_id', user.id)
    .eq('status', 'active');

  return data ?? [];
}
