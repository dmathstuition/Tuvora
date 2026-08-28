'use client';

import { useActionState, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { createCouponAction, type AdminActionState } from '@/services/admin/actions';
import { CURRENCIES } from '@/constants/currencies';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const selectClass =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

export function CouponForm() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<'percent' | 'fixed'>('percent');
  const [state, action, pending] = useActionState<AdminActionState, FormData>(
    createCouponAction,
    {},
  );
  useEffect(() => {
    if (state.success) setOpen(false);
  }, [state.success]);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" /> New coupon
      </Button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold">New coupon</h2>
            <form action={action} className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input id="code" name="code" placeholder="WELCOME20" className="font-mono uppercase" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="discountType">Type</Label>
                  <select
                    id="discountType"
                    name="discountType"
                    value={type}
                    onChange={(e) => setType(e.target.value as 'percent' | 'fixed')}
                    className={selectClass}
                  >
                    <option value="percent">Percent %</option>
                    <option value="fixed">Fixed amount</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discountValue">
                    {type === 'percent' ? 'Percent (1–100)' : 'Amount (minor units)'}
                  </Label>
                  <Input id="discountValue" name="discountValue" type="number" min={1} required />
                </div>
              </div>
              {type === 'fixed' && (
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <select id="currency" name="currency" className={selectClass}>
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="maxRedemptions">Max redemptions</Label>
                  <Input id="maxRedemptions" name="maxRedemptions" type="number" min={1} placeholder="∞" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiresAt">Expires</Label>
                  <Input id="expiresAt" name="expiresAt" type="date" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" name="description" />
              </div>
              {state.error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
              )}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? 'Creating…' : 'Create coupon'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
