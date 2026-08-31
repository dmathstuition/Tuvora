import { NextResponse, type NextRequest } from 'next/server';
import { getAuthContext } from '@/lib/auth/context';
import { isPlatformStaff } from '@/lib/permissions';
import { listOrganizations, listSubscriptions, listPlatformPayments } from '@/services/admin';

type Row = Record<string, string | number>;

function toCsv(rows: Row[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]!);
  const escape = (v: string | number) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h] ?? '')).join(','))].join('\n');
}

/**
 * CSV export for platform reports. Guarded to platform staff; data flows through
 * the admin services (RLS-scoped). Supported: organizations, subscriptions,
 * payments.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  const ctx = await getAuthContext();
  if (!ctx || !isPlatformStaff(ctx)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { type } = await params;
  let rows: Row[] = [];

  if (type === 'organizations') {
    rows = (await listOrganizations(1000)).map((o) => ({
      name: o.name,
      type: o.type,
      currency: o.currency,
      country: o.country ?? '',
      learners: o.learners,
      staff: o.members,
      status: o.archived ? 'archived' : 'active',
      joined: o.createdAt,
    }));
  } else if (type === 'subscriptions') {
    rows = (await listSubscriptions(1000)).map((s) => ({
      organization: s.orgName,
      plan: s.planName,
      status: s.status,
      interval: s.interval,
      renews: s.currentPeriodEnd ?? '',
    }));
  } else if (type === 'payments') {
    rows = (await listPlatformPayments(1000)).map((p) => ({
      organization: p.orgName,
      amount_minor: p.amountMinor,
      currency: p.currency,
      status: p.status,
      date: p.paidAt ?? '',
    }));
  } else {
    return NextResponse.json({ error: 'Unknown report' }, { status: 404 });
  }

  const csv = toCsv(rows);
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="tuvoria-${type}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
