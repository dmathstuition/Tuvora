'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/auth/context';
import { getEntitlements } from '@/lib/entitlements/service';
import { hasFeature } from '@/lib/entitlements/engine';
import { assertCan, can, ForbiddenError } from '@/lib/permissions';
import { createAssignmentSchema, gradeSubmissionSchema } from '@/schemas/assignment';
import { uploadAcademyFiles, signAcademyFiles } from '@/lib/storage/files';
import { sanitizeFormats } from '@/constants/homework';
import type { Database } from '@/types/database.types';

type Assignment = Database['public']['Tables']['assignments']['Row'];
type Submission = Database['public']['Tables']['assignment_submissions']['Row'];

export interface AssignmentListItem
  extends Pick<Assignment, 'id' | 'title' | 'status' | 'due_at' | 'max_points'> {
  class_name: string | null;
  total: number;
  graded: number;
}

/** Lightweight class options for the assignment create form. */
export async function getClassOptions(): Promise<{ id: string; name: string }[]> {
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

export async function listAssignments(): Promise<AssignmentListItem[]> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return [];
  assertCan(ctx, 'assignments.view');
  const supabase = await createClient();

  const { data: assignments } = await supabase
    .from('assignments')
    .select('id, title, status, due_at, max_points, class_id')
    .eq('organization_id', ctx.organizationId)
    .order('created_at', { ascending: false });

  const rows = assignments ?? [];
  if (rows.length === 0) return [];

  // Class names.
  const classIds = [...new Set(rows.map((r) => r.class_id).filter(Boolean))] as string[];
  const classNames = new Map<string, string>();
  if (classIds.length > 0) {
    const { data: classes } = await supabase
      .from('classes')
      .select('id, name')
      .in('id', classIds);
    for (const c of classes ?? []) classNames.set(c.id, c.name);
  }

  // Submission tallies per assignment.
  const { data: subs } = await supabase
    .from('assignment_submissions')
    .select('assignment_id, status')
    .eq('organization_id', ctx.organizationId)
    .in(
      'assignment_id',
      rows.map((r) => r.id),
    );
  const totals = new Map<string, number>();
  const graded = new Map<string, number>();
  for (const s of subs ?? []) {
    totals.set(s.assignment_id, (totals.get(s.assignment_id) ?? 0) + 1);
    if (s.status === 'graded' || s.status === 'returned') {
      graded.set(s.assignment_id, (graded.get(s.assignment_id) ?? 0) + 1);
    }
  }

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    status: r.status,
    due_at: r.due_at,
    max_points: r.max_points,
    class_name: r.class_id ? (classNames.get(r.class_id) ?? null) : null,
    total: totals.get(r.id) ?? 0,
    graded: graded.get(r.id) ?? 0,
  }));
}

export interface AttachedFile {
  id: string;
  name: string;
  url: string | null;
}

export interface SubmissionWithLearner
  extends Pick<Submission, 'id' | 'status' | 'score' | 'feedback' | 'submitted_at'> {
  learner_id: string;
  learner_name: string;
  content: string | null;
  files: AttachedFile[];
}

export interface AssignmentDetail {
  assignment: Pick<Assignment, 'id' | 'title' | 'instructions' | 'status' | 'due_at' | 'max_points'>;
  className: string | null;
  questionFiles: AttachedFile[];
  submissions: SubmissionWithLearner[];
  canGrade: boolean;
}

export async function getAssignmentDetail(id: string): Promise<AssignmentDetail | null> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return null;
  assertCan(ctx, 'assignments.view');
  const supabase = await createClient();

  const { data: assignment } = await supabase
    .from('assignments')
    .select('id, title, instructions, status, due_at, max_points, class_id')
    .eq('id', id)
    .eq('organization_id', ctx.organizationId)
    .maybeSingle();
  if (!assignment) return null;

  let className: string | null = null;
  if (assignment.class_id) {
    const { data: cls } = await supabase
      .from('classes')
      .select('name')
      .eq('id', assignment.class_id)
      .maybeSingle();
    className = cls?.name ?? null;
  }

  const [{ data: subs }, { data: qFiles }] = await Promise.all([
    supabase
      .from('assignment_submissions')
      .select('id, status, score, feedback, submitted_at, learner_id, content')
      .eq('assignment_id', id)
      .eq('organization_id', ctx.organizationId),
    supabase
      .from('assignment_files')
      .select('id, name, path')
      .eq('assignment_id', id)
      .eq('organization_id', ctx.organizationId)
      .order('created_at'),
  ]);

  const learnerIds = [...new Set((subs ?? []).map((s) => s.learner_id))];
  const names = new Map<string, string>();
  if (learnerIds.length > 0) {
    const { data: learners } = await supabase
      .from('learners')
      .select('id, first_name, last_name')
      .in('id', learnerIds);
    for (const l of learners ?? []) {
      names.set(l.id, `${l.first_name} ${l.last_name ?? ''}`.trim());
    }
  }

  // Submission files, grouped per submission.
  const submissionIds = (subs ?? []).map((s) => s.id);
  const filesBySubmission = new Map<string, { id: string; name: string; path: string }[]>();
  if (submissionIds.length > 0) {
    const { data: sFiles } = await supabase
      .from('submission_files')
      .select('id, name, path, submission_id')
      .in('submission_id', submissionIds)
      .eq('organization_id', ctx.organizationId);
    for (const f of sFiles ?? []) {
      const arr = filesBySubmission.get(f.submission_id) ?? [];
      arr.push({ id: f.id, name: f.name, path: f.path });
      filesBySubmission.set(f.submission_id, arr);
    }
  }

  // Sign every path in one batch.
  const allPaths = [
    ...(qFiles ?? []).map((f) => f.path),
    ...[...filesBySubmission.values()].flat().map((f) => f.path),
  ];
  const signed = await signAcademyFiles(allPaths);
  const urlByPath = new Map(allPaths.map((p, i) => [p, signed[i] ?? null]));

  return {
    assignment,
    className,
    questionFiles: (qFiles ?? []).map((f) => ({ id: f.id, name: f.name, url: urlByPath.get(f.path) ?? null })),
    submissions: (subs ?? []).map((s) => ({
      id: s.id,
      status: s.status,
      score: s.score,
      feedback: s.feedback,
      submitted_at: s.submitted_at,
      learner_id: s.learner_id,
      learner_name: names.get(s.learner_id) ?? 'Learner',
      content: s.content,
      files: (filesBySubmission.get(s.id) ?? []).map((f) => ({
        id: f.id,
        name: f.name,
        url: urlByPath.get(f.path) ?? null,
      })),
    })),
    canGrade: can(ctx, 'assignments.grade'),
  };
}

export type CreateAssignmentState = { error?: string; success?: boolean };

/**
 * Create an assignment for a class and seed one submission row per enrolled
 * learner (status 'assigned'), giving the tutor a roster to grade. Enforces
 * permission (assignments.manage) and the 'assignments' feature entitlement.
 */
export async function createAssignmentAction(
  _prev: CreateAssignmentState,
  formData: FormData,
): Promise<CreateAssignmentState> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return { error: 'No active organization' };

  try {
    assertCan(ctx, 'assignments.manage');
  } catch (e) {
    if (e instanceof ForbiddenError) return { error: 'You cannot create assignments.' };
    throw e;
  }

  const entitlements = await getEntitlements(ctx.organizationId);
  if (!hasFeature(entitlements, 'assignments')) {
    return { error: 'Assignments are not included in your current plan.' };
  }

  const parsed = createAssignmentSchema.safeParse({
    title: formData.get('title'),
    classId: formData.get('classId'),
    instructions: formData.get('instructions') || '',
    maxPoints: formData.get('maxPoints') || undefined,
    dueAt: formData.get('dueAt') || '',
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Please check the form' };
  }

  const allowedFormats = sanitizeFormats(formData.getAll('formats').map(String));

  const supabase = await createClient();
  const { data: assignment, error } = await supabase
    .from('assignments')
    .insert({
      organization_id: ctx.organizationId,
      class_id: parsed.data.classId,
      title: parsed.data.title,
      instructions: parsed.data.instructions || null,
      max_points: parsed.data.maxPoints ?? null,
      allowed_formats: allowedFormats,
      due_at: parsed.data.dueAt ? new Date(parsed.data.dueAt).toISOString() : null,
      status: 'published',
      created_by: ctx.userId,
    })
    .select('id')
    .single();

  if (error || !assignment) return { error: 'Could not create the assignment.' };

  // Upload any question files/images the tutor attached.
  const questionFiles = formData.getAll('files');
  if (questionFiles.length > 0) {
    try {
      const stored = await uploadAcademyFiles(
        `${ctx.organizationId}/assignments/${assignment.id}`,
        questionFiles,
      );
      if (stored.length > 0) {
        await supabase.from('assignment_files').insert(
          stored.map((f) => ({
            organization_id: ctx.organizationId!,
            assignment_id: assignment.id,
            path: f.path,
            name: f.name,
            mime_type: f.mime,
            size_bytes: f.size,
            uploaded_by: ctx.userId,
          })),
        );
      }
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Could not upload the question files.' };
    }
  }

  // Seed submissions for enrolled learners.
  const { data: members } = await supabase
    .from('class_members')
    .select('learner_id')
    .eq('organization_id', ctx.organizationId)
    .eq('class_id', parsed.data.classId);

  if (members && members.length > 0) {
    await supabase.from('assignment_submissions').insert(
      members.map((m) => ({
        organization_id: ctx.organizationId!,
        assignment_id: assignment.id,
        learner_id: m.learner_id,
        status: 'assigned' as const,
      })),
    );
  }

  await supabase.from('audit_logs').insert({
    organization_id: ctx.organizationId,
    actor_id: ctx.userId,
    action: 'assignment.created',
    resource_type: 'assignment',
    resource_id: assignment.id,
    metadata: { title: parsed.data.title },
  });

  revalidatePath('/dashboard/assignments');
  return { success: true };
}

export type GradeSubmissionState = { error?: string; success?: boolean };

/**
 * Grade a submission: records score + feedback and moves it to graded/returned.
 * Enforces assignments.grade. Writes a grades row so progress tracking can use
 * it later, and an audit entry.
 */
export async function gradeSubmissionAction(
  _prev: GradeSubmissionState,
  formData: FormData,
): Promise<GradeSubmissionState> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return { error: 'No active organization' };

  try {
    assertCan(ctx, 'assignments.grade');
  } catch (e) {
    if (e instanceof ForbiddenError) return { error: 'You cannot grade submissions.' };
    throw e;
  }

  const parsed = gradeSubmissionSchema.safeParse({
    submissionId: formData.get('submissionId'),
    score: formData.get('score'),
    feedback: formData.get('feedback') || '',
    action: (formData.get('action') as string) || 'returned',
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Enter a valid score' };
  }

  const supabase = await createClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('assignment_submissions')
    .update({
      score: parsed.data.score,
      feedback: parsed.data.feedback || null,
      status: parsed.data.action,
      graded_by: ctx.userId,
      graded_at: now,
      returned_at: parsed.data.action === 'returned' ? now : null,
    })
    .eq('id', parsed.data.submissionId)
    .eq('organization_id', ctx.organizationId);

  if (error) return { error: 'Could not save the grade.' };

  await supabase.from('audit_logs').insert({
    organization_id: ctx.organizationId,
    actor_id: ctx.userId,
    action: 'assignment.graded',
    resource_type: 'assignment_submission',
    resource_id: parsed.data.submissionId,
    metadata: { score: parsed.data.score },
  });

  revalidatePath('/dashboard/assignments');
  return { success: true };
}
