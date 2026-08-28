'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/auth/context';
import { assertCan, ForbiddenError } from '@/lib/permissions';
import { createLearnerSchema } from '@/schemas/learner';
import type { Database } from '@/types/database.types';

type Learner = Database['public']['Tables']['learners']['Row'];

export type LearnerBillingBadge = 'trial' | 'paid' | 'unpaid';

export interface LearnerListItem
  extends Pick<Learner, 'id' | 'first_name' | 'last_name' | 'email' | 'status' | 'enrolled_at'> {
  billing: LearnerBillingBadge;
  periodEnd: string | null;
}

export interface ListLearnersResult {
  learners: LearnerListItem[];
  total: number;
}

/**
 * List learners for the active organization, paginated, each annotated with its
 * per-learner billing state (trial / paid / unpaid). RLS scopes rows to the
 * tenant; we still pass organization_id for index-friendly queries.
 */
export async function listLearners(page = 1, pageSize = 20): Promise<ListLearnersResult> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return { learners: [], total: 0 };
  assertCan(ctx, 'learners.view');

  const supabase = await createClient();
  const from = (page - 1) * pageSize;

  const { data, count } = await supabase
    .from('learners')
    .select('id, first_name, last_name, email, status, enrolled_at', { count: 'exact' })
    .eq('organization_id', ctx.organizationId)
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1);

  const rows = data ?? [];
  const billingByLearner = new Map<
    string,
    { status: string; is_trial: boolean; period_end: string | null }
  >();
  if (rows.length > 0) {
    const { data: bills } = await supabase
      .from('learner_billing')
      .select('learner_id, status, is_trial, current_period_end')
      .eq('organization_id', ctx.organizationId)
      .in(
        'learner_id',
        rows.map((r) => r.id),
      );
    for (const b of bills ?? []) {
      billingByLearner.set(b.learner_id, {
        status: b.status,
        is_trial: b.is_trial,
        period_end: b.current_period_end,
      });
    }
  }

  const now = Date.now();
  const learners: LearnerListItem[] = rows.map((r) => {
    const b = billingByLearner.get(r.id);
    const open =
      !!b &&
      (b.status === 'trialing' || b.status === 'active') &&
      (!b.period_end || new Date(b.period_end).getTime() > now);
    const badge: LearnerBillingBadge = !open ? 'unpaid' : b?.is_trial ? 'trial' : 'paid';
    return { ...r, billing: badge, periodEnd: b?.period_end ?? null };
  });

  return { learners, total: count ?? 0 };
}

export type CreateLearnerState = { error?: string; success?: boolean; needsPayment?: boolean };

function addMonth(from: Date): Date {
  const d = new Date(from);
  d.setMonth(d.getMonth() + 1);
  return d;
}

/**
 * Create a learner under the per-learner billing model.
 *
 * - The organization's FIRST learner may use the free trial: one learner, one
 *   month, account opens immediately.
 * - Every other learner is created but its account stays closed (status
 *   'inactive') until it is paid for the month — see activateLearnerAction in
 *   services/learner-billing. Nothing bypasses this on the server.
 *
 * Enforces the learners.create permission; audit-logged.
 */
export async function createLearnerAction(
  _prev: CreateLearnerState,
  formData: FormData,
): Promise<CreateLearnerState> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return { error: 'No active organization' };

  try {
    assertCan(ctx, 'learners.create');
  } catch (e) {
    if (e instanceof ForbiddenError) return { error: 'You cannot add learners.' };
    throw e;
  }

  const parsed = createLearnerSchema.safeParse({
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName') || '',
    email: formData.get('email') || '',
    phone: formData.get('phone') || '',
    status: 'active',
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Please check the form' };
  }

  const supabase = await createClient();

  // Is the single free-trial learner still available?
  const { data: trialUsed } = await supabase.rpc('org_free_trial_used', {
    org: ctx.organizationId,
  });
  const useTrial = !trialUsed;

  // Create the learner. Trial learners open immediately (active); others start
  // inactive until paid for the month.
  const { data: learner, error } = await supabase
    .from('learners')
    .insert({
      organization_id: ctx.organizationId,
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName || null,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      status: useTrial ? 'active' : 'inactive',
    })
    .select('id')
    .single();

  if (error || !learner) return { error: 'Could not add the learner. Please try again.' };

  const now = new Date();
  if (useTrial) {
    await supabase.from('learner_billing').insert({
      organization_id: ctx.organizationId,
      learner_id: learner.id,
      status: 'trialing',
      is_trial: true,
      current_period_start: now.toISOString(),
      current_period_end: addMonth(now).toISOString(),
    });
  } else {
    await supabase.from('learner_billing').insert({
      organization_id: ctx.organizationId,
      learner_id: learner.id,
      status: 'past_due',
      is_trial: false,
    });
  }

  await supabase.from('audit_logs').insert({
    organization_id: ctx.organizationId,
    actor_id: ctx.userId,
    action: 'learner.created',
    resource_type: 'learner',
    resource_id: learner.id,
    metadata: {
      name: `${parsed.data.firstName} ${parsed.data.lastName}`.trim(),
      trial: useTrial,
    },
  });

  revalidatePath('/dashboard/learners');
  return { success: true, needsPayment: !useTrial };
}
