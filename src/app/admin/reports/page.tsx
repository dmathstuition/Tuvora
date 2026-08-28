import type { Metadata } from 'next';
import { Building2, CreditCard, Wallet, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Admin · Reports' };

const reports = [
  {
    type: 'organizations',
    icon: Building2,
    title: 'Organizations report',
    description: 'Every organization with learner and staff counts, currency and status.',
  },
  {
    type: 'subscriptions',
    icon: CreditCard,
    title: 'Subscriptions report',
    description: 'All subscriptions with plan, status, interval and renewal date.',
  },
  {
    type: 'payments',
    icon: Wallet,
    title: 'Payments report',
    description: 'Platform payments with amount, currency, status and date.',
  },
];

export default function AdminReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Export platform data as CSV for finance and analysis.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reports.map((r) => {
          const Icon = r.icon;
          return (
            <Card key={r.type}>
              <CardContent className="flex h-full flex-col pt-6">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{r.title}</h3>
                <p className="mt-1 flex-1 text-sm text-muted-foreground">{r.description}</p>
                <Button asChild variant="outline" className="mt-4 w-full">
                  {/* Native download of a server-generated CSV. */}
                  <a href={`/api/admin/export/${r.type}`} download>
                    <Download className="h-4 w-4" /> Download CSV
                  </a>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
