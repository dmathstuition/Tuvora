'use client';

import { useActionState } from 'react';
import { updatePlatformFeaturesAction, type FeatureState } from '@/services/portal/features';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Row {
  key: string;
  label: string;
  group: string;
  status: string;
  available: boolean;
}

export function PlatformFeaturesForm({ features }: { features: Row[] }) {
  const [state, action, pending] = useActionState<FeatureState, FormData>(
    updatePlatformFeaturesAction,
    {},
  );
  const groups = [...new Set(features.map((f) => f.group))];

  return (
    <form action={action} className="space-y-6">
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
                  <span className="flex flex-1 items-center gap-2">
                    {f.label}
                    {f.status === 'soon' && (
                      <Badge variant="secondary" className="text-[10px]">
                        soon
                      </Badge>
                    )}
                  </span>
                  <input
                    type="checkbox"
                    name={`plat_${f.key}`}
                    defaultChecked={f.available}
                    className="h-4 w-4 accent-primary"
                  />
                </label>
              ))}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Save availability'}
        </Button>
        {state.success && <p className="text-sm text-success">Saved.</p>}
        {state.error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
        )}
      </div>
    </form>
  );
}
