import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getLearnerReport } from '@/services/reports';
import { LogoMark } from '@/components/brand/logo';
import { PrintButton } from './print-button';

export const metadata: Metadata = { title: 'Progress report' };

function pct(v: number | null): string {
  return v === null ? '—' : `${v}%`;
}

export default async function LearnerReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const report = await getLearnerReport(id);
  if (!report) notFound();

  const { orgName, generatedAt, learner, classes, metrics, attendance, grades } = report;
  const attendanceTotal =
    attendance.present + attendance.late + attendance.absent + attendance.excused;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Screen-only toolbar (hidden in print) */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          href={`/dashboard/learners/${learner.id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to profile
        </Link>
        <PrintButton />
      </div>

      {/* The report document */}
      <article className="rounded-lg border bg-card p-8 shadow-sm print:border-0 print:p-0 print:shadow-none">
        {/* Letterhead */}
        <header className="flex items-start justify-between border-b pb-5">
          <div className="flex items-center gap-3">
            <LogoMark className="h-9 w-9" />
            <div>
              <p className="text-lg font-bold text-brand-900 dark:text-foreground">{orgName}</p>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Progress report
              </p>
            </div>
          </div>
          <p className="text-right text-xs text-muted-foreground">
            Generated
            <br />
            {new Date(generatedAt).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </header>

        {/* Learner identity */}
        <section className="grid grid-cols-2 gap-4 py-5 text-sm">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Learner</p>
            <p className="text-base font-semibold">{learner.name}</p>
            {learner.email && <p className="text-muted-foreground">{learner.email}</p>}
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Classes</p>
            <p>{classes.length > 0 ? classes.map((c) => c.name).join(', ') : '—'}</p>
          </div>
        </section>

        {/* Headline metrics */}
        <section className="grid grid-cols-3 gap-3 py-2">
          {[
            { label: 'Average score', value: pct(metrics.avgScore) },
            { label: 'Attendance', value: pct(metrics.attendancePct) },
            { label: 'Completion', value: pct(metrics.completionPct) },
          ].map((m) => (
            <div key={m.label} className="rounded-md border p-4 text-center">
              <p className="text-2xl font-bold">{m.value}</p>
              <p className="text-xs text-muted-foreground">{m.label}</p>
            </div>
          ))}
        </section>

        {/* Attendance summary */}
        <section className="py-5">
          <h2 className="mb-2 text-sm font-semibold">Attendance summary</h2>
          {attendanceTotal === 0 ? (
            <p className="text-sm text-muted-foreground">No attendance recorded.</p>
          ) : (
            <div className="grid grid-cols-4 gap-3 text-center text-sm">
              {(
                [
                  ['Present', attendance.present],
                  ['Late', attendance.late],
                  ['Absent', attendance.absent],
                  ['Excused', attendance.excused],
                ] as const
              ).map(([label, n]) => (
                <div key={label} className="rounded-md border p-3">
                  <p className="text-lg font-semibold">{n}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Grades */}
        <section className="py-2">
          <h2 className="mb-2 text-sm font-semibold">
            Assignment results ({metrics.gradedCount} of {metrics.totalAssigned} graded)
          </h2>
          {grades.length === 0 ? (
            <p className="text-sm text-muted-foreground">No graded assignments in this period.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b text-left text-muted-foreground">
                <tr>
                  <th className="py-2 font-medium">Assignment</th>
                  <th className="py-2 font-medium">Class</th>
                  <th className="py-2 text-right font-medium">Score</th>
                  <th className="py-2 text-right font-medium">%</th>
                  <th className="hidden py-2 text-right font-medium sm:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {grades.map((g, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2 font-medium">{g.assignment}</td>
                    <td className="py-2 text-muted-foreground">{g.className ?? '—'}</td>
                    <td className="py-2 text-right">
                      {g.score}
                      {g.maxPoints ? ` / ${g.maxPoints}` : ''}
                    </td>
                    <td className="py-2 text-right font-medium">
                      {g.percentage !== null ? `${g.percentage}%` : '—'}
                    </td>
                    <td className="hidden py-2 text-right text-muted-foreground sm:table-cell">
                      {g.date ? new Date(g.date).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Tutor comments — blank space for handwritten/added notes */}
        <section className="pt-6">
          <h2 className="mb-2 text-sm font-semibold">Tutor comments</h2>
          <div className="min-h-24 rounded-md border border-dashed p-3 text-sm text-muted-foreground print:min-h-32">
            &nbsp;
          </div>
        </section>

        <footer className="mt-6 border-t pt-3 text-center text-xs text-muted-foreground">
          {orgName} · Generated by Tuvoria — Manage. Teach. Grow.
        </footer>
      </article>
    </div>
  );
}
