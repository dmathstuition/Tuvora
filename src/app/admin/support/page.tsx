import type { Metadata } from 'next';
import { LifeBuoy } from 'lucide-react';
import { listSupportTickets, viewerIsSuperAdmin } from '@/services/admin';
import { getAuthContext } from '@/lib/auth/context';
import { isPlatformStaff } from '@/lib/permissions';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDistanceToNow } from 'date-fns';
import { ConfirmButton } from '@/components/ui/confirm-button';
import { deleteTicketAction } from '@/services/admin/actions';
import { TicketStatus } from './ticket-status';

export const metadata: Metadata = { title: 'Admin · Support' };

const statusVariant: Record<string, 'success' | 'warning' | 'secondary'> = {
  open: 'warning',
  pending: 'warning',
  resolved: 'success',
  closed: 'secondary',
};

const priorityVariant: Record<string, 'destructive' | 'warning' | 'secondary'> = {
  high: 'destructive',
  normal: 'warning',
  low: 'secondary',
};

export default async function AdminSupportPage() {
  const [tickets, ctx, canDelete] = await Promise.all([
    listSupportTickets(),
    getAuthContext(),
    viewerIsSuperAdmin(),
  ]);
  const canManage = !!ctx && isPlatformStaff(ctx);

  const open = tickets.filter((t) => t.status === 'open' || t.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Support Tickets</h1>
        <p className="text-sm text-muted-foreground">
          {tickets.length} tickets · {open} awaiting response.
        </p>
      </div>

      {tickets.length === 0 ? (
        <EmptyState icon={LifeBuoy} title="No tickets yet" description="Support requests from organizations appear here." />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Subject</th>
                  <th className="px-4 py-3 font-medium">Organization</th>
                  <th className="px-4 py-3 font-medium">Priority</th>
                  <th className="px-4 py-3 font-medium">Opened</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  {canDelete && <th className="px-4 py-3" />}
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium">{t.subject}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.orgName ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant={priorityVariant[t.priority] ?? 'secondary'} className="capitalize">
                        {t.priority}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDistanceToNow(new Date(t.createdAt), { addSuffix: true })}
                    </td>
                    <td className="px-4 py-3">
                      {canManage ? (
                        <TicketStatus ticketId={t.id} status={t.status} />
                      ) : (
                        <Badge variant={statusVariant[t.status] ?? 'secondary'} className="capitalize">
                          {t.status}
                        </Badge>
                      )}
                    </td>
                    {canDelete && (
                      <td className="px-4 py-3 text-right">
                        <form action={deleteTicketAction}>
                          <input type="hidden" name="id" value={t.id} />
                          <ConfirmButton
                            variant="outline"
                            label="Delete"
                            message={`Delete ticket "${t.subject}"? This cannot be undone.`}
                          />
                        </form>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
