import type { Metadata } from 'next';
import Link from 'next/link';
import { BarChart3, FileBarChart } from 'lucide-react';
import { getAuthContext } from '@/lib/auth/context';
import { can } from '@/lib/permissions';
import { listLearners } from '@/services/learners';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Reports' };

/**
 * Reports hub. Today it offers per-learner progress reports (print/PDF-ready);
 * class and cohort reports plug in here as they land.
 */
export default async function ReportsPage() {
  const ctx = await getAuthContext();
  if (!ctx || !can(ctx, 'reports.view')) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Reports aren't available for your role"
        description="Ask an owner or admin for reporting access."
      />
    );
  }

  const { learners, total } = await listLearners(1, 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Generate a professional progress report for any learner — ready to print or share as a
          PDF with parents.
        </p>
      </div>

      {total === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No learners to report on yet"
          description="Add learners and record their assignments and attendance to generate progress reports."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Learner</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {learners.map((l) => (
                  <tr key={l.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium">
                      {l.first_name} {l.last_name}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{l.status}</td>
                    <td className="px-4 py-3 text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/dashboard/learners/${l.id}/report`}>
                          <FileBarChart className="h-4 w-4" /> Progress report
                        </Link>
                      </Button>
                    </td>
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
