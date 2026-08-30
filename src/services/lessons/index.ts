'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/auth/context';
import { assertCan, can, ForbiddenError } from '@/lib/permissions';

/**
 * Online lessons.
 *
 * Tuvora runs on live online lessons rather than a course catalogue. A lesson
 * is a scheduled online session — stored in `calendar_events` with kind
 * 'lesson' — that is assigned to a class (group) OR to a single learner
 * (one-to-one), and carries a meeting link the learner joins from their portal.
 * The meeting link falls back to the class's default link when a lesson doesn't
 * set its own.
 */

export interface OnlineLesson {
  id: string;
  title: string;
  startsAt: string;
  meetingUrl: string | null;
  classId: string | null;
  className: string | null;
  learnerId: string | null;
  learnerName: string | null;
  past: boolean;
}

export interface LessonTargets {
  classes: { id: string; name: string; meetingUrl: string | null }[];
  learners: { id: string; name: string }[];
}

/** Classes and one-to-one learners a lesson can be assigned to. */
export async function getLessonTargets(): Promise<LessonTargets> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return { classes: [], learners: [] };
  const supabase = await createClient();
  const [{ data: classes }, { data: learners }] = await Promise.all([
    supabase
      .from('classes')
      .select('id, name, meeting_url')
      .eq('organization_id', ctx.organizationId)
      .neq('status', 'archived')
      .order('name'),
    supabase
      .from('learners')
      .select('id, first_name, last_name')
      .eq('organization_id', ctx.organizationId)
      .neq('status', 'archived')
      .order('first_name'),
  ]);
  return {
    classes: (classes ?? []).map((c) => ({ id: c.id, name: c.name, meetingUrl: c.meeting_url })),
    learners: (learners ?? []).map((l) => ({
      id: l.id,
      name: `${l.first_name} ${l.last_name ?? ''}`.trim(),
    })),
  };
}

/** All online lessons for the org, soonest upcoming first, past ones after. */
export async function listOnlineLessons(): Promise<OnlineLesson[]> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return [];
  assertCan(ctx, 'lessons.view');
  const supabase = await createClient();

  const { data: events } = await supabase
    .from('calendar_events')
    .select('id, title, starts_at, meeting_url, class_id, learner_id')
    .eq('organization_id', ctx.organizationId)
    .eq('kind', 'lesson')
    .order('starts_at', { ascending: true });
  const rows = events ?? [];
  if (rows.length === 0) return [];

  const classIds = [...new Set(rows.map((r) => r.class_id).filter(Boolean) as string[])];
  const learnerIds = [...new Set(rows.map((r) => r.learner_id).filter(Boolean) as string[])];

  const [classesRes, learnersRes] = await Promise.all([
    classIds.length
      ? supabase.from('classes').select('id, name, meeting_url').in('id', classIds)
      : Promise.resolve({ data: [] as { id: string; name: string; meeting_url: string | null }[] }),
    learnerIds.length
      ? supabase.from('learners').select('id, first_name, last_name').in('id', learnerIds)
      : Promise.resolve({ data: [] as { id: string; first_name: string; last_name: string | null }[] }),
  ]);
  const classById = new Map((classesRes.data ?? []).map((c) => [c.id, c]));
  const learnerById = new Map((learnersRes.data ?? []).map((l) => [l.id, l]));

  const now = Date.now();
  const lessons: OnlineLesson[] = rows.map((r) => {
    const klass = r.class_id ? classById.get(r.class_id) : undefined;
    const learner = r.learner_id ? learnerById.get(r.learner_id) : undefined;
    return {
      id: r.id,
      title: r.title,
      startsAt: r.starts_at,
      meetingUrl: r.meeting_url ?? klass?.meeting_url ?? null,
      classId: r.class_id,
      className: klass?.name ?? null,
      learnerId: r.learner_id,
      learnerName: learner ? `${learner.first_name} ${learner.last_name ?? ''}`.trim() : null,
      past: new Date(r.starts_at).getTime() < now,
    };
  });

  // Upcoming (soonest first), then past (most recent first).
  const upcoming = lessons.filter((l) => !l.past);
  const past = lessons.filter((l) => l.past).reverse();
  return [...upcoming, ...past];
}

export type LessonState = { error?: string; success?: boolean };

/**
 * Schedule an online lesson. Assign it to a class OR a single learner (exactly
 * one), give it a start time and an optional meeting link (falls back to the
 * class link at view time).
 */
export async function createOnlineLessonAction(
  _prev: LessonState,
  formData: FormData,
): Promise<LessonState> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return { error: 'No active organization' };
  try {
    assertCan(ctx, 'lessons.manage');
  } catch (e) {
    if (e instanceof ForbiddenError) return { error: 'You cannot schedule lessons.' };
    throw e;
  }

  const title = String(formData.get('title') ?? '').trim();
  const startsAt = String(formData.get('startsAt') ?? '');
  const target = String(formData.get('target') ?? ''); // "class:<id>" | "learner:<id>"
  const meetingUrl = String(formData.get('meetingUrl') ?? '').trim();

  if (title.length < 2) return { error: 'Enter a lesson title.' };
  if (!startsAt) return { error: 'Choose a date & time.' };
  if (!target) return { error: 'Assign the lesson to a class or a learner.' };
  if (meetingUrl && !/^https?:\/\//i.test(meetingUrl)) {
    return { error: 'The meeting link must start with http:// or https://' };
  }

  const [kind, id] = target.split(':');
  const classId = kind === 'class' ? id : null;
  const learnerId = kind === 'learner' ? id : null;
  if (!classId && !learnerId) return { error: 'Assign the lesson to a class or a learner.' };

  const supabase = await createClient();
  const { error } = await supabase.from('calendar_events').insert({
    organization_id: ctx.organizationId,
    title,
    kind: 'lesson',
    class_id: classId,
    learner_id: learnerId,
    starts_at: new Date(startsAt).toISOString(),
    meeting_url: meetingUrl || null,
  });
  if (error) return { error: 'Could not schedule the lesson.' };

  revalidatePath('/dashboard/lessons');
  revalidatePath('/dashboard/calendar');
  if (classId) revalidatePath(`/dashboard/classes/${classId}`);
  return { success: true };
}

/** Delete an online lesson. */
export async function deleteOnlineLessonAction(formData: FormData): Promise<void> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId || !can(ctx, 'lessons.manage')) return;
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  const supabase = await createClient();
  await supabase
    .from('calendar_events')
    .delete()
    .eq('id', id)
    .eq('organization_id', ctx.organizationId);
  revalidatePath('/dashboard/lessons');
  revalidatePath('/dashboard/calendar');
}
