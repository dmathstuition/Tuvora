'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/auth/context';
import { getEntitlements } from '@/lib/entitlements/service';
import { getRemainingCapacity } from '@/lib/entitlements/engine';
import { assertCan, ForbiddenError } from '@/lib/permissions';
import { createClassSchema } from '@/schemas/class';
import type { Database } from '@/types/database.types';

type ClassRow = Database['public']['Tables']['classes']['Row'];

export interface ClassListItem
  extends Pick<ClassRow, 'id' | 'name' | 'mode' | 'status' | 'capacity' | 'start_date'> {
  learner_count: number;
}

export interface ListClassesResult {
  classes: ClassListItem[];
  total: number;
}

/** Count active classes for entitlement checks (non-archived). */
async function countClasses(organizationId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from('classes')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .neq('status', 'archived');
  return count ?? 0;
}

export async function listClasses(page = 1, pageSize = 20): Promise<ListClassesResult> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return { classes: [], total: 0 };
  assertCan(ctx, 'classes.view');

  const supabase = await createClient();
  const from = (page - 1) * pageSize;

  const { data, count } = await supabase
    .from('classes')
    .select('id, name, mode, status, capacity, start_date', { count: 'exact' })
    .eq('organization_id', ctx.organizationId)
    .order('created_at', { ascending: false })
    .range(from, from + pageSize - 1);

  const rows = data ?? [];

  // Enrolment counts per listed class (single grouped query would need a view;
  // for a page of 20 this is fine and stays tenant-scoped via RLS).
  const counts = new Map<string, number>();
  if (rows.length > 0) {
    const { data: members } = await supabase
      .from('class_members')
      .select('class_id')
      .eq('organization_id', ctx.organizationId)
      .in(
        'class_id',
        rows.map((r) => r.id),
      );
    for (const m of members ?? []) {
      counts.set(m.class_id, (counts.get(m.class_id) ?? 0) + 1);
    }
  }

  return {
    classes: rows.map((r) => ({ ...r, learner_count: counts.get(r.id) ?? 0 })),
    total: count ?? 0,
  };
}

/** Remaining classes the org may create (Infinity when unlimited). */
export async function getRemainingClassCapacity(organizationId: string): Promise<number> {
  const [entitlements, used] = await Promise.all([
    getEntitlements(organizationId),
    countClasses(organizationId),
  ]);
  return getRemainingCapacity(entitlements, 'classes', used);
}

export type CreateClassState = { error?: string; success?: boolean };

/**
 * Create a class — enforces, in order:
 *   1. Permission (classes.manage).
 *   2. Entitlement limit for the 'classes' feature (plan-configured).
 * Writes an audit log on success.
 */
export async function createClassAction(
  _prev: CreateClassState,
  formData: FormData,
): Promise<CreateClassState> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return { error: 'No active organization' };

  try {
    assertCan(ctx, 'classes.manage');
  } catch (e) {
    if (e instanceof ForbiddenError) return { error: 'You cannot create classes.' };
    throw e;
  }

  const parsed = createClassSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description') || '',
    mode: (formData.get('mode') as string) || 'group',
    capacity: formData.get('capacity') || undefined,
    startDate: formData.get('startDate') || '',
    status: 'active',
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Please check the form' };
  }

  // Entitlement limit — server-authoritative.
  const remaining = await getRemainingClassCapacity(ctx.organizationId);
  if (remaining <= 0) {
    return {
      error: 'You have reached your plan’s class limit. Upgrade to create more classes.',
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('classes').insert({
    organization_id: ctx.organizationId,
    name: parsed.data.name,
    description: parsed.data.description || null,
    mode: parsed.data.mode,
    capacity: parsed.data.capacity ?? null,
    start_date: parsed.data.startDate || null,
    status: parsed.data.status,
  });

  if (error) return { error: 'Could not create the class. Please try again.' };

  await supabase.from('audit_logs').insert({
    organization_id: ctx.organizationId,
    actor_id: ctx.userId,
    action: 'class.created',
    resource_type: 'class',
    metadata: { name: parsed.data.name },
  });

  revalidatePath('/dashboard/classes');
  return { success: true };
}
