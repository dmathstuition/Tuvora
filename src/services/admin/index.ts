import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/auth/context';
import { isPlatformStaff, isSuperAdmin } from '@/lib/permissions';
import { startOfMonth, subMonths, format } from 'date-fns';

/**
 * Platform-admin data services. Every read runs through the signed-in user's
 * client, so RLS is the gate: only a super admin's policies expose cross-tenant
 * data. The /admin layout blocks non-staff before these are ever called.
 */
export async function requirePlatformStaff() {
  const ctx = await getAuthContext();
  if (!ctx || !isPlatformStaff(ctx)) return null;
  return ctx;
}

export interface PlatformStats {
  organizations: number;
  tutors: number;
  learners: number;
  activeSubscriptions: number;
  mrrMinor: number;
  mrrCurrency: string;
}

async function count(table: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from(table as any)
    .select('id', { count: 'exact', head: true });
  return count ?? 0;
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const supabase = await createClient();

  const [orgs, learners, members, subs, plans] = await Promise.all([
    count('organizations'),
    count('learners'),
    supabase
      .from('organization_members')
      .select('id', { count: 'exact', head: true })
      .in('role', ['owner', 'admin', 'tutor', 'assistant']),
    supabase
      .from('subscriptions')
      .select('plan_id, status')
      .in('status', ['trialing', 'active', 'past_due']),
    supabase.from('subscription_plans').select('id, monthly_price_minor, currency'),
  ]);

  const priceById = new Map(
    (plans.data ?? []).map((p) => [p.id, { minor: p.monthly_price_minor, currency: p.currency }]),
  );

  // MRR grouped by currency; report the currency with the largest total.
  const mrrByCurrency = new Map<string, number>();
  for (const s of subs.data ?? []) {
    if (s.status !== 'active') continue; // MRR = actively paying
    const price = priceById.get(s.plan_id);
    if (!price) continue;
    mrrByCurrency.set(price.currency, (mrrByCurrency.get(price.currency) ?? 0) + price.minor);
  }
  const top = [...mrrByCurrency.entries()].sort((a, b) => b[1] - a[1])[0];

  return {
    organizations: orgs,
    tutors: members.count ?? 0,
    learners,
    activeSubscriptions: (subs.data ?? []).length,
    mrrMinor: top?.[1] ?? 0,
    mrrCurrency: top?.[0] ?? 'USD',
  };
}

export interface RevenuePoint {
  label: string;
  value: number; // minor units
}

/** Monthly platform revenue (succeeded platform payments) for the last N months. */
export async function getRevenueTrend(months = 6): Promise<RevenuePoint[]> {
  const supabase = await createClient();
  const since = startOfMonth(subMonths(new Date(), months - 1));

  const { data } = await supabase
    .from('payments')
    .select('amount_minor, paid_at, direction, status')
    .eq('direction', 'platform')
    .eq('status', 'succeeded')
    .gte('paid_at', since.toISOString());

  const buckets: { key: string; label: string; total: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = startOfMonth(subMonths(new Date(), i));
    buckets.push({ key: format(d, 'yyyy-MM'), label: format(d, 'MMM'), total: 0 });
  }
  const byKey = new Map(buckets.map((b) => [b.key, b]));
  for (const p of data ?? []) {
    if (!p.paid_at) continue;
    const key = format(new Date(p.paid_at), 'yyyy-MM');
    const b = byKey.get(key);
    if (b) b.total += p.amount_minor;
  }
  return buckets.map((b) => ({ label: b.label, value: b.total }));
}

export interface PlanSlice {
  name: string;
  count: number;
}

export async function getPlanDistribution(): Promise<PlanSlice[]> {
  const supabase = await createClient();
  const [{ data: subs }, { data: plans }] = await Promise.all([
    supabase
      .from('subscriptions')
      .select('plan_id')
      .in('status', ['trialing', 'active', 'past_due']),
    supabase.from('subscription_plans').select('id, name'),
  ]);
  const nameById = new Map((plans ?? []).map((p) => [p.id, p.name]));
  const counts = new Map<string, number>();
  for (const s of subs ?? []) {
    const name = nameById.get(s.plan_id) ?? 'Unknown';
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts.entries()].map(([name, count]) => ({ name, count }));
}

export interface OrgRow {
  id: string;
  name: string;
  type: string;
  currency: string;
  createdAt: string;
}

export async function getRecentOrganizations(limit = 6): Promise<OrgRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('organizations')
    .select('id, name, type, currency, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data ?? []).map((o) => ({
    id: o.id,
    name: o.name,
    type: o.type,
    currency: o.currency,
    createdAt: o.created_at,
  }));
}

export interface PaymentRow {
  id: string;
  orgName: string;
  amountMinor: number;
  currency: string;
  status: string;
  paidAt: string | null;
}

export async function getRecentPayments(limit = 6): Promise<PaymentRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('payments')
    .select('id, organization_id, amount_minor, currency, status, paid_at, created_at')
    .eq('direction', 'platform')
    .order('created_at', { ascending: false })
    .limit(limit);

  const rows = data ?? [];
  const orgIds = [...new Set(rows.map((r) => r.organization_id))];
  const names = new Map<string, string>();
  if (orgIds.length > 0) {
    const supabase2 = await createClient();
    const { data: orgs } = await supabase2.from('organizations').select('id, name').in('id', orgIds);
    for (const o of orgs ?? []) names.set(o.id, o.name);
  }

  return rows.map((r) => ({
    id: r.id,
    orgName: names.get(r.organization_id) ?? 'Organization',
    amountMinor: r.amount_minor,
    currency: r.currency,
    status: r.status,
    paidAt: r.paid_at ?? r.created_at,
  }));
}

/** Only super admins can see full cross-tenant data; used for UI messaging. */
export async function viewerIsSuperAdmin(): Promise<boolean> {
  const ctx = await getAuthContext();
  return !!ctx && isSuperAdmin(ctx);
}

// ---------------------------------------------------------------------------
// List pages
// ---------------------------------------------------------------------------

export interface OrgListRow {
  id: string;
  name: string;
  type: string;
  currency: string;
  country: string | null;
  createdAt: string;
  archived: boolean;
  learners: number;
  members: number;
}

export async function listOrganizations(limit = 100): Promise<OrgListRow[]> {
  const supabase = await createClient();
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name, type, currency, country, created_at, archived_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  const rows = orgs ?? [];
  if (rows.length === 0) return [];

  const ids = rows.map((o) => o.id);
  const [{ data: learners }, { data: members }] = await Promise.all([
    supabase.from('learners').select('organization_id').in('organization_id', ids),
    supabase.from('organization_members').select('organization_id').in('organization_id', ids),
  ]);
  const learnerCount = new Map<string, number>();
  for (const l of learners ?? []) learnerCount.set(l.organization_id, (learnerCount.get(l.organization_id) ?? 0) + 1);
  const memberCount = new Map<string, number>();
  for (const m of members ?? []) memberCount.set(m.organization_id, (memberCount.get(m.organization_id) ?? 0) + 1);

  return rows.map((o) => ({
    id: o.id,
    name: o.name,
    type: o.type,
    currency: o.currency,
    country: o.country,
    createdAt: o.created_at,
    archived: !!o.archived_at,
    learners: learnerCount.get(o.id) ?? 0,
    members: memberCount.get(o.id) ?? 0,
  }));
}

export interface SubRow {
  id: string;
  orgName: string;
  planName: string;
  status: string;
  interval: string;
  currentPeriodEnd: string | null;
}

export async function listSubscriptions(limit = 100): Promise<SubRow[]> {
  const supabase = await createClient();
  const { data: subs } = await supabase
    .from('subscriptions')
    .select('id, organization_id, plan_id, status, interval, current_period_end, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  const rows = subs ?? [];
  if (rows.length === 0) return [];

  const [{ data: orgs }, { data: plans }] = await Promise.all([
    supabase.from('organizations').select('id, name').in('id', [...new Set(rows.map((r) => r.organization_id))]),
    supabase.from('subscription_plans').select('id, name'),
  ]);
  const orgName = new Map((orgs ?? []).map((o) => [o.id, o.name]));
  const planName = new Map((plans ?? []).map((p) => [p.id, p.name]));

  return rows.map((s) => ({
    id: s.id,
    orgName: orgName.get(s.organization_id) ?? 'Organization',
    planName: planName.get(s.plan_id) ?? 'Plan',
    status: s.status,
    interval: s.interval,
    currentPeriodEnd: s.current_period_end,
  }));
}

export interface PlanAdminRow {
  id: string;
  name: string;
  slug: string;
  monthlyPriceMinor: number;
  currency: string;
  includedLearners: number;
  isActive: boolean;
  isPublic: boolean;
  subscribers: number;
}

export async function listPlans(): Promise<PlanAdminRow[]> {
  const supabase = await createClient();
  const [{ data: plans }, { data: subs }] = await Promise.all([
    supabase.from('subscription_plans').select('*').order('sort_order', { ascending: true }),
    supabase.from('subscriptions').select('plan_id').in('status', ['trialing', 'active', 'past_due']),
  ]);
  const subCount = new Map<string, number>();
  for (const s of subs ?? []) subCount.set(s.plan_id, (subCount.get(s.plan_id) ?? 0) + 1);
  return (plans ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    monthlyPriceMinor: p.monthly_price_minor,
    currency: p.currency,
    includedLearners: p.included_learners,
    isActive: p.is_active,
    isPublic: p.is_public,
    subscribers: subCount.get(p.id) ?? 0,
  }));
}

export async function listPlatformPayments(limit = 100): Promise<PaymentRow[]> {
  return getRecentPayments(limit);
}

export interface AuditRow {
  id: string;
  action: string;
  resourceType: string | null;
  orgName: string | null;
  createdAt: string;
}

export async function listAuditLogs(limit = 100): Promise<AuditRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('audit_logs')
    .select('id, action, resource_type, organization_id, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  const rows = data ?? [];
  const orgIds = [...new Set(rows.map((r) => r.organization_id).filter(Boolean))] as string[];
  const orgName = new Map<string, string>();
  if (orgIds.length > 0) {
    const { data: orgs } = await supabase.from('organizations').select('id, name').in('id', orgIds);
    for (const o of orgs ?? []) orgName.set(o.id, o.name);
  }
  return rows.map((r) => ({
    id: r.id,
    action: r.action,
    resourceType: r.resource_type,
    orgName: r.organization_id ? (orgName.get(r.organization_id) ?? null) : null,
    createdAt: r.created_at,
  }));
}

// ---------------------------------------------------------------------------
// Revenue analytics
// ---------------------------------------------------------------------------

export interface RevenueByPlan {
  name: string;
  currency: string;
  subscribers: number;
  mrrMinor: number;
}
export interface RevenueMetrics {
  mrrByCurrency: { currency: string; minor: number }[];
  arrByCurrency: { currency: string; minor: number }[];
  arpuMinor: number;
  arpuCurrency: string;
  payingSubscribers: number;
  collectedByCurrency: { currency: string; minor: number }[];
  byPlan: RevenueByPlan[];
  trend: RevenuePoint[];
}

export async function getRevenueMetrics(): Promise<RevenueMetrics> {
  const supabase = await createClient();
  const [{ data: subs }, { data: plans }, { data: payments }, trend] = await Promise.all([
    supabase.from('subscriptions').select('plan_id, status').eq('status', 'active'),
    supabase.from('subscription_plans').select('id, name, monthly_price_minor, currency'),
    supabase.from('payments').select('amount_minor, currency, status, direction').eq('direction', 'platform').eq('status', 'succeeded'),
    getRevenueTrend(),
  ]);

  const plan = new Map((plans ?? []).map((p) => [p.id, p]));
  const mrr = new Map<string, number>();
  const planAgg = new Map<string, RevenueByPlan>();
  let payingSubscribers = 0;

  for (const s of subs ?? []) {
    const p = plan.get(s.plan_id);
    if (!p) continue;
    payingSubscribers += 1;
    mrr.set(p.currency, (mrr.get(p.currency) ?? 0) + p.monthly_price_minor);
    const cur = planAgg.get(p.id) ?? { name: p.name, currency: p.currency, subscribers: 0, mrrMinor: 0 };
    cur.subscribers += 1;
    cur.mrrMinor += p.monthly_price_minor;
    planAgg.set(p.id, cur);
  }

  const collected = new Map<string, number>();
  for (const pay of payments ?? []) collected.set(pay.currency, (collected.get(pay.currency) ?? 0) + pay.amount_minor);

  const mrrByCurrency = [...mrr.entries()].map(([currency, minor]) => ({ currency, minor })).sort((a, b) => b.minor - a.minor);
  const top = mrrByCurrency[0];

  return {
    mrrByCurrency,
    arrByCurrency: mrrByCurrency.map((m) => ({ currency: m.currency, minor: m.minor * 12 })),
    arpuMinor: top && payingSubscribers ? Math.round(top.minor / payingSubscribers) : 0,
    arpuCurrency: top?.currency ?? 'USD',
    payingSubscribers,
    collectedByCurrency: [...collected.entries()].map(([currency, minor]) => ({ currency, minor })),
    byPlan: [...planAgg.values()].sort((a, b) => b.mrrMinor - a.mrrMinor),
    trend,
  };
}

// ---------------------------------------------------------------------------
// Churn & retention
// ---------------------------------------------------------------------------

export interface ChurnMetrics {
  statusCounts: { status: string; count: number }[];
  active: number;
  trialing: number;
  pastDue: number;
  cancelled: number;
  expired: number;
  churnRatePct: number;
  trialConversionPct: number;
  totalSubscriptions: number;
}

export async function getChurnMetrics(): Promise<ChurnMetrics> {
  const supabase = await createClient();
  const { data } = await supabase.from('subscriptions').select('status');
  const counts = new Map<string, number>();
  for (const s of data ?? []) counts.set(s.status, (counts.get(s.status) ?? 0) + 1);

  const g = (k: string) => counts.get(k) ?? 0;
  const active = g('active');
  const trialing = g('trialing');
  const pastDue = g('past_due');
  const cancelled = g('cancelled');
  const expired = g('expired');
  const churnedBase = active + pastDue + cancelled + expired;
  const converted = active + cancelled + expired; // trials that became paid at some point (approx)
  const trialBase = converted + trialing;

  return {
    statusCounts: [...counts.entries()].map(([status, count]) => ({ status, count })),
    active,
    trialing,
    pastDue,
    cancelled,
    expired,
    churnRatePct: churnedBase ? Math.round(((cancelled + expired) / churnedBase) * 100) : 0,
    trialConversionPct: trialBase ? Math.round((converted / trialBase) * 100) : 0,
    totalSubscriptions: (data ?? []).length,
  };
}

// ---------------------------------------------------------------------------
// Features & coupons management
// ---------------------------------------------------------------------------

export interface FeatureRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  type: 'boolean' | 'numeric' | 'unlimited';
  plans: number;
}

export async function listFeatures(): Promise<FeatureRow[]> {
  const supabase = await createClient();
  const [{ data: features }, { data: planFeatures }] = await Promise.all([
    supabase.from('features').select('id, slug, name, description, type').order('name'),
    supabase.from('plan_features').select('feature_id'),
  ]);
  const usage = new Map<string, number>();
  for (const pf of planFeatures ?? []) usage.set(pf.feature_id, (usage.get(pf.feature_id) ?? 0) + 1);
  return (features ?? []).map((f) => ({
    id: f.id,
    slug: f.slug,
    name: f.name,
    description: f.description,
    type: f.type,
    plans: usage.get(f.id) ?? 0,
  }));
}

export interface CouponRow {
  id: string;
  code: string;
  description: string | null;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  currency: string | null;
  maxRedemptions: number | null;
  timesRedeemed: number;
  isActive: boolean;
  expiresAt: string | null;
}

export async function listCoupons(): Promise<CouponRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('coupons')
    .select('id, code, description, discount_type, discount_value, currency, max_redemptions, times_redeemed, is_active, expires_at')
    .order('created_at', { ascending: false });
  return (data ?? []).map((c) => ({
    id: c.id,
    code: c.code,
    description: c.description,
    discountType: c.discount_type,
    discountValue: c.discount_value,
    currency: c.currency,
    maxRedemptions: c.max_redemptions,
    timesRedeemed: c.times_redeemed,
    isActive: c.is_active,
    expiresAt: c.expires_at,
  }));
}

// ---------------------------------------------------------------------------
// Tutors, learners, invoices, usage, support (platform-wide)
// ---------------------------------------------------------------------------

export interface TutorRow {
  id: string;
  name: string | null;
  email: string;
  role: string;
  orgName: string;
}

export async function listTutors(limit = 200): Promise<TutorRow[]> {
  const supabase = await createClient();
  const { data: members } = await supabase
    .from('organization_members')
    .select('id, user_id, role, organization_id, status')
    .in('role', ['owner', 'admin', 'tutor', 'assistant'])
    .neq('status', 'removed')
    .limit(limit);
  const rows = members ?? [];
  if (rows.length === 0) return [];

  const [{ data: profiles }, { data: orgs }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email').in('id', [...new Set(rows.map((m) => m.user_id))]),
    supabase.from('organizations').select('id, name').in('id', [...new Set(rows.map((m) => m.organization_id))]),
  ]);
  const p = new Map((profiles ?? []).map((x) => [x.id, x]));
  const o = new Map((orgs ?? []).map((x) => [x.id, x.name]));
  return rows.map((m) => ({
    id: m.id,
    name: p.get(m.user_id)?.full_name ?? null,
    email: p.get(m.user_id)?.email ?? '—',
    role: m.role,
    orgName: o.get(m.organization_id) ?? 'Organization',
  }));
}

export interface AdminLearnerRow {
  id: string;
  name: string;
  orgName: string;
  status: string;
  createdAt: string;
}

export async function listAllLearners(limit = 200): Promise<AdminLearnerRow[]> {
  const supabase = await createClient();
  const { data: learners } = await supabase
    .from('learners')
    .select('id, first_name, last_name, organization_id, status, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  const rows = learners ?? [];
  if (rows.length === 0) return [];
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name')
    .in('id', [...new Set(rows.map((l) => l.organization_id))]);
  const o = new Map((orgs ?? []).map((x) => [x.id, x.name]));
  return rows.map((l) => ({
    id: l.id,
    name: `${l.first_name} ${l.last_name ?? ''}`.trim(),
    orgName: o.get(l.organization_id) ?? 'Organization',
    status: l.status,
    createdAt: l.created_at,
  }));
}

export interface InvoiceRow {
  id: string;
  number: string;
  orgName: string;
  status: string;
  totalMinor: number;
  currency: string;
  issuedAt: string | null;
}

export async function listInvoices(limit = 200): Promise<InvoiceRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('invoices')
    .select('id, number, organization_id, status, total_minor, currency, issued_at, created_at')
    .eq('direction', 'platform')
    .order('created_at', { ascending: false })
    .limit(limit);
  const rows = data ?? [];
  if (rows.length === 0) return [];
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name')
    .in('id', [...new Set(rows.map((r) => r.organization_id))]);
  const o = new Map((orgs ?? []).map((x) => [x.id, x.name]));
  return rows.map((r) => ({
    id: r.id,
    number: r.number,
    orgName: o.get(r.organization_id) ?? 'Organization',
    status: r.status,
    totalMinor: r.total_minor,
    currency: r.currency,
    issuedAt: r.issued_at ?? r.created_at,
  }));
}

export interface UsageAnalytics {
  organizations: number;
  activeOrganizations: number;
  learners: number;
  openLearners: number;
  classes: number;
  assignments: number;
  rewardEvents: number;
  featureAdoption: { name: string; plans: number }[];
}

export async function getUsageAnalytics(): Promise<UsageAnalytics> {
  const supabase = await createClient();
  const [orgs, learners, classes, assignments, rewards, subs, features] = await Promise.all([
    count('organizations'),
    count('learners'),
    count('classes'),
    count('assignments'),
    count('reward_events'),
    supabase.from('subscriptions').select('organization_id').in('status', ['trialing', 'active', 'past_due']),
    listFeatures(),
  ]);
  const { count: openLearners } = await supabase
    .from('learner_billing')
    .select('id', { count: 'exact', head: true })
    .in('status', ['trialing', 'active']);

  return {
    organizations: orgs,
    activeOrganizations: new Set((subs.data ?? []).map((s) => s.organization_id)).size,
    learners,
    openLearners: openLearners ?? 0,
    classes,
    assignments,
    rewardEvents: rewards,
    featureAdoption: features
      .filter((f) => f.plans > 0)
      .sort((a, b) => b.plans - a.plans)
      .map((f) => ({ name: f.name, plans: f.plans })),
  };
}

export interface TicketRow {
  id: string;
  subject: string;
  orgName: string | null;
  status: string;
  priority: string;
  createdAt: string;
}

export async function listSupportTickets(limit = 200): Promise<TicketRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('support_tickets')
    .select('id, subject, organization_id, status, priority, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  const rows = data ?? [];
  const orgIds = [...new Set(rows.map((r) => r.organization_id).filter(Boolean))] as string[];
  const o = new Map<string, string>();
  if (orgIds.length > 0) {
    const { data: orgs } = await supabase.from('organizations').select('id, name').in('id', orgIds);
    for (const x of orgs ?? []) o.set(x.id, x.name);
  }
  return rows.map((r) => ({
    id: r.id,
    subject: r.subject,
    orgName: r.organization_id ? (o.get(r.organization_id) ?? null) : null,
    status: r.status,
    priority: r.priority,
    createdAt: r.created_at,
  }));
}
