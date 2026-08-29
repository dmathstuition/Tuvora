'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { signUpAction, type AuthActionState } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function SignupForm({
  invite,
  invitedEmail,
}: {
  invite?: string;
  invitedEmail?: string | null;
}) {
  const [state, formAction, pending] = useActionState<AuthActionState, FormData>(signUpAction, {});
  const isInvited = !!invite && !!invitedEmail;

  return (
    <form action={formAction} className="space-y-4">
      {invite && <input type="hidden" name="invite" value={invite} />}
      <div className="space-y-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" name="fullName" autoComplete="name" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={invitedEmail ?? undefined}
          readOnly={isInvited}
        />
        {isInvited && (
          <p className="text-xs text-muted-foreground">
            You&apos;ve been invited with this email — it&apos;s linked to your learner account.
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
        />
      </div>

      {state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state.message && (
        <p className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">{state.message}</p>
      )}

      <Button type="submit" className="w-full" disabled={pending || !!state.message}>
        {pending ? 'Creating account…' : 'Create account'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
