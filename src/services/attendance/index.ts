'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/auth/context';
import { assertCan, can, ForbiddenError } from '@/lib/permissions';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';
const STATUSES: AttendanceStatus[] = ['present', 'absent', 'late', 'excused'];

export interface RegisterRow {
  learner_id: string;
  name: string;
  status: AttendanceStatus | null;
}

export interface Register {
  rows: RegisterRow[];
  canManage: boolean;
}

/** Class options for the attendance picker. */
export async function getAttendanceClasses(): Promise<{ id: string; name: string }[]> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from('classes')
    .select('id, name')
    .eq('organization_id', ctx.organizationId)
    .neq('status', 'archived')
    .order('name');
  return data ?? [];
}

/**
 * The register for a class on a date: every enrolled learner and their recorded
 * status for that session (null when not yet marked).
 */
export async function getRegister(classId: string, date: string): Promise<Register | null> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return null;
  assertCan(ctx, 'attendance.view');
  const supabase = await createClient();

  const { data: members } = await supabase
    .from('class_members')
    .select('learner_id')
    .eq('organization_id', ctx.organizationId)
    .eq('class_id', classId);

  const learnerIds = (members ?? []).map((m) => m.learner_id);
  if (learnerIds.length === 0) {
    return { rows: [], canManage: false };
  }

  const [{ data: learners }, { data: existing }] = await Promise.all([
    supabase.from('learners').select('id, first_name, last_name').in('id', learnerIds),
    supabase
      .from('attendance')
      .select('learner_id, status')
      .eq('organization_id', ctx.organizationId)
      .eq('class_id', classId)
      .eq('session_date', date),
  ]);

  const statusByLearner = new Map<string, AttendanceStatus>();
  for (const a of existing ?? []) statusByLearner.set(a.learner_id, a.status);

  const nameById = new Map<string, string>();
  for (const l of learners ?? []) {
    nameById.set(l.id, `${l.first_name} ${l.last_name ?? ''}`.trim());
  }

  return {
    rows: learnerIds.map((id) => ({
      learner_id: id,
      name: nameById.get(id) ?? 'Learner',
      status: statusByLearner.get(id) ?? null,
    })),
    canManage: can(ctx, 'attendance.manage'),
  };
}

export type SaveAttendanceState = { error?: string; success?: boolean };

/**
 * Save a register. Upserts one attendance row per learner keyed on
 * (class_id, learner_id, session_date), so re-saving a session corrects it
 * rather than duplicating. Enforces attendance.manage.
 */
export async function saveAttendanceAction(
  _prev: SaveAttendanceState,
  formData: FormData,
): Promise<SaveAttendanceState> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return { error: 'No active organization' };

  try {
    assertCan(ctx, 'attendance.manage');
  } catch (e) {
    if (e instanceof ForbiddenError) return { error: 'You cannot record attendance.' };
    throw e;
  }

  const classId = formData.get('classId') as string;
  const date = formData.get('date') as string;
  if (!classId || !date) return { error: 'Select a class and date.' };

  const supabase = await createClient();

  // Confirm the class belongs to this org before writing.
  const { data: klass } = await supabase
    .from('classes')
    .select('id')
    .eq('id', classId)
    .eq('organization_id', ctx.organizationId)
    .maybeSingle();
  if (!klass) return { error: 'Class not found.' };

  // Build rows from the submitted status_<learnerId> fields.
  const rows: {
    organization_id: string;
    class_id: string;
    learner_id: string;
    session_date: string;
    status: AttendanceStatus;
    recorded_by: string;
  }[] = [];

  for (const [key, value] of formData.entries()) {
    if (!key.startsWith('status_')) continue;
    const status = value as AttendanceStatus;
    if (!STATUSES.includes(status)) continue;
    rows.push({
      organization_id: ctx.organizationId,
      class_id: classId,
      learner_id: key.slice('status_'.length),
      session_date: date,
      status,
      recorded_by: ctx.userId,
    });
  }

  if (rows.length === 0) return { error: 'Nothing to save.' };

  const { error } = await supabase
    .from('attendance')
    .upsert(rows, { onConflict: 'class_id,learner_id,session_date' });
  if (error) return { error: 'Could not save attendance.' };

  await supabase.from('audit_logs').insert({
    organization_id: ctx.organizationId,
    actor_id: ctx.userId,
    action: 'attendance.recorded',
    resource_type: 'class',
    resource_id: classId,
    metadata: { session_date: date, count: rows.length },
  });

  revalidatePath('/dashboard/attendance');
  return { success: true };
}
