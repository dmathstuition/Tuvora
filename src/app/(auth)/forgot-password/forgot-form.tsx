'use client';

import { useActionState } from 'react';
import { forgotPasswordAction, type AuthActionState } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState<AuthActionState, FormData>(
    forgotPasswordAction,
    {},
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>

      {state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      )}
      {state.message && (
        <p className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">{state.message}</p>
      )}

      <Button type="submit" className="w-full" disabled={pending || !!state.message}>
        {pending ? 'Sending…' : 'Send reset link'}
      </Button>
    </form>
  );
}
