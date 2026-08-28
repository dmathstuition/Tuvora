'use client';

import { useActionState } from 'react';
import { toggleCouponAction, type AdminActionState } from '@/services/admin/actions';
import { Button } from '@/components/ui/button';

export function CouponToggle({ couponId, active }: { couponId: string; active: boolean }) {
  const [, action, pending] = useActionState<AdminActionState, FormData>(toggleCouponAction, {});
  return (
    <form action={action}>
      <input type="hidden" name="couponId" value={couponId} />
      <input type="hidden" name="active" value={(!active).toString()} />
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {active ? 'Disable' : 'Enable'}
      </Button>
    </form>
  );
}
