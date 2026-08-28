'use client';

import { useActionState, useState } from 'react';
import { User, Building2 } from 'lucide-react';
import { createOrganizationAction, type OnboardingState } from '@/services/organizations/onboarding';
import { COUNTRIES } from '@/constants/countries';
import { CURRENCIES, defaultCurrencyForCountry } from '@/constants/currencies';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const selectClass =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export function OnboardingForm() {
  const [state, formAction, pending] = useActionState<OnboardingState, FormData>(
    createOrganizationAction,
    {},
  );
  const [businessModel, setBusinessModel] = useState<'solo' | 'business'>('solo');
  const [country, setCountry] = useState('NG');
  const [currency, setCurrency] = useState('NGN');
  const [themeColor, setThemeColor] = useState('#4F46E5');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set up your tutoring</CardTitle>
        <CardDescription>
          A few details so we can tailor Tuvora — your billing currency, how you work, and how your
          learner portal should look. You can change any of this later.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          {/* Business model */}
          <div className="space-y-2">
            <Label>How do you run your tutoring?</Label>
            <input type="hidden" name="businessModel" value={businessModel} />
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  {
                    value: 'solo',
                    icon: User,
                    title: 'Solo tutor',
                    body: 'I teach learners myself.',
                  },
                  {
                    value: 'business',
                    icon: Building2,
                    title: 'Tutoring business',
                    body: 'I employ or manage other tutors.',
                  },
                ] as const
              ).map((opt) => {
                const Icon = opt.icon;
                const active = businessModel === opt.value;
                return (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => setBusinessModel(opt.value)}
                    className={cn(
                      'flex flex-col items-start gap-1 rounded-lg border p-4 text-left transition-colors',
                      active ? 'border-primary ring-1 ring-primary' : 'hover:bg-accent/50',
                    )}
                  >
                    <Icon className={cn('h-5 w-5', active ? 'text-primary' : 'text-muted-foreground')} />
                    <span className="text-sm font-semibold">{opt.title}</span>
                    <span className="text-xs text-muted-foreground">{opt.body}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Identity */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Business / tutoring name</Label>
              <Input id="name" name="name" placeholder="e.g. Bright Minds Tutoring" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerName">Your name</Label>
              <Input id="ownerName" name="ownerName" required />
            </div>
          </div>

          {/* Location + currency */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <select
                id="country"
                name="country"
                className={selectClass}
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                  setCurrency(defaultCurrencyForCountry(e.target.value));
                }}
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Billing currency</Label>
              <select
                id="currency"
                name="currency"
                className={selectClass}
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.symbol} {c.code} — {c.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                You&apos;ll be billed, and can collect payments, in this currency.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subjects">Subjects taught</Label>
            <Input id="subjects" name="subjects" placeholder="Maths, English, Science" />
            <p className="text-xs text-muted-foreground">Separate subjects with commas.</p>
          </div>

          {/* Portal look & feel */}
          <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
            <div>
              <p className="text-sm font-semibold">Learner portal</p>
              <p className="text-xs text-muted-foreground">
                How your learners and parents will see their portal.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="portalName">Portal display name</Label>
                <Input id="portalName" name="portalName" placeholder="Your academy name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="themeColor">Theme colour</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={themeColor}
                    onChange={(e) => setThemeColor(e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded-md border border-input bg-background"
                    aria-label="Theme colour picker"
                  />
                  <Input
                    name="themeColor"
                    value={themeColor}
                    onChange={(e) => setThemeColor(e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="portalWelcome">Welcome message</Label>
              <textarea
                id="portalWelcome"
                name="portalWelcome"
                rows={2}
                placeholder="A short greeting shown to learners when they sign in."
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
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
