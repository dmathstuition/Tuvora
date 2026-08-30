import { redirect } from 'next/navigation';
import { getUser, getProfile, getUserOrganizations } from '@/lib/auth/context';
import { isLinkedLearner } from '@/lib/auth/routing';
import { logoutAction } from '@/app/(auth)/actions';
import { Logo } from '@/components/brand/logo';
import { OnboardingForm } from './onboarding-form';

/**
 * Organization onboarding. Existing org members skip to the dashboard, and
 * learners are sent to their portal — onboarding is only for a first-time tutor.
 */
export default async function OnboardingPage() {
  const user = await getUser();
  if (!user) redirect('/login');

  const [orgs, profile] = await Promise.all([getUserOrganizations(), getProfile()]);
  if (orgs.length > 0) redirect('/dashboard');
  if (await isLinkedLearner()) redirect('/portal');

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container flex min-h-screen max-w-xl flex-col justify-center py-12">
        <div className="mb-8 flex justify-center">
          <Logo showTagline />
        </div>
        <OnboardingForm />
        {/* A signed-in user who really wanted to log in as someone else can escape here. */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Signed in as {profile?.email ?? 'your account'}.{' '}
          <form action={logoutAction} className="inline">
            <button type="submit" className="font-medium text-primary hover:underline">
              Not you? Log in with a different account
            </button>
          </form>
        </p>
      </div>
    </div>
  );
}
