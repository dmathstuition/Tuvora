import { getInviteEmail } from '@/services/portal/invites';
import { SignupForm } from './signup-form';

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  const { invite } = await searchParams;
  const invitedEmail = invite ? await getInviteEmail(invite) : null;
  const isInvited = !!invite && !!invitedEmail;

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight">
          {isInvited ? 'Join your learner portal' : 'Start your free trial'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isInvited
            ? 'Create your account to access your classes, progress and rewards.'
            : 'Create your account — no credit card required.'}
        </p>
      </div>

      <SignupForm invite={invite} invitedEmail={invitedEmail} />
    </div>
  );
}
