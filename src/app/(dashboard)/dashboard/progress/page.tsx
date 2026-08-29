import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { TrendingUp } from 'lucide-react';
import { getAuthContext } from '@/lib/auth/context';
import { getOrgPerformanceTrend } from '@/services/progress';
import { listLearners } from '@/services/learners';
import { PerformanceChart } from '@/components/dashboard/performance-chart';
import { SectionCard, EmptyPanel } from '@/components/dashboard/widgets';
import { Badge } from '@/components/ui/badge';
import { initials } from '@/lib/utils';

export const metadata: Metadata = { title: 'Progress' };

export default async function ProgressPage() {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) redirect('/onboarding');

  const [trend, learners] = await Promise.all([getOrgPerformanceTrend(), listLearners(1, 50)]);
  const hasTrend = trend.some((t) => t.value !== null);

  return (
    <div className="space-y-6 pb-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Progress</h1>
        <p className="text-sm text-muted-foreground">
          Track how your learners are progressing over time.
        </p>
      </div>

      <SectionCard title="Learner performance trend" icon={TrendingUp}>
        {hasTrend ? (
          <PerformanceChart data={trend} />
        ) : (
          <EmptyPanel
            icon={TrendingUp}
            title="No performance data yet"
            description="Grade assignments and assessments to see performance trends here."
            ctaLabel="Go to Assignments"
            ctaHref="/dashboard/assignments"
          />
        )}
      </SectionCard>

      <SectionCard title="Learners" bodyClassName="p-0">
        {learners.learners.length === 0 ? (
          <div className="p-5">
            <EmptyPanel
              icon={TrendingUp}
              title="No learners yet"
              description="Add learners to start tracking their progress."
              ctaLabel="Add Learner"
              ctaHref="/dashboard/learners"
            />
          </div>
        ) : (
          <ul className="divide-y">
            {learners.learners.map((l) => {
              const name = `${l.first_name} ${l.last_name ?? ''}`.trim();
              return (
                <li key={l.id}>
                  <Link
                    href={`/dashboard/learners/${l.id}`}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-accent/40"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-900 text-xs font-semibold text-white">
                      {initials(name)}
                    </span>
                    <span className="flex-1 text-sm font-medium">{name}</span>
                    <Badge variant={l.status === 'active' ? 'success' : 'secondary'}>{l.status}</Badge>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
