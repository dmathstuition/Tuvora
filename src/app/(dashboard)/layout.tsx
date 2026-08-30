import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext, getProfile } from '@/lib/auth/context';
import { isLinkedLearner } from '@/lib/auth/routing';
import { listPermissions } from '@/lib/permissions';
import { getTrialStatus } from '@/lib/entitlements/service';
import { Sidebar } from '@/components/dashboard/sidebar';
import { Topbar } from '@/components/dashboard/topbar';
import { TrialBanner } from '@/components/dashboard/trial-banner';

/**
 * Dashboard shell. Resolves the acting user + their active organization and
 * role entirely server-side, then renders permission-filtered navigation.
 * Sends first-time users (no organization) to onboarding.
 */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getAuthContext();
  if (!ctx) redirect('/login');
  if (!ctx.organizationId || !ctx.role) {
    // Not an org member: a learner belongs in their portal; a fresh tutor in onboarding.
    redirect((await isLinkedLearner()) ? '/portal' : '/onboarding');
  }

  const supabase = await createClient();
  const [{ data: org }, profile, { data: sub }, trialStatus] = await Promise.all([
    supabase.from('organizations').select('name, logo_url').eq('id', ctx.organizationId).single(),
    getProfile(),
    supabase
      .from('subscriptions')
      .select('status, plan_id')
      .eq('organization_id', ctx.organizationId)
      .in('status', ['trialing', 'active', 'past_due', 'paused'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    getTrialStatus(ctx.organizationId),
  ]);

  let planName: string | undefined;
  if (sub?.plan_id) {
    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('name')
      .eq('id', sub.plan_id)
      .maybeSingle();
    planName = plan?.name;
  }

  let planLabel: string;
  if (trialStatus.state === 'trialing') planLabel = `Free trial · ${trialStatus.daysLeft}d left`;
  else if (trialStatus.state === 'trial_expired') planLabel = 'Trial ended';
  else if (trialStatus.state === 'past_due') planLabel = 'Payment due';
  else if (trialStatus.state === 'active') planLabel = planName ?? 'Active plan';
  else planLabel = 'No active plan';

  const onPaidPlan = trialStatus.state === 'active';

  const permissions = listPermissions(ctx);

  return (
    <div className="flex h-screen overflow-hidden print:block print:h-auto print:overflow-visible">
      <div className="print:hidden">
        <Sidebar
          permissions={permissions}
          org={{
            name: org?.name ?? 'Your organization',
            planLabel,
            logoUrl: org?.logo_url ?? null,
            hasPlan: onPaidPlan,
          }}
        />
      </div>
      <div className="flex flex-1 flex-col overflow-hidden print:overflow-visible">
        <div className="print:hidden">
          <Topbar
            orgName={org?.name ?? 'Your organization'}
            userName={profile?.full_name ?? profile?.email ?? null}
            roleLabel={ctx.role ?? undefined}
            planLabel={planLabel}
            permissions={permissions}
          />
        </div>
        <div className="print:hidden">
          <TrialBanner status={trialStatus} />
        </div>
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-brand-50/40 via-muted/20 to-accent/20 p-4 lg:p-8 print:overflow-visible print:bg-transparent print:p-0">
          {children}
        </main>
      </div>
    </div>
  );
}
