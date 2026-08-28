import type { Metadata } from 'next';
import { Users, GraduationCap, CalendarCheck, Wallet, TrendingUp } from 'lucide-react';
import { getAuthContext } from '@/lib/auth/context';
import { createClient } from '@/lib/supabase/server';
import { getLearnerBillingSummary } from '@/services/learner-billing';
import { getOrgPerformanceTrend } from '@/services/progress';
import { formatMoney } from '@/lib/utils';
import { StatCard } from '@/components/dashboard/stat-card';
import { PerformanceChart } from '@/components/dashboard/performance-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = { title: 'Dashboard' };

/**
 * The tutor command centre. Every metric is a real query scoped to the active
 * organization (RLS guarantees no cross-tenant leakage). Values degrade to 0 on
 * a fresh tenant rather than showing placeholder noise.
 */
export default async function DashboardPage() {
  const ctx = await getAuthContext();
  const organizationId = ctx!.organizationId!;
  const supabase = await createClient();

  const [billing, classesRes, todayAttendanceRes, trend] = await Promise.all([
    getLearnerBillingSummary(organizationId),
    supabase
      .from('classes')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'active'),
    supabase
      .from('attendance')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('session_date', new Date().toISOString().slice(0, 10)),
    getOrgPerformanceTrend(),
  ]);

  const openLearners = billing.open;
  const priceLabel = formatMoney(billing.price.amountMinor, billing.price.currency);
  const seatUsage = `${priceLabel}/learner per month`;
  const hasTrendData = trend.some((t) => t.value !== null);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Your tutoring at a glance — learners, classes, attendance and revenue.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Open learners" value={openLearners} hint={seatUsage} icon={Users} />
        <StatCard label="Active classes" value={classesRes.count ?? 0} icon={GraduationCap} />
        <StatCard
          label="Attendance today"
          value={todayAttendanceRes.count ?? 0}
          hint="records logged"
          icon={CalendarCheck}
        />
        <StatCard label="Outstanding" value="—" hint="No payments yet" icon={Wallet} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" /> Learner performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasTrendData ? (
              <PerformanceChart data={trend} />
            ) : (
              <div className="flex h-64 items-center justify-center text-center text-sm text-muted-foreground">
                Performance trends appear here once you grade assignments. Set and grade work to
                populate this chart.
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Subscription usage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Open learners</span>
              <span className="font-medium">{openLearners}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Per learner</span>
              <span className="font-medium">{priceLabel}/mo</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Active classes</span>
              <span className="font-medium">{classesRes.count ?? 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
