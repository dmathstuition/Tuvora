'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/auth/context';
import { canAddLearner as dbCanAddLearner } from '@/lib/entitlements/service';
import { assertCan, ForbiddenError } from '@/lib/permissions';
import { createLearnerSchema } from '@/schemas/learner';
import type { Database } from '@/types/database.types';

type Learner = Database['public']['Tables']['learners']['Row'];

export interface ListLearnersResult {
  learners: Pick<
    Learner,
    'id' | 'first_name' | 'last_name' | 'email' | 'status' | 'enrolled_at'
  >[];
  total: number;
}

/**
 * List learners for the active organization, paginated. RLS scopes rows to the
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

  return { learners: data ?? [], total: count ?? 0 };
}

export type CreateLearnerState = { error?: string; success?: boolean };

/**
 * Create a learner — the money-critical path.
 *
 * Enforcement is layered:
 *   1. Permission check (learners.create).
 *   2. Seat-limit check via the DB function (canAddLearner).
 *   3. The database trigger enforce_learner_limit() is the final backstop, so
 *      even a race that slips past (2) cannot exceed the paid plan.
 * On success an audit log row is written.
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
    status: (formData.get('status') as string) || 'active',
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Please check the form' };
  }

  // Seat limit — server-authoritative.
  if (parsed.data.status === 'active') {
    const allowed = await dbCanAddLearner(ctx.organizationId);
    if (!allowed) {
      return {
        error:
          'You have reached your learner seat limit. Upgrade your plan or add seats to continue.',
      };
    }
  }

  const supabase = await createClient();
  const { error } = await supabase.from('learners').insert({
    organization_id: ctx.organizationId,
    first_name: parsed.data.firstName,
    last_name: parsed.data.lastName || null,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    status: parsed.data.status,
  });

  if (error) {
    // The DB trigger raises 'learner_limit_exceeded' as the final backstop.
    if (error.message.includes('learner_limit_exceeded')) {
      return { error: 'Learner seat limit reached. Please upgrade to add more learners.' };
    }
    return { error: 'Could not add the learner. Please try again.' };
  }

  await supabase.from('audit_logs').insert({
    organization_id: ctx.organizationId,
    actor_id: ctx.userId,
    action: 'learner.created',
    resource_type: 'learner',
    metadata: { name: `${parsed.data.firstName} ${parsed.data.lastName}`.trim() },
  });

  revalidatePath('/dashboard/learners');
  return { success: true };
}
