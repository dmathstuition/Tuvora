import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ClipboardCheck } from 'lucide-react';
import { getAuthContext } from '@/lib/auth/context';
import { createClient } from '@/lib/supabase/server';
import { SectionCard, EmptyPanel } from '@/components/dashboard/widgets';

export const metadata: Metadata = { title: 'Grades' };

export default async function GradesPage() {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) redirect('/onboarding');
  const orgId = ctx.organizationId;
  const supabase = await createClient();

  const { data: subs } = await supabase
    .from('assignment_submissions')
    .select('id, score, graded_at, assignment_id, learner_id')
    .eq('organization_id', orgId)
    .eq('status', 'graded')
    .order('graded_at', { ascending: false })
    .limit(60);
  const rows = subs ?? [];

  const [assignRes, learnerRes] = await Promise.all([
    rows.length
      ? supabase
          .from('assignments')
          .select('id, title, max_points')
          .in('id', rows.map((r) => r.assignment_id))
      : Promise.resolve({ data: [] as { id: string; title: string; max_points: number | null }[] }),
    rows.length
      ? supabase
          .from('learners')
          .select('id, first_name, last_name')
          .in('id', rows.map((r) => r.learner_id))
      : Promise.resolve({ data: [] as { id: string; first_name: string; last_name: string | null }[] }),
  ]);
  const aById = new Map((assignRes.data ?? []).map((a) => [a.id, a]));
  const lById = new Map((learnerRes.data ?? []).map((l) => [l.id, l]));

  return (
    <div className="space-y-6 pb-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Grades</h1>
        <p className="text-sm text-muted-foreground">Recently graded work across your organization.</p>
      </div>

      <SectionCard title="Gradebook" icon={ClipboardCheck} bodyClassName={rows.length ? 'p-0' : undefined}>
        {rows.length === 0 ? (
          <EmptyPanel
            icon={ClipboardCheck}
            title="No grades yet"
            description="Once you grade assignment submissions, they'll appear here."
            ctaLabel="Go to Assignments"
            ctaHref="/dashboard/assignments"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="px-5 py-2 font-medium">Learner</th>
                  <th className="px-5 py-2 font-medium">Assignment</th>
                  <th className="px-5 py-2 font-medium">Score</th>
                  <th className="px-5 py-2 font-medium">Graded</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const a = aById.get(r.assignment_id);
                  const l = lById.get(r.learner_id);
                  const name = l ? `${l.first_name} ${l.last_name ?? ''}`.trim() : 'Learner';
                  const pct =
                    r.score != null && a?.max_points ? Math.round((r.score / a.max_points) * 100) : null;
                  return (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="px-5 py-3 font-medium">{name}</td>
                      <td className="px-5 py-3 text-muted-foreground">{a?.title ?? '—'}</td>
                      <td className="px-5 py-3">
                        {r.score ?? '—'}
                        {a?.max_points ? ` / ${a.max_points}` : ''}
                        {pct != null && <span className="ml-2 font-medium">{pct}%</span>}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {r.graded_at ? new Date(r.graded_at).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
