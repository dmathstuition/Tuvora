import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Award } from 'lucide-react';
import { getAuthContext } from '@/lib/auth/context';
import { can } from '@/lib/permissions';
import { listCertificates, revokeCertificateAction } from '@/services/certificates';
import { CERTIFICATE_TYPES } from '@/constants/certificates';
import { listLearners } from '@/services/learners';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { IssueForm } from './issue-form';

export const metadata: Metadata = { title: 'Certificates' };

export default async function CertificatesAdminPage() {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) redirect('/onboarding');
  const canIssue = can(ctx, 'reports.generate');

  const [certs, learnerList] = await Promise.all([listCertificates(), listLearners(1, 100)]);
  const learners = learnerList.learners.map((l) => ({
    id: l.id,
    name: `${l.first_name} ${l.last_name ?? ''}`.trim(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Award className="h-6 w-6" /> Certificates
        </h1>
        <p className="text-sm text-muted-foreground">
          Award certificates to learners — they can view and print them from their portal.
        </p>
      </div>

      {canIssue && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Issue a certificate</CardTitle>
            <CardDescription>Pick a learner, a type and a title.</CardDescription>
          </CardHeader>
          <CardContent>
            <IssueForm learners={learners} disabled={!canIssue} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Issued certificates</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {certs.length === 0 ? (
            <div className="p-6">
              <EmptyState icon={Award} title="No certificates yet" description="Issue your first certificate above." />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Learner</th>
                  <th className="px-4 py-2 font-medium">Title</th>
                  <th className="px-4 py-2 font-medium">Type</th>
                  <th className="px-4 py-2 font-medium">Issued</th>
                  <th className="px-4 py-2 font-medium">Serial</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {certs.map((c) => {
                  const meta = CERTIFICATE_TYPES.find((t) => t.value === c.type);
                  return (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium">{c.learnerName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{c.title}</td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary">{meta?.label ?? c.type}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(c.issuedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{c.serial}</td>
                      <td className="px-4 py-3 text-right">
                        {canIssue && !c.revokedAt && (
                          <form action={revokeCertificateAction}>
                            <input type="hidden" name="id" value={c.id} />
                            <Button type="submit" size="sm" variant="ghost">
                              Revoke
                            </Button>
                          </form>
                        )}
                        {c.revokedAt && <Badge variant="destructive">Revoked</Badge>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
