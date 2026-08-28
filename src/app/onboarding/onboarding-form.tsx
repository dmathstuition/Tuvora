'use client';

import { useActionState } from 'react';
import { createOrganizationAction, type OnboardingState } from '@/services/organizations/onboarding';
import { ORGANIZATION_TYPES } from '@/constants/organizations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function OnboardingForm() {
  const [state, formAction, pending] = useActionState<OnboardingState, FormData>(
    createOrganizationAction,
    {},
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set up your organization</CardTitle>
        <CardDescription>
          Tell us about your tutoring so we can tailor Tuvora to you. You can change any of this
          later in settings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Business / tutoring name</Label>
            <Input id="name" name="name" placeholder="e.g. Bright Minds Tutoring" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ownerName">Your name</Label>
            <Input id="ownerName" name="ownerName" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Organization type</Label>
            <select
              id="type"
              name="type"
              defaultValue="independent_tutor"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {ORGANIZATION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input id="currency" name="currency" defaultValue="USD" maxLength={3} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input id="country" name="country" placeholder="US" maxLength={2} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="subjects">Subjects taught</Label>
            <Input id="subjects" name="subjects" placeholder="Maths, English, Science" />
            <p className="text-xs text-muted-foreground">Separate subjects with commas.</p>
          </div>

          {state.error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? 'Creating…' : 'Create organization & enter dashboard'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
