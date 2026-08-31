import 'server-only';
import { cache } from 'react';
import { getUser } from '@/lib/auth/context';
import { createAdminClient } from '@/lib/supabase/admin';

export interface CurrentLearner {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string | null;
  avatarKey: string | null;
  themeKey: string | null;
  avatarUrl: string | null;
}

/**
 * The signed-in learner, resolved once per request (id, org + display fields).
 *
 * Portal services each used to call supabase.auth.getUser() (a network round-trip
 * to Supabase Auth) and re-query the learner row — so a single portal page fired
 * several redundant auth + DB calls. This shares the cached getUser() and one
 * learner lookup across every portal service in the same request.
 */
export const getCurrentLearner = cache(async (): Promise<CurrentLearner | null> => {
  const user = await getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from('learners')
    .select('id, organization_id, first_name, last_name, avatar_key, theme_key, avatar_url')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    organizationId: data.organization_id,
    firstName: data.first_name,
    lastName: data.last_name,
    avatarKey: data.avatar_key,
    themeKey: data.theme_key,
    avatarUrl: data.avatar_url,
  };
});

export interface PortalBranding {
  /** The academy the learner belongs to. */
  name: string;
  logoUrl: string | null;
}

/**
 * The academy's name + logo for the signed-in learner, so the portal shell can
 * show whose academy the learner is inside (rather than Tuvora's own brand).
 * Cached per request and keyed off the already-cached learner lookup.
 */
export const getPortalBranding = cache(async (): Promise<PortalBranding | null> => {
  const learner = await getCurrentLearner();
  if (!learner) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from('organizations')
    .select('name, logo_url')
    .eq('id', learner.organizationId)
    .maybeSingle();
  if (!data) return null;
  return { name: data.name, logoUrl: data.logo_url };
});
