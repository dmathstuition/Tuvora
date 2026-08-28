import { redirect } from 'next/navigation';
import { getUser, getUserOrganizations } from '@/lib/auth/context';
import { Logo } from '@/components/brand/logo';
import { OnboardingForm } from './onboarding-form';

/**
 * Organization onboarding. If the user already belongs to an organization we
 * skip straight to the dashboard — onboarding is only for first-time setup.
 */
export default async function OnboardingPage() {
  const user = await getUser();
  if (!user) redirect('/login');

  const orgs = await getUserOrganizations();
  if (orgs.length > 0) redirect('/dashboard');

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
