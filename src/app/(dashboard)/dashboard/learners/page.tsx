import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Users } from 'lucide-react';
import { getAuthContext } from '@/lib/auth/context';
import { listLearners, type LearnerBillingBadge } from '@/services/learners';
import { getLearnerBillingSummary } from '@/services/learner-billing';
import { can } from '@/lib/permissions';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { formatMoney, initials } from '@/lib/utils';
import { AddLearnerButton } from './add-learner';
import { ActivateLearner } from './activate-learner';

export const metadata: Metadata = { title: 'Learners' };

const billingLabel: Record<LearnerBillingBadge, { text: string; variant: 'success' | 'warning' | 'destructive' }> = {
  trial: { text: 'Free trial', variant: 'success' },
  paid: { text: 'Paid', variant: 'success' },
  unpaid: { text: 'Payment required', variant: 'warning' },
};

export default async function LearnersPage() {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) redirect('/onboarding');
  const organizationId = ctx.organizationId;
  const canCreate = can(ctx, 'learners.create');
  const canBill = can(ctx, 'billing.manage');

  const [{ learners, total }, summary] = await Promise.all([
    listLearners(),
    getLearnerBillingSummary(organizationId),
  ]);

  const priceLabel = formatMoney(summary.price.amountMinor, summary.price.currency);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Learners</h1>
          <p className="text-sm text-muted-foreground">
            {summary.open} open · {priceLabel}/learner per month
            {!summary.trialUsed && ' · 1 free-trial learner available'}
          </p>
        </div>
        {canCreate && <AddLearnerButton />}
      </div>

      <div className="rounded-md border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        You&apos;re billed per learner, per month. Your first learner is free for one month; every
        other learner&apos;s account opens once their month is paid.
      </div>

      {total === 0 ? (
        <EmptyState
          icon={Users}
          title="No learners yet"
          description="Add your first learner — the first one is free for a month — to start managing their classes, assignments and progress."
          action={canCreate ? <AddLearnerButton /> : undefined}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">Email</th>
                  <th className="px-4 py-3 font-medium">Billing</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {learners.map((l) => {
                  const b = billingLabel[l.billing];
                  return (
                    <tr key={l.id} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="px-4 py-3 font-medium">
                        <Link href={`/dashboard/learners/${l.id}`} className="flex items-center gap-3 hover:underline">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-900 text-xs font-semibold text-white">
                            {l.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={l.avatar_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              initials(`${l.first_name} ${l.last_name ?? ''}`)
                            )}
                          </span>
                          {l.first_name} {l.last_name}
                        </Link>
                      </td>
                      <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                        {l.email ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={b.variant}>{b.text}</Badge>
                        {l.billing !== 'unpaid' && l.periodEnd && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            until {new Date(l.periodEnd).toLocaleDateString()}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {l.billing === 'unpaid' && canBill && (
                          <ActivateLearner learnerId={l.id} priceLabel={priceLabel} />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
