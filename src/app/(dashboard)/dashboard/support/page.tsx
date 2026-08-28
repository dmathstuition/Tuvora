import type { Metadata } from 'next';
import { listMyTickets } from '@/services/support';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { SupportForm } from './support-form';

export const metadata: Metadata = { title: 'Support' };

const statusVariant: Record<string, 'success' | 'warning' | 'secondary'> = {
  open: 'warning',
  pending: 'warning',
  resolved: 'success',
  closed: 'secondary',
};

export default async function SupportPage() {
  const tickets = await listMyTickets();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Support</h1>
        <p className="text-sm text-muted-foreground">
          Need a hand? Send us a message and track your requests here.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contact support</CardTitle>
          <CardDescription>We typically respond within one business day.</CardDescription>
        </CardHeader>
        <CardContent>
          <SupportForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your requests ({tickets.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {tickets.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-muted-foreground">No requests yet.</p>
          ) : (
            <ul className="divide-y">
              {tickets.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{t.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(t.createdAt), { addSuffix: true })} · {t.priority}
                    </p>
                  </div>
                  <Badge variant={statusVariant[t.status] ?? 'secondary'} className="capitalize">
                    {t.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
