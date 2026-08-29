'use client';

import { useActionState } from 'react';
import { updateLearnerFeaturesAction, type FeatureState } from '@/services/portal/features';
import { Button } from '@/components/ui/button';

interface Row {
  key: string;
  label: string;
  group: string;
  enabled: boolean;
  platformAvailable: boolean;
}

export function StudentAppForm({ features, disabled }: { features: Row[]; disabled: boolean }) {
  const [state, action, pending] = useActionState<FeatureState, FormData>(
    updateLearnerFeaturesAction,
    {},
  );
  const groups = [...new Set(features.map((f) => f.group))];

  return (
    <form action={action} className="space-y-5">
      <fieldset disabled={disabled} className="space-y-5">
        {groups.map((g) => (
          <div key={g}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{g}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {features
                .filter((f) => f.group === g)
                .map((f) => (
                  <label
                    key={f.key}
                    className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm"
                  >
                    <span className="flex-1">
                      {f.label}
                      {!f.platformAvailable && (
                        <span className="ml-2 text-xs text-muted-foreground">(off platform-wide)</span>
                      )}
                    </span>
                    <input
                      type="checkbox"
                      name={`feat_${f.key}`}
                      defaultChecked={f.enabled && f.platformAvailable}
                      disabled={!f.platformAvailable}
                      className="h-4 w-4 accent-primary"
                    />
                  </label>
                ))}
            </div>
          </div>
        ))}
      </fieldset>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={disabled || pending}>
          {pending ? 'Saving…' : 'Save student app'}
        </Button>
        {state.success && <p className="text-sm text-success">Saved.</p>}
        {state.error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
        )}
      </div>
    </form>
  );
}
