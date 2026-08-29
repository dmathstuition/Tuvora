'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/auth/context';
import { getEntitlements } from '@/lib/entitlements/service';
import { getRemainingCapacity } from '@/lib/entitlements/engine';
import { assertCan, can, ForbiddenError } from '@/lib/permissions';

export interface CourseListItem {
  id: string;
  title: string;
  level: string | null;
  status: 'draft' | 'published' | 'archived';
  lessons: number;
}

export async function listCourses(): Promise<CourseListItem[]> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return [];
  assertCan(ctx, 'courses.view');
  const supabase = await createClient();

  const { data: courses } = await supabase
    .from('courses')
    .select('id, title, level, status')
    .eq('organization_id', ctx.organizationId)
    .order('created_at', { ascending: false });
  const rows = courses ?? [];
  if (rows.length === 0) return [];

  const { data: modules } = await supabase
    .from('course_modules')
    .select('id, course_id')
    .eq('organization_id', ctx.organizationId)
    .in('course_id', rows.map((c) => c.id));
  const moduleIds = (modules ?? []).map((m) => m.id);
  const moduleToCourse = new Map((modules ?? []).map((m) => [m.id, m.course_id]));

  const lessonCount = new Map<string, number>();
  if (moduleIds.length > 0) {
    const { data: lessons } = await supabase
      .from('lessons')
      .select('module_id')
      .eq('organization_id', ctx.organizationId)
      .in('module_id', moduleIds);
    for (const l of lessons ?? []) {
      const courseId = l.module_id ? moduleToCourse.get(l.module_id) : undefined;
      if (courseId) lessonCount.set(courseId, (lessonCount.get(courseId) ?? 0) + 1);
    }
  }

  return rows.map((c) => ({ ...c, lessons: lessonCount.get(c.id) ?? 0 }));
}

export async function getRemainingCourseCapacity(organizationId: string): Promise<number> {
  const supabase = await createClient();
  const [entitlements, { count }] = await Promise.all([
    getEntitlements(organizationId),
    supabase.from('courses').select('id', { count: 'exact', head: true }).eq('organization_id', organizationId).neq('status', 'archived'),
  ]);
  return getRemainingCapacity(entitlements, 'courses', count ?? 0);
}

export type CourseState = { error?: string; success?: boolean };

export async function createCourseAction(_prev: CourseState, formData: FormData): Promise<CourseState> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return { error: 'No active organization' };
  try {
    assertCan(ctx, 'courses.manage');
  } catch (e) {
    if (e instanceof ForbiddenError) return { error: 'You cannot manage courses.' };
    throw e;
  }
  const title = String(formData.get('title') ?? '').trim();
  if (title.length < 2) return { error: 'Enter a course title.' };

  if ((await getRemainingCourseCapacity(ctx.organizationId)) <= 0) {
    return { error: 'You have reached your plan’s course limit. Upgrade to add more.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('courses').insert({
    organization_id: ctx.organizationId,
    title,
    description: String(formData.get('description') ?? '') || null,
    level: String(formData.get('level') ?? '') || null,
    status: 'draft',
    created_by: ctx.userId,
  });
  if (error) return { error: 'Could not create the course.' };
  revalidatePath('/dashboard/courses');
  return { success: true };
}

export interface CourseDetail {
  course: { id: string; title: string; description: string | null; level: string | null; status: string };
  modules: { id: string; title: string; lessons: { id: string; title: string }[] }[];
  canManage: boolean;
}

export async function getCourseDetail(id: string): Promise<CourseDetail | null> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return null;
  assertCan(ctx, 'courses.view');
  const supabase = await createClient();

  const { data: course } = await supabase
    .from('courses')
    .select('id, title, description, level, status')
    .eq('id', id)
    .eq('organization_id', ctx.organizationId)
    .maybeSingle();
  if (!course) return null;

  const { data: modules } = await supabase
    .from('course_modules')
    .select('id, title, position')
    .eq('organization_id', ctx.organizationId)
    .eq('course_id', id)
    .order('position');
  const moduleRows = modules ?? [];

  const lessonsByModule = new Map<string, { id: string; title: string }[]>();
  if (moduleRows.length > 0) {
    const { data: lessons } = await supabase
      .from('lessons')
      .select('id, title, module_id, position')
      .eq('organization_id', ctx.organizationId)
      .in('module_id', moduleRows.map((m) => m.id))
      .order('position');
    for (const l of lessons ?? []) {
      if (!l.module_id) continue;
      const arr = lessonsByModule.get(l.module_id) ?? [];
      arr.push({ id: l.id, title: l.title });
      lessonsByModule.set(l.module_id, arr);
    }
  }

  return {
    course,
    modules: moduleRows.map((m) => ({ id: m.id, title: m.title, lessons: lessonsByModule.get(m.id) ?? [] })),
    canManage: can(ctx, 'courses.manage'),
  };
}

export async function addModuleAction(_prev: CourseState, formData: FormData): Promise<CourseState> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return { error: 'No active organization' };
  try {
    assertCan(ctx, 'courses.manage');
  } catch {
    return { error: 'You cannot manage courses.' };
  }
  const courseId = String(formData.get('courseId') ?? '');
  const title = String(formData.get('title') ?? '').trim();
  if (!courseId || !title) return { error: 'Enter a module title.' };
  const supabase = await createClient();
  const { error } = await supabase.from('course_modules').insert({
    organization_id: ctx.organizationId,
    course_id: courseId,
    title,
  });
  if (error) return { error: 'Could not add the module.' };
  revalidatePath(`/dashboard/courses/${courseId}`);
  return { success: true };
}

export async function addLessonAction(_prev: CourseState, formData: FormData): Promise<CourseState> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return { error: 'No active organization' };
  try {
    assertCan(ctx, 'lessons.manage');
  } catch {
    return { error: 'You cannot manage lessons.' };
  }
  const moduleId = String(formData.get('moduleId') ?? '');
  const courseId = String(formData.get('courseId') ?? '');
  const title = String(formData.get('title') ?? '').trim();
  if (!moduleId || !title) return { error: 'Enter a lesson title.' };
  const supabase = await createClient();
  const { error } = await supabase.from('lessons').insert({
    organization_id: ctx.organizationId,
    module_id: moduleId,
    title,
    description: String(formData.get('description') ?? '') || null,
    video_url: String(formData.get('videoUrl') ?? '') || null,
  });
  if (error) return { error: 'Could not add the lesson.' };
  revalidatePath(`/dashboard/courses/${courseId}`);
  return { success: true };
}
