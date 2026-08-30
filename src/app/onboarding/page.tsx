import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth/context';
import { isLinkedLearner } from '@/lib/auth/routing';
import { logoutAction } from '@/app/(auth)/actions';
import { ensureOnboardingOrg, getOnboardingData } from '@/services/organizations/onboarding';
import { OnboardingWizard } from './onboarding-wizard';

/**
 * First-run onboarding. A learner belongs in their portal; everyone else runs
 * the setup wizard. The wizard's progress is saved server-side, so leaving and
 * returning resumes at the right step. A completed org skips straight to the
 * dashboard.
 */
export default async function OnboardingPage() {
  const user = await getUser();
  if (!user) redirect('/login');
  if (await isLinkedLearner()) redirect('/portal');

  const { completed } = await ensureOnboardingOrg();
  if (completed) redirect('/dashboard');

  const [data, profile] = await Promise.all([getOnboardingData(), getUser()]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50/50 via-white to-accent/20">
      <OnboardingWizard initial={data} />
      <div className="pb-8 text-center text-xs text-muted-foreground">
        Signed in as {profile?.email ?? 'your account'}.{' '}
        <form action={logoutAction} className="inline">
          <button type="submit" className="font-medium text-primary hover:underline">
            Not you? Log in with a different account
          </button>
        </form>
      </div>
    </div>
  );
}
