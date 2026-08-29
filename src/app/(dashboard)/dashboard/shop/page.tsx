import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Gift, Check, X, Package } from 'lucide-react';
import { getAuthContext } from '@/lib/auth/context';
import { can } from '@/lib/permissions';
import {
  listShopItems,
  listRedemptions,
  setShopItemActiveAction,
  decideRedemptionAction,
} from '@/services/rewards/shop';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { CreateItem } from './create-item';

export const metadata: Metadata = { title: 'Rewards shop' };

const STATUS: Record<string, 'success' | 'warning' | 'secondary' | 'destructive'> = {
  pending: 'warning',
  approved: 'secondary',
  fulfilled: 'success',
  rejected: 'destructive',
  cancelled: 'secondary',
};

export default async function ShopAdminPage() {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) redirect('/onboarding');
  const canManage = can(ctx, 'rewards.manage');

  const [items, redemptions] = await Promise.all([listShopItems(), listRedemptions()]);
  const pending = redemptions.filter((r) => r.status === 'pending');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Gift className="h-6 w-6" /> Rewards shop
        </h1>
        <p className="text-sm text-muted-foreground">
          Stock rewards your learners can redeem with the points they earn, and approve their
          requests.
        </p>
      </div>

      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Add a reward</CardTitle>
            <CardDescription>Leave stock blank for an unlimited item.</CardDescription>
          </CardHeader>
          <CardContent>
            <CreateItem disabled={!canManage} />
          </CardContent>
        </Card>
      )}

      {/* Pending approvals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Redemption requests {pending.length > 0 && <Badge variant="warning">{pending.length} pending</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {redemptions.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={Package} title="No redemptions yet" description="Learner redemptions will appear here for approval." />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Learner</th>
                  <th className="px-4 py-2 font-medium">Reward</th>
                  <th className="px-4 py-2 font-medium">Points</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {redemptions.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{r.learnerName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.itemName}</td>
                    <td className="px-4 py-3 text-muted-foreground">−{r.pointsSpent}</td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS[r.status] ?? 'secondary'}>{r.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canManage && r.status === 'pending' && (
                        <div className="flex justify-end gap-1.5">
                          <form action={decideRedemptionAction}>
                            <input type="hidden" name="id" value={r.id} />
                            <input type="hidden" name="decision" value="fulfilled" />
                            <Button type="submit" size="sm" variant="outline">
                              <Check className="h-4 w-4" /> Fulfil
                            </Button>
                          </form>
                          <form action={decideRedemptionAction}>
                            <input type="hidden" name="id" value={r.id} />
                            <input type="hidden" name="decision" value="rejected" />
                            <Button type="submit" size="sm" variant="ghost">
                              <X className="h-4 w-4" /> Reject
                            </Button>
                          </form>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Shop items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={Gift} title="No items yet" description="Add your first reward above." />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Item</th>
                  <th className="px-4 py-2 font-medium">Cost</th>
                  <th className="px-4 py-2 font-medium">Stock</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">
                      {it.emoji} {it.name}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{it.cost} pts</td>
                    <td className="px-4 py-3 text-muted-foreground">{it.stock ?? '∞'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={it.active ? 'success' : 'secondary'}>
                        {it.active ? 'Active' : 'Hidden'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {canManage && (
                        <form action={setShopItemActiveAction}>
                          <input type="hidden" name="id" value={it.id} />
                          <input type="hidden" name="active" value={(!it.active).toString()} />
                          <Button type="submit" size="sm" variant="outline">
                            {it.active ? 'Hide' : 'Show'}
                          </Button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
