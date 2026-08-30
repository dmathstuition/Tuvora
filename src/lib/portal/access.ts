import 'server-only';
import { cache } from 'react';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentLearner } from '@/lib/portal/current-learner';

const TRIAL_DAYS = 14;
const DAY_MS = 86_400_000;

export interface LearnerAccess {
  /** Is a learner account linked to this user at all? */
  linked: boolean;
  /** May they use the portal right now? */
  allowed: boolean;
  academyName: string;
  /** True while the academy's 14-day free trial covers everyone. */
  inOrgTrial: boolean;
}

/**
 * Whether the signed-in learner may access the portal.
 *
 * Access is granted while the academy's 14-day free trial is running (everyone
 * is free), and after that only when the learner's own month has been paid
 * (learner_billing active/trialing and not expired). Resolved with the service
 * role because a learner is not an org member and cannot read org/billing rows
 * under RLS. Cached per request.
 */
export const getLearnerAccess = cache(async (): Promise<LearnerAccess> => {
  const learner = await getCurrentLearner();
  if (!learner) return { linked: false, allowed: true, academyName: '', inOrgTrial: false };

  const admin = createAdminClient();
  const [{ data: org }, { data: sub }, { data: billing }] = await Promise.all([
    admin.from('organizations').select('name, created_at').eq('id', learner.organizationId).maybeSingle(),
    admin
      .from('subscriptions')
      .select('status, trial_ends_at')
      .eq('organization_id', learner.organizationId)
      .in('status', ['trialing', 'active', 'past_due', 'paused'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from('learner_billing')
      .select('status, current_period_end')
      .eq('learner_id', learner.id)
      .maybeSingle(),
  ]);

  const academyName = org?.name ?? 'your academy';
  const now = Date.now();

  // Academy free-trial window: 14 days from org creation, or the subscription's
  // own trial end, whichever is later.
  const fromCreation = org?.created_at ? new Date(org.created_at).getTime() + TRIAL_DAYS * DAY_MS : 0;
  const fromSub =
    sub?.status === 'trialing' && sub.trial_ends_at ? new Date(sub.trial_ends_at).getTime() : 0;
  const orgTrialEnd = Math.max(fromCreation, fromSub);
  const inOrgTrial = orgTrialEnd > 0 && now < orgTrialEnd;
  if (inOrgTrial) return { linked: true, allowed: true, academyName, inOrgTrial: true };

  // After the trial: the learner's own month must be paid and current.
  const paid =
    !!billing &&
    (billing.status === 'active' || billing.status === 'trialing') &&
    (!billing.current_period_end || new Date(billing.current_period_end).getTime() > now);

  return { linked: true, allowed: paid, academyName, inOrgTrial: false };
});
