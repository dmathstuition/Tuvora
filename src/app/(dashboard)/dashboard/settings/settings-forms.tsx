'use client';

import { useActionState, useState } from 'react';
import {
  updateOrgProfileAction,
  updateBrandingAction,
  type SettingsState,
  type OrgSettings,
} from '@/services/organizations/settings';
import { COUNTRIES } from '@/constants/countries';
import { CURRENCIES } from '@/constants/currencies';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const selectClass =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

function Saved({ state }: { state: SettingsState }) {
  if (state.success) return <p className="text-sm text-success">Saved.</p>;
  if (state.error)
    return (
      <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
    );
  return null;
}

export function OrgProfileForm({ settings, disabled }: { settings: OrgSettings; disabled: boolean }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(
    updateOrgProfileAction,
    {},
  );
  const [employs, setEmploys] = useState(settings.employsTutors);

  return (
    <form action={action} className="space-y-4">
      <fieldset disabled={disabled} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Business name</Label>
            <Input id="name" name="name" defaultValue={settings.name} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input id="timezone" name="timezone" defaultValue={settings.timezone} />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <select id="country" name="country" defaultValue={settings.country ?? ''} className={selectClass}>
              <option value="">—</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Billing currency</Label>
            <select id="currency" name="currency" defaultValue={settings.currency} className={selectClass}>
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.symbol} {c.code}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="subjects">Subjects</Label>
          <Input id="subjects" name="subjects" defaultValue={settings.subjects.join(', ')} placeholder="Maths, English" />
          <p className="text-xs text-muted-foreground">Comma-separated.</p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="employsTutors"
            checked={employs}
            onChange={(e) => setEmploys(e.target.checked)}
            className="h-4 w-4"
          />
          This organization employs / manages other tutors
        </label>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? 'Saving…' : 'Save changes'}
          </Button>
          <Saved state={state} />
        </div>
      </fieldset>
    </form>
  );
}

export function BrandingForm({ settings, disabled }: { settings: OrgSettings; disabled: boolean }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(updateBrandingAction, {});
  const [color, setColor] = useState(settings.brandColor ?? '#4F46E5');

  return (
    <form action={action} className="space-y-4">
      <fieldset disabled={disabled} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="portalName">Portal display name</Label>
            <Input id="portalName" name="portalName" defaultValue={settings.portal.displayName} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="brandColor">Brand colour</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-14 cursor-pointer rounded-md border border-input bg-background"
                aria-label="Brand colour picker"
              />
              <Input name="brandColor" value={color} onChange={(e) => setColor(e.target.value)} className="font-mono" />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="portalWelcome">Portal welcome message</Label>
          <textarea
            id="portalWelcome"
            name="portalWelcome"
            rows={2}
            defaultValue={settings.portal.welcome ?? ''}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? 'Saving…' : 'Save branding'}
          </Button>
          <Saved state={state} />
        </div>
      </fieldset>
    </form>
  );
}
