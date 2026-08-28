import { redirect } from 'next/navigation';
import { getUser, getUserOrganizations } from '@/lib/auth/context';
import { isLinkedLearner } from '@/lib/auth/routing';
import { Logo } from '@/components/brand/logo';
import { OnboardingForm } from './onboarding-form';

/**
 * Organization onboarding. Existing org members skip to the dashboard, and
 * learners are sent to their portal — onboarding is only for a first-time tutor.
 */
export default async function OnboardingPage() {
  const user = await getUser();
  if (!user) redirect('/login');

  const orgs = await getUserOrganizations();
  if (orgs.length > 0) redirect('/dashboard');
  if (await isLinkedLearner()) redirect('/portal');

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container flex min-h-screen max-w-xl flex-col justify-center py-12">
        <div className="mb-8 flex justify-center">
          <Logo showTagline />
        </div>
        <OnboardingForm />
      </div>
    </div>
  );
}
