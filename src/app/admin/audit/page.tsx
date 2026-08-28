import type { Metadata } from 'next';
import { ScrollText } from 'lucide-react';
import { listAuditLogs } from '@/services/admin';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDistanceToNow } from 'date-fns';

export const metadata: Metadata = { title: 'Admin · Audit Logs' };

export default async function AdminAuditPage() {
  const logs = await listAuditLogs();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-sm text-muted-foreground">Significant actions recorded across the platform.</p>
      </div>

      {logs.length === 0 ? (
        <EmptyState icon={ScrollText} title="No audit events yet" description="Actions like learner creation, grading and billing changes are recorded here." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y">
              {logs.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="font-mono">
                      {l.action}
                    </Badge>
                    {l.orgName && <span className="text-sm text-muted-foreground">{l.orgName}</span>}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(l.createdAt), { addSuffix: true })}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
