'use client';

import { useActionState, useEffect, useRef } from 'react';
import { createShopItemAction, type ShopAdminState } from '@/services/rewards/shop';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function CreateItem({ disabled }: { disabled: boolean }) {
  const [state, action, pending] = useActionState<ShopAdminState, FormData>(createShopItemAction, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.success) ref.current?.reset();
  }, [state.success]);

  return (
    <form ref={ref} action={action} className="space-y-4">
      <fieldset disabled={disabled} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Item name</Label>
            <Input id="name" name="name" placeholder="Extra break time" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emoji">Emoji</Label>
            <Input id="emoji" name="emoji" placeholder="🎮" maxLength={4} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cost">Cost (pts)</Label>
            <Input id="cost" name="cost" type="number" min={0} placeholder="50" required />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="stock">Stock</Label>
            <Input id="stock" name="stock" type="number" min={0} placeholder="∞ if blank" />
          </div>
          <div className="space-y-2 sm:col-span-3">
            <Label htmlFor="description">Description</Label>
            <Input id="description" name="description" placeholder="What the learner gets" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? 'Adding…' : 'Add item'}
          </Button>
          {state.success && <p className="text-sm text-success">Added.</p>}
          {state.error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
          )}
        </div>
      </fieldset>
    </form>
  );
}
