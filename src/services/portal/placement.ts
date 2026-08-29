'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { placementFor } from '@/lib/placement/grade';

export interface MyPlacement {
  attemptId: string;
  title: string;
  subjectLabel: string | null;
  status: string;
  percentage: number | null;
  placementLevel: string | null;
  questionCount: number;
}

async function resolveLearnerId(): Promise<{ userId: string; learnerId: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data: learner } = await admin
    .from('learners')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!learner) return null;
  return { userId: user.id, learnerId: learner.id };
}

/** Placement tests assigned to the signed-in learner. */
export async function getMyPlacements(): Promise<MyPlacement[]> {
  const resolved = await resolveLearnerId();
  if (!resolved) return [];
  const admin = createAdminClient();

  const { data: attempts } = await admin
    .from('assessment_attempts')
    .select('id, assessment_id, status, percentage, placement_level')
    .eq('learner_id', resolved.learnerId)
    .order('assigned_at', { ascending: false });
  const rows = attempts ?? [];
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.assessment_id);
  const [{ data: assessments }, { data: questions }] = await Promise.all([
    admin.from('assessments').select('id, title, subject_label, is_placement').in('id', ids),
    admin.from('assessment_questions').select('assessment_id').in('assessment_id', ids),
  ]);
  const byId = new Map((assessments ?? []).map((a) => [a.id, a]));
  const qCount = new Map<string, number>();
  for (const q of questions ?? []) qCount.set(q.assessment_id, (qCount.get(q.assessment_id) ?? 0) + 1);

  return rows
    .filter((r) => byId.get(r.assessment_id)?.is_placement !== false)
    .map((r) => ({
      attemptId: r.id,
      title: byId.get(r.assessment_id)?.title ?? 'Placement test',
      subjectLabel: byId.get(r.assessment_id)?.subject_label ?? null,
      status: r.status,
      percentage: r.percentage,
      placementLevel: r.placement_level,
      questionCount: qCount.get(r.assessment_id) ?? 0,
    }));
}

/** The learner's assigned mock exams / tests (non-placement assessments). */
export async function getMyExams(): Promise<MyPlacement[]> {
  const resolved = await resolveLearnerId();
  if (!resolved) return [];
  const admin = createAdminClient();

  const { data: attempts } = await admin
    .from('assessment_attempts')
    .select('id, assessment_id, status, percentage')
    .eq('learner_id', resolved.learnerId)
    .order('assigned_at', { ascending: false });
  const rows = attempts ?? [];
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.assessment_id);
  const [{ data: assessments }, { data: questions }] = await Promise.all([
    admin.from('assessments').select('id, title, subject_label, is_placement').in('id', ids),
    admin.from('assessment_questions').select('assessment_id').in('assessment_id', ids),
  ]);
  const byId = new Map((assessments ?? []).map((a) => [a.id, a]));
  const qCount = new Map<string, number>();
  for (const q of questions ?? []) qCount.set(q.assessment_id, (qCount.get(q.assessment_id) ?? 0) + 1);

  return rows
    .filter((r) => byId.get(r.assessment_id)?.is_placement === false)
    .map((r) => ({
      attemptId: r.id,
      title: byId.get(r.assessment_id)?.title ?? 'Exam',
      subjectLabel: byId.get(r.assessment_id)?.subject_label ?? null,
      status: r.status,
      percentage: r.percentage,
      placementLevel: null,
      questionCount: qCount.get(r.assessment_id) ?? 0,
    }));
}

export interface PlacementQuestion {
  id: string;
  prompt: string;
  options: { id: string; label: string }[];
}

export interface PlacementAttempt {
  attemptId: string;
  title: string;
  subjectLabel: string | null;
  status: string;
  percentage: number | null;
  placementLevel: string | null;
  placementNotes: string | null;
  questions: PlacementQuestion[];
}

/** The learner's view of a placement attempt: questions with options (no answer key). */
export async function getPlacementAttempt(attemptId: string): Promise<PlacementAttempt | null> {
  const resolved = await resolveLearnerId();
  if (!resolved) return null;
  const admin = createAdminClient();

  const { data: attempt } = await admin
    .from('assessment_attempts')
    .select('id, assessment_id, learner_id, status, percentage, placement_level, placement_notes')
    .eq('id', attemptId)
    .maybeSingle();
  if (!attempt || attempt.learner_id !== resolved.learnerId) return null;

  const { data: assessment } = await admin
    .from('assessments')
    .select('title, subject_label')
    .eq('id', attempt.assessment_id)
    .maybeSingle();

  const { data: questions } = await admin
    .from('assessment_questions')
    .select('id, prompt, position')
    .eq('assessment_id', attempt.assessment_id)
    .order('position');
  const qRows = questions ?? [];

  const optionsByQ = new Map<string, { id: string; label: string; position: number }[]>();
  if (qRows.length > 0) {
    const { data: options } = await admin
      .from('assessment_options')
      .select('id, question_id, label, position')
      .in('question_id', qRows.map((q) => q.id))
      .order('position');
    for (const o of options ?? []) {
      const arr = optionsByQ.get(o.question_id) ?? [];
      arr.push({ id: o.id, label: o.label, position: o.position });
      optionsByQ.set(o.question_id, arr);
    }
  }

  // Mark the attempt as started on first open.
  if (attempt.status === 'assigned') {
    await admin
      .from('assessment_attempts')
      .update({ status: 'in_progress', started_at: new Date().toISOString() })
      .eq('id', attempt.id);
  }

  return {
    attemptId: attempt.id,
    title: assessment?.title ?? 'Placement test',
    subjectLabel: assessment?.subject_label ?? null,
    status: attempt.status,
    percentage: attempt.percentage,
    placementLevel: attempt.placement_level,
    placementNotes: attempt.placement_notes,
    questions: qRows.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      options: (optionsByQ.get(q.id) ?? []).map((o) => ({ id: o.id, label: o.label })),
    })),
  };
}

export type SubmitPlacementState = {
  error?: string;
  graded?: boolean;
  percentage?: number;
  level?: string;
  notes?: string;
};

/** Grade and submit the learner's placement attempt. */
export async function submitPlacementAction(
  _prev: SubmitPlacementState,
  formData: FormData,
): Promise<SubmitPlacementState> {
  const resolved = await resolveLearnerId();
  if (!resolved) return { error: 'Please sign in again.' };
  const attemptId = String(formData.get('attemptId') ?? '');
  if (!attemptId) return { error: 'No test specified.' };

  const admin = createAdminClient();
  const { data: attempt } = await admin
    .from('assessment_attempts')
    .select('id, assessment_id, learner_id, status')
    .eq('id', attemptId)
    .maybeSingle();
  if (!attempt || attempt.learner_id !== resolved.learnerId) return { error: 'Test not found.' };
  if (attempt.status === 'graded' || attempt.status === 'submitted') {
    return { error: 'You have already completed this test.' };
  }

  const { data: questions } = await admin
    .from('assessment_questions')
    .select('id, marks')
    .eq('assessment_id', attempt.assessment_id);
  const qRows = questions ?? [];
  if (qRows.length === 0) return { error: 'This test has no questions.' };

  const { data: options } = await admin
    .from('assessment_options')
    .select('id, question_id, is_correct')
    .in('question_id', qRows.map((q) => q.id));
  const correctByQ = new Map<string, string>();
  for (const o of options ?? []) {
    if (o.is_correct) correctByQ.set(o.question_id, o.id);
  }

  const answers: Record<string, string> = {};
  let score = 0;
  let total = 0;
  for (const q of qRows) {
    total += q.marks ?? 1;
    const chosen = String(formData.get(`q_${q.id}`) ?? '');
    if (chosen) answers[q.id] = chosen;
    if (chosen && correctByQ.get(q.id) === chosen) score += q.marks ?? 1;
  }

  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  const placement = placementFor(percentage);

  const { error } = await admin
    .from('assessment_attempts')
    .update({
      status: 'graded',
      answers,
      score,
      total,
      percentage,
      placement_level: placement.level,
      placement_notes: placement.notes,
      submitted_at: new Date().toISOString(),
    })
    .eq('id', attempt.id);
  if (error) return { error: 'Could not submit your test. Please try again.' };

  revalidatePath('/portal');
  revalidatePath(`/portal/placement/${attemptId}`);
  return {
    graded: true,
    percentage,
    level: placement.level,
    notes: placement.notes,
  };
}
