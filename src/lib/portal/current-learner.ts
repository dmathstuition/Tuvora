import 'server-only';
import { cache } from 'react';
import { getUser } from '@/lib/auth/context';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * The signed-in learner (id + org), resolved once per request.
 *
 * Portal services each used to call supabase.auth.getUser() (a network round-trip
 * to Supabase Auth) and re-query the learner row — so a single portal page fired
 * several redundant auth calls. This shares the cached getUser() and one learner
 * lookup across every portal service in the same request.
 */
export const getCurrentLearner = cache(
  async (): Promise<{ id: string; organizationId: string } | null> => {
    const user = await getUser();
    if (!user) return null;
    const admin = createAdminClient();
    const { data } = await admin
      .from('learners')
      .select('id, organization_id')
      .eq('user_id', user.id)
      .maybeSingle();
    return data ? { id: data.id, organizationId: data.organization_id } : null;
  },
);
