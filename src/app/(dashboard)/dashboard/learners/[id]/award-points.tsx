'use client';

import { useActionState, useEffect, useState } from 'react';
import { Award } from 'lucide-react';
import { awardPointsAction, type AwardState } from '@/services/rewards';
import {
  REWARD_CATEGORIES,
  SANCTION_CATEGORIES,
  REWARD_POINTS,
  SANCTION_POINTS,
} from '@/constants/gamification';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export function AwardPoints({ learnerId }: { learnerId: string }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<'reward' | 'sanction'>('reward');
  const [points, setPoints] = useState(10);
  const [state, formAction, pending] = useActionState<AwardState, FormData>(
    awardPointsAction,
    {},
  );

  useEffect(() => {
    if (state.success) setOpen(false);
  }, [state.success]);

  const categories = kind === 'reward' ? REWARD_CATEGORIES : SANCTION_CATEGORIES;
  const quick = kind === 'reward' ? REWARD_POINTS : SANCTION_POINTS;

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Award className="h-4 w-4" /> Award / sanction
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold">Award points</h2>
            <form action={formAction} className="mt-4 space-y-4">
              <input type="hidden" name="learnerId" value={learnerId} />
              <input type="hidden" name="kind" value={kind} />
              <input type="hidden" name="points" value={points} />

              {/* Reward vs sanction */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setKind('reward')}
                  className={cn(
                    'rounded-md border px-3 py-2 text-sm font-medium',
                    kind === 'reward'
                      ? 'border-transparent bg-success text-success-foreground'
                      : 'hover:bg-muted',
                  )}
                >
                  🌟 Reward
                </button>
                <button
                  type="button"
                  onClick={() => setKind('sanction')}
                  className={cn(
                    'rounded-md border px-3 py-2 text-sm font-medium',
                    kind === 'sanction'
                      ? 'border-transparent bg-destructive text-destructive-foreground'
                      : 'hover:bg-muted',
                  )}
                >
                  ⚠️ Sanction
                </button>
              </div>

              <div className="space-y-2">
                <Label>Points</Label>
                <div className="flex gap-2">
                  {quick.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setPoints(q)}
                      className={cn(
                        'flex-1 rounded-md border py-2 text-sm font-semibold',
                        points === q ? 'border-primary ring-1 ring-primary' : 'hover:bg-muted',
                      )}
                    >
                      {kind === 'sanction' ? '−' : '+'}
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  name="category"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {categories.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.emoji} {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Note (optional)</Label>
                <input
                  id="reason"
                  name="reason"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="e.g. Excellent effort in class"
                />
              </div>

              {state.error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {state.error}
                </p>
              )}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? 'Saving…' : kind === 'reward' ? 'Award points' : 'Apply sanction'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
