import Link from 'next/link';
import { ResetPasswordForm } from './reset-form';

export default function ResetPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight">Set a new password</h1>
        <p className="text-sm text-muted-foreground">
          Choose a new password for your account. You&apos;ll be signed in once it&apos;s saved.
        </p>
      </div>

      <ResetPasswordForm />

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-primary hover:underline">
          Back to log in
        </Link>
      </p>
    </div>
  );
}
