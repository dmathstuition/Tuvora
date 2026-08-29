'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/auth/context';
import { assertCan, ForbiddenError } from '@/lib/permissions';

export interface CalendarItem {
  id: string;
  title: string;
  kind: string;
  startsAt: string;
  source: 'event' | 'assignment';
}

/** Upcoming events: calendar_events plus assignment due dates, merged + sorted. */
export async function listUpcomingEvents(): Promise<CalendarItem[]> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return [];
  assertCan(ctx, 'calendar.view');
  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const [{ data: events }, { data: assignments }] = await Promise.all([
    supabase
      .from('calendar_events')
      .select('id, title, kind, starts_at')
      .eq('organization_id', ctx.organizationId)
      .gte('starts_at', nowIso)
      .order('starts_at')
      .limit(50),
    supabase
      .from('assignments')
      .select('id, title, due_at')
      .eq('organization_id', ctx.organizationId)
      .not('due_at', 'is', null)
      .gte('due_at', nowIso)
      .order('due_at')
      .limit(50),
  ]);

  const items: CalendarItem[] = [
    ...(events ?? []).map((e) => ({ id: e.id, title: e.title, kind: e.kind, startsAt: e.starts_at, source: 'event' as const })),
    ...(assignments ?? []).map((a) => ({ id: a.id, title: `Due: ${a.title}`, kind: 'assignment_due', startsAt: a.due_at as string, source: 'assignment' as const })),
  ];
  return items.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

export type EventState = { error?: string; success?: boolean };

export async function createEventAction(_prev: EventState, formData: FormData): Promise<EventState> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return { error: 'No active organization' };
  try {
    assertCan(ctx, 'calendar.manage');
  } catch (e) {
    if (e instanceof ForbiddenError) return { error: 'You cannot manage the calendar.' };
    throw e;
  }
  const title = String(formData.get('title') ?? '').trim();
  const startsAt = String(formData.get('startsAt') ?? '');
  if (title.length < 2) return { error: 'Enter an event title.' };
  if (!startsAt) return { error: 'Choose a date/time.' };

  const supabase = await createClient();
  const { error } = await supabase.from('calendar_events').insert({
    organization_id: ctx.organizationId,
    title,
    kind: String(formData.get('kind') ?? 'event'),
    starts_at: new Date(startsAt).toISOString(),
  });
  if (error) return { error: 'Could not create the event.' };
  revalidatePath('/dashboard/calendar');
  return { success: true };
}

export interface ClassSession {
  id: string;
  title: string;
  startsAt: string;
}

/** Upcoming + recent scheduled sessions for a single class. */
export async function listClassSessions(classId: string): Promise<ClassSession[]> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from('calendar_events')
    .select('id, title, starts_at')
    .eq('organization_id', ctx.organizationId)
    .eq('class_id', classId)
    .order('starts_at', { ascending: true });
  return (data ?? []).map((e) => ({ id: e.id, title: e.title, startsAt: e.starts_at }));
}

/** Schedule a session/lesson on a class (no course needed). */
export async function scheduleClassSessionAction(
  _prev: EventState,
  formData: FormData,
): Promise<EventState> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return { error: 'No active organization' };
  try {
    assertCan(ctx, 'calendar.manage');
  } catch (e) {
    if (e instanceof ForbiddenError) return { error: 'You cannot schedule sessions.' };
    throw e;
  }
  const classId = String(formData.get('classId') ?? '');
  const title = String(formData.get('title') ?? '').trim();
  const startsAt = String(formData.get('startsAt') ?? '');
  if (!classId) return { error: 'Missing class.' };
  if (title.length < 2) return { error: 'Enter a session title.' };
  if (!startsAt) return { error: 'Choose a date/time.' };

  const supabase = await createClient();
  const { error } = await supabase.from('calendar_events').insert({
    organization_id: ctx.organizationId,
    title,
    kind: 'class',
    class_id: classId,
    starts_at: new Date(startsAt).toISOString(),
  });
  if (error) return { error: 'Could not schedule the session.' };
  revalidatePath(`/dashboard/classes/${classId}`);
  revalidatePath('/dashboard/calendar');
  return { success: true };
}

/** Delete a scheduled event/session. */
export async function deleteEventAction(formData: FormData): Promise<void> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return;
  const { can } = await import('@/lib/permissions');
  if (!can(ctx, 'calendar.manage')) return;
  const id = String(formData.get('id') ?? '');
  const classId = String(formData.get('classId') ?? '');
  if (!id) return;
  const supabase = await createClient();
  await supabase.from('calendar_events').delete().eq('id', id).eq('organization_id', ctx.organizationId);
  if (classId) revalidatePath(`/dashboard/classes/${classId}`);
  revalidatePath('/dashboard/calendar');
}
