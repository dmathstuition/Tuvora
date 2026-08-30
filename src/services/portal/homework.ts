'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { uploadAcademyFiles, signAcademyFiles } from '@/lib/storage/files';

/** The signed-in learner (portal reads run with the service role, bound here). */
async function ownLearner(): Promise<{ id: string; organizationId: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from('learners')
    .select('id, organization_id')
    .eq('user_id', user.id)
    .maybeSingle();
  return data ? { id: data.id, organizationId: data.organization_id } : null;
}

export interface HomeworkListItem {
  submissionId: string;
  assignmentId: string;
  title: string;
  className: string | null;
  dueAt: string | null;
  status: 'assigned' | 'submitted' | 'late' | 'graded' | 'returned';
  score: number | null;
  maxPoints: number | null;
  isCbt: boolean;
}

/** All homework for the signed-in learner, soonest due first. */
export async function getMyHomework(): Promise<HomeworkListItem[]> {
  const learner = await ownLearner();
  if (!learner) return [];
  const admin = createAdminClient();

  const { data: subs } = await admin
    .from('assignment_submissions')
    .select('id, assignment_id, status, score')
    .eq('learner_id', learner.id);
  const rows = subs ?? [];
  if (rows.length === 0) return [];

  const assignmentIds = [...new Set(rows.map((r) => r.assignment_id))];
  const { data: assignments } = await admin
    .from('assignments')
    .select('id, title, due_at, max_points, class_id, assessment_id, status')
    .in('id', assignmentIds)
    .neq('status', 'archived');
  const aById = new Map((assignments ?? []).map((a) => [a.id, a]));

  const classIds = [...new Set((assignments ?? []).map((a) => a.class_id).filter(Boolean) as string[])];
  const classNames = new Map<string, string>();
  if (classIds.length) {
    const { data: classes } = await admin.from('classes').select('id, name').in('id', classIds);
    for (const c of classes ?? []) classNames.set(c.id, c.name);
  }

  const items: HomeworkListItem[] = [];
  for (const s of rows) {
    const a = aById.get(s.assignment_id);
    if (!a) continue; // archived / removed
    items.push({
      submissionId: s.id,
      assignmentId: a.id,
      title: a.title,
      className: a.class_id ? (classNames.get(a.class_id) ?? null) : null,
      dueAt: a.due_at,
      status: s.status,
      score: s.score,
      maxPoints: a.max_points,
      isCbt: !!a.assessment_id,
    });
  }

  const rank = (s: HomeworkListItem) => (s.status === 'assigned' || s.status === 'late' ? 0 : 1);
  return items.sort((x, y) => {
    if (rank(x) !== rank(y)) return rank(x) - rank(y);
    if (x.dueAt && y.dueAt) return new Date(x.dueAt).getTime() - new Date(y.dueAt).getTime();
    if (x.dueAt) return -1;
    if (y.dueAt) return 1;
    return 0;
  });
}

export interface HomeworkDetail {
  submissionId: string;
  title: string;
  instructions: string | null;
  className: string | null;
  dueAt: string | null;
  status: 'assigned' | 'submitted' | 'late' | 'graded' | 'returned';
  score: number | null;
  maxPoints: number | null;
  feedback: string | null;
  content: string | null;
  isCbt: boolean;
  questionFiles: { id: string; name: string; url: string | null }[];
  myFiles: { id: string; name: string; url: string | null }[];
}

export async function getHomeworkDetail(submissionId: string): Promise<HomeworkDetail | null> {
  const learner = await ownLearner();
  if (!learner) return null;
  const admin = createAdminClient();

  const { data: sub } = await admin
    .from('assignment_submissions')
    .select('id, assignment_id, learner_id, status, score, feedback, content')
    .eq('id', submissionId)
    .eq('learner_id', learner.id)
    .maybeSingle();
  if (!sub) return null;

  const { data: a } = await admin
    .from('assignments')
    .select('id, title, instructions, due_at, max_points, class_id, assessment_id')
    .eq('id', sub.assignment_id)
    .maybeSingle();
  if (!a) return null;

  let className: string | null = null;
  if (a.class_id) {
    const { data: c } = await admin.from('classes').select('name').eq('id', a.class_id).maybeSingle();
    className = c?.name ?? null;
  }

  const [{ data: qFiles }, { data: myFiles }] = await Promise.all([
    admin.from('assignment_files').select('id, name, path').eq('assignment_id', a.id).order('created_at'),
    admin.from('submission_files').select('id, name, path').eq('submission_id', submissionId).order('created_at'),
  ]);

  const qPaths = (qFiles ?? []).map((f) => f.path);
  const myPaths = (myFiles ?? []).map((f) => f.path);
  const qSigned = await signAcademyFiles(qPaths);
  const mySigned = await signAcademyFiles(myPaths);

  return {
    submissionId: sub.id,
    title: a.title,
    instructions: a.instructions,
    className,
    dueAt: a.due_at,
    status: sub.status,
    score: sub.score,
    maxPoints: a.max_points,
    feedback: sub.feedback,
    content: sub.content,
    isCbt: !!a.assessment_id,
    questionFiles: (qFiles ?? []).map((f, i) => ({ id: f.id, name: f.name, url: qSigned[i] ?? null })),
    myFiles: (myFiles ?? []).map((f, i) => ({ id: f.id, name: f.name, url: mySigned[i] ?? null })),
  };
}

export type SubmitHomeworkState = { error?: string; success?: boolean };

/**
 * Submit homework: saves the digital-notebook text and/or uploaded files, then
 * marks the submission submitted (late if past the due date). Learners can
 * resubmit until it's graded.
 */
export async function submitHomeworkAction(
  _prev: SubmitHomeworkState,
  formData: FormData,
): Promise<SubmitHomeworkState> {
  const learner = await ownLearner();
  if (!learner) return { error: 'No learner account.' };
  const admin = createAdminClient();

  const submissionId = String(formData.get('submissionId') ?? '');
  const content = String(formData.get('content') ?? '').trim();
  const files = formData.getAll('files');
  if (!submissionId) return { error: 'Missing submission.' };

  // Confirm ownership + fetch due date/status.
  const { data: sub } = await admin
    .from('assignment_submissions')
    .select('id, assignment_id, status')
    .eq('id', submissionId)
    .eq('learner_id', learner.id)
    .maybeSingle();
  if (!sub) return { error: 'Homework not found.' };
  if (sub.status === 'graded' || sub.status === 'returned') {
    return { error: 'This homework has already been graded.' };
  }

  const hasFiles = files.some((f) => f instanceof File && f.size > 0);
  if (!content && !hasFiles) {
    return { error: 'Write your answer or attach a file before submitting.' };
  }

  // Upload attachments.
  if (hasFiles) {
    try {
      const stored = await uploadAcademyFiles(
        `${learner.organizationId}/submissions/${submissionId}`,
        files,
      );
      if (stored.length > 0) {
        await admin.from('submission_files').insert(
          stored.map((f) => ({
            organization_id: learner.organizationId,
            submission_id: submissionId,
            learner_id: learner.id,
            path: f.path,
            name: f.name,
            mime_type: f.mime,
            size_bytes: f.size,
          })),
        );
      }
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Could not upload your files.' };
    }
  }

  // Late if past due.
  const { data: a } = await admin
    .from('assignments')
    .select('due_at')
    .eq('id', sub.assignment_id)
    .maybeSingle();
  const late = a?.due_at ? Date.now() > new Date(a.due_at).getTime() : false;

  const { error } = await admin
    .from('assignment_submissions')
    .update({
      content: content || null,
      submission_type: hasFiles ? (content ? 'mixed' : 'files') : 'notebook',
      status: late ? 'late' : 'submitted',
      submitted_at: new Date().toISOString(),
    })
    .eq('id', submissionId)
    .eq('learner_id', learner.id);
  if (error) return { error: 'Could not submit your homework.' };

  revalidatePath('/portal/homework');
  revalidatePath(`/portal/homework/${submissionId}`);
  return { success: true };
}
