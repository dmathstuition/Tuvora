'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { loginAction, type AuthActionState } from '../actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function LoginForm({ defaultRedirect = '/dashboard' }: { defaultRedirect?: string }) {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') ?? defaultRedirect;
  const [state, formAction, pending] = useActionState<AuthActionState, FormData>(loginAction, {});

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="redirect" value={redirect} />
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link href="/forgot-password" className="text-xs text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>

      {state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Logging in…' : 'Log in'}
      </Button>
    </form>
  );
}
