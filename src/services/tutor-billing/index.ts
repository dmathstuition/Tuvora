'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/auth/context';
import { assertCan, ForbiddenError } from '@/lib/permissions';

async function orgCurrency(organizationId: string): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase.from('organizations').select('currency').eq('id', organizationId).maybeSingle();
  return data?.currency ?? 'USD';
}

export async function getLearnerOptions(): Promise<{ value: string; label: string }[]> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from('learners')
    .select('id, first_name, last_name')
    .eq('organization_id', ctx.organizationId)
    .neq('status', 'archived')
    .order('first_name');
  return (data ?? []).map((l) => ({ value: l.id, label: `${l.first_name} ${l.last_name ?? ''}`.trim() }));
}

// --- Payments (parent/learner -> tutor) ------------------------------------

export interface TutorPaymentRow {
  id: string;
  learnerName: string;
  amountMinor: number;
  currency: string;
  status: string;
  paidAt: string | null;
}

export async function listTutorPayments(): Promise<TutorPaymentRow[]> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return [];
  assertCan(ctx, 'payments.view');
  const supabase = await createClient();
  const { data } = await supabase
    .from('payments')
    .select('id, amount_minor, currency, status, paid_at, created_at, payer_learner_id')
    .eq('organization_id', ctx.organizationId)
    .eq('direction', 'tutor')
    .order('created_at', { ascending: false });
  const rows = data ?? [];
  const ids = [...new Set(rows.map((r) => r.payer_learner_id).filter(Boolean))] as string[];
  const names = new Map<string, string>();
  if (ids.length > 0) {
    const { data: learners } = await supabase.from('learners').select('id, first_name, last_name').in('id', ids);
    for (const l of learners ?? []) names.set(l.id, `${l.first_name} ${l.last_name ?? ''}`.trim());
  }
  return rows.map((r) => ({
    id: r.id,
    learnerName: r.payer_learner_id ? (names.get(r.payer_learner_id) ?? 'Learner') : '—',
    amountMinor: r.amount_minor,
    currency: r.currency,
    status: r.status,
    paidAt: r.paid_at ?? r.created_at,
  }));
}

export type BillingState = { error?: string; success?: boolean };

export async function recordPaymentAction(_prev: BillingState, formData: FormData): Promise<BillingState> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return { error: 'No active organization' };
  try {
    assertCan(ctx, 'payments.manage');
  } catch (e) {
    if (e instanceof ForbiddenError) return { error: 'You cannot record payments.' };
    throw e;
  }
  const learnerId = String(formData.get('learnerId') ?? '');
  const amount = Number(formData.get('amount'));
  if (!learnerId) return { error: 'Select a learner.' };
  if (!Number.isFinite(amount) || amount <= 0) return { error: 'Enter a valid amount.' };

  const supabase = await createClient();
  const { error } = await supabase.from('payments').insert({
    organization_id: ctx.organizationId,
    direction: 'tutor',
    status: 'succeeded',
    amount_minor: Math.round(amount * 100),
    currency: await orgCurrency(ctx.organizationId),
    payer_learner_id: learnerId,
    paid_at: new Date().toISOString(),
    metadata: { recorded: true },
  });
  if (error) return { error: 'Could not record the payment.' };
  revalidatePath('/dashboard/payments');
  return { success: true };
}

// --- Invoices (tutor billing) ----------------------------------------------

export interface TutorInvoiceRow {
  id: string;
  number: string;
  learnerName: string;
  totalMinor: number;
  currency: string;
  status: string;
  issuedAt: string | null;
}

export async function listTutorInvoices(): Promise<TutorInvoiceRow[]> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return [];
  assertCan(ctx, 'invoices.view');
  const supabase = await createClient();
  const { data } = await supabase
    .from('invoices')
    .select('id, number, total_minor, currency, status, issued_at, created_at, bill_to_learner_id')
    .eq('organization_id', ctx.organizationId)
    .eq('direction', 'tutor')
    .order('created_at', { ascending: false });
  const rows = data ?? [];
  const ids = [...new Set(rows.map((r) => (r as { bill_to_learner_id: string | null }).bill_to_learner_id).filter(Boolean))] as string[];
  const names = new Map<string, string>();
  if (ids.length > 0) {
    const { data: learners } = await supabase.from('learners').select('id, first_name, last_name').in('id', ids);
    for (const l of learners ?? []) names.set(l.id, `${l.first_name} ${l.last_name ?? ''}`.trim());
  }
  return rows.map((r) => {
    const bt = (r as { bill_to_learner_id: string | null }).bill_to_learner_id;
    return {
      id: r.id,
      number: r.number,
      learnerName: bt ? (names.get(bt) ?? 'Learner') : '—',
      totalMinor: r.total_minor,
      currency: r.currency,
      status: r.status,
      issuedAt: r.issued_at ?? r.created_at,
    };
  });
}

export async function createInvoiceAction(_prev: BillingState, formData: FormData): Promise<BillingState> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return { error: 'No active organization' };
  try {
    assertCan(ctx, 'invoices.manage');
  } catch (e) {
    if (e instanceof ForbiddenError) return { error: 'You cannot create invoices.' };
    throw e;
  }
  const learnerId = String(formData.get('learnerId') ?? '');
  const description = String(formData.get('description') ?? '').trim();
  const amount = Number(formData.get('amount'));
  if (!learnerId) return { error: 'Select a learner.' };
  if (!description) return { error: 'Enter a description.' };
  if (!Number.isFinite(amount) || amount <= 0) return { error: 'Enter a valid amount.' };

  const supabase = await createClient();
  const minor = Math.round(amount * 100);
  const number = `INV-${Date.now().toString().slice(-8)}`;

  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert({
      organization_id: ctx.organizationId,
      direction: 'tutor',
      number,
      status: 'open',
      currency: await orgCurrency(ctx.organizationId),
      subtotal_minor: minor,
      total_minor: minor,
      bill_to_learner_id: learnerId,
      issued_at: new Date().toISOString(),
    })
    .select('id')
    .single();
  if (error || !invoice) return { error: 'Could not create the invoice.' };

  await supabase.from('invoice_items').insert({
    invoice_id: invoice.id,
    description,
    quantity: 1,
    unit_price_minor: minor,
    amount_minor: minor,
  });

  revalidatePath('/dashboard/invoices');
  return { success: true };
}
