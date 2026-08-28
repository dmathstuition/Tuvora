import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, TrendingUp, FileBarChart } from 'lucide-react';
import { getLearnerProfile } from '@/services/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/dashboard/stat-card';
import { PerformanceChart } from '@/components/dashboard/performance-chart';
import { EmptyState } from '@/components/ui/empty-state';
import { initials } from '@/lib/utils';

export const metadata: Metadata = { title: 'Learner' };

function pct(v: number | null): string {
  return v === null ? '—' : `${v}%`;
}

export default async function LearnerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await getLearnerProfile(id);
  if (!profile) notFound();

  const { learner, classes, metrics, recentGrades, attendance, scoreTrend } = profile;
  const hasTrend = scoreTrend.some((t) => t.value !== null);
  const attendanceTotal =
    attendance.present + attendance.late + attendance.absent + attendance.excused;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/learners"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Learners
        </Link>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-900 text-base font-semibold text-white">
              {initials(learner.name)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{learner.name}</h1>
                <Badge variant={learner.status === 'active' ? 'success' : 'secondary'}>
                  {learner.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {learner.email ?? 'No email'} · Enrolled{' '}
                {new Date(learner.enrolled_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <Button asChild variant="outline">
            <Link href={`/dashboard/learners/${learner.id}/report`}>
              <FileBarChart className="h-4 w-4" /> Progress report
            </Link>
          </Button>
        </div>
      </div>

      {/* Headline metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Average score" value={pct(metrics.avgScore)} hint={`${metrics.gradedCount} graded`} />
        <StatCard label="Attendance" value={pct(metrics.attendancePct)} hint={`${attendanceTotal} sessions`} />
        <StatCard
          label="Assignment completion"
          value={pct(metrics.completionPct)}
          hint={`${metrics.totalAssigned} assigned`}
        />
        <StatCard label="Classes" value={classes.length} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Score trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" /> Score trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasTrend ? (
              <PerformanceChart data={scoreTrend} />
            ) : (
              <div className="flex h-64 items-center justify-center text-center text-sm text-muted-foreground">
                Grade this learner&apos;s assignments to see their score trend.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Attendance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {attendanceTotal === 0 ? (
              <p className="text-muted-foreground">No attendance recorded yet.</p>
            ) : (
              (
                [
                  ['Present', attendance.present],
                  ['Late', attendance.late],
                  ['Absent', attendance.absent],
                  ['Excused', attendance.excused],
                ] as const
              ).map(([label, n]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{n}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent grades */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent grades</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentGrades.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  title="No grades yet"
                  description="Graded assignments will appear here."
                />
              </div>
            ) : (
              <table className="w-full text-sm">
                <tbody>
                  {recentGrades.map((g, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium">{g.assignment}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {g.score}
                        {g.maxPoints ? ` / ${g.maxPoints}` : ''}
                        {g.percentage !== null && (
                          <span className="ml-2 font-medium text-foreground">{g.percentage}%</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Classes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Classes</CardTitle>
          </CardHeader>
          <CardContent>
            {classes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Not enrolled in any classes yet.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {classes.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/dashboard/classes/${c.id}`}
                      className="text-primary hover:underline"
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
