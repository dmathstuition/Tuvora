import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export type HomePath = '/admin' | '/dashboard' | '/portal' | '/onboarding';

/**
 * Is the current user a learner (linked, or invitable by a matching email on an
 * unlinked learner record)? Uses the service-role client because an unlinked
 * learner row is not visible to the user under RLS yet.
 */
export async function isLinkedLearner(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const admin = createAdminClient();
  const { data: linked } = await admin
    .from('learners')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();
  if (linked) return true;

  if (user.email) {
    const { data: byEmail } = await admin
      .from('learners')
      .select('id')
      .eq('email', user.email)
      .is('user_id', null)
      .limit(1)
      .maybeSingle();
    if (byEmail) return true;
  }
  return false;
}

/**
 * Where should the signed-in user land? Org members and platform staff go to
 * the dashboard; learners go to their portal; everyone else (a fresh tutor
 * sign-up) goes to onboarding.
 */
export async function resolveHomePath(): Promise<HomePath> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return '/onboarding';

  // Platform staff go straight to the admin command centre.
  const { data: profile } = await supabase
    .from('profiles')
    .select('platform_role')
    .eq('id', user.id)
    .maybeSingle();
  if (profile?.platform_role === 'super_admin' || profile?.platform_role === 'platform_support') {
    return '/admin';
  }

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();
  if (membership) {
    // A member whose org hasn't finished onboarding resumes the wizard.
    const { data: org } = await supabase
      .from('organizations')
      .select('onboarding_completed_at')
      .eq('id', membership.organization_id)
      .maybeSingle();
    return org && !org.onboarding_completed_at ? '/onboarding' : '/dashboard';
  }

  if (await isLinkedLearner()) return '/portal';
  return '/onboarding';
}
