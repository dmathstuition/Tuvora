'use client';

import { useActionState, useRef, useEffect } from 'react';
import { changePasswordAction, type AuthActionState } from '@/app/(auth)/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState<AuthActionState, FormData>(
    changePasswordAction,
    {},
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.message) formRef.current?.reset();
  }, [state.message]);

  return (
    <form action={formAction} ref={formRef} className="max-w-md space-y-4">
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Current password</Label>
        <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm new</Label>
          <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required />
        </div>
      </div>

      {state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      )}
      {state.message && (
        <p className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">{state.message}</p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Change password'}
      </Button>
    </form>
  );
}
