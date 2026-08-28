import type { Metadata } from 'next';
import { Building2, GraduationCap, BookOpen, FileText, Sparkles, Users } from 'lucide-react';
import { getUsageAnalytics } from '@/services/admin';
import { StatCard } from '@/components/dashboard/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = { title: 'Admin · Usage Analytics' };

export default async function AdminUsagePage() {
  const u = await getUsageAnalytics();
  const maxAdoption = Math.max(1, ...u.featureAdoption.map((f) => f.plans));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Usage Analytics</h1>
        <p className="text-sm text-muted-foreground">How Tuvora is used across the platform.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Organizations" value={u.organizations} hint={`${u.activeOrganizations} active`} icon={Building2} />
        <StatCard label="Open learners" value={u.openLearners} hint={`${u.learners} total`} icon={Users} />
        <StatCard label="Classes" value={u.classes} icon={GraduationCap} />
        <StatCard label="Assignments" value={u.assignments} icon={FileText} />
        <StatCard label="Reward events" value={u.rewardEvents} icon={Sparkles} />
        <StatCard label="Learners" value={u.learners} icon={BookOpen} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Feature adoption (plans granting each feature)</CardTitle>
        </CardHeader>
        <CardContent>
          {u.featureAdoption.length === 0 ? (
            <p className="text-sm text-muted-foreground">No features attached to plans yet.</p>
          ) : (
            <ul className="space-y-3">
              {u.featureAdoption.map((f) => (
                <li key={f.name} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{f.name}</span>
                    <span className="text-muted-foreground">{f.plans} plans</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary" style={{ width: `${(f.plans / maxAdoption) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
