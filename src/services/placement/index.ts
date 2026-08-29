'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/auth/context';
import { assertCan, can, ForbiddenError } from '@/lib/permissions';
import {
  generateQuestions,
  type GenSubject,
  type GenDifficulty,
} from '@/lib/placement/generate';

export type PlacementState = { error?: string; success?: boolean; added?: number };

const SUBJECTS: GenSubject[] = ['maths', 'english', 'reasoning', 'science'];
const DIFFICULTIES: GenDifficulty[] = ['easy', 'medium', 'hard'];

/**
 * AI-assisted question generation for a placement CBT. Generates multiple-choice
 * questions for the given subject/difficulty and appends them to the assessment,
 * marking it as a placement test. The manual path (add-question) still works.
 */
export async function generatePlacementQuestionsAction(
  _prev: PlacementState,
  formData: FormData,
): Promise<PlacementState> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return { error: 'No active organization' };
  try {
    assertCan(ctx, 'assessments.manage');
  } catch (e) {
    if (e instanceof ForbiddenError) return { error: 'You cannot manage assessments.' };
    throw e;
  }

  const assessmentId = String(formData.get('assessmentId') ?? '');
  if (!assessmentId) return { error: 'No assessment specified.' };
  const subject = String(formData.get('subject') ?? 'maths') as GenSubject;
  const difficulty = String(formData.get('difficulty') ?? 'medium') as GenDifficulty;
  const count = Math.min(Math.max(Number(formData.get('count') ?? 5) || 5, 1), 20);
  if (!SUBJECTS.includes(subject)) return { error: 'Pick a valid subject.' };
  if (!DIFFICULTIES.includes(difficulty)) return { error: 'Pick a valid difficulty.' };

  const supabase = await createClient();

  // Confirm the assessment belongs to this org and find the current max position.
  const { data: assessment } = await supabase
    .from('assessments')
    .select('id, grade_band')
    .eq('id', assessmentId)
    .eq('organization_id', ctx.organizationId)
    .maybeSingle();
  if (!assessment) return { error: 'Assessment not found.' };

  const { data: existing } = await supabase
    .from('assessment_questions')
    .select('position')
    .eq('organization_id', ctx.organizationId)
    .eq('assessment_id', assessmentId)
    .order('position', { ascending: false })
    .limit(1);
  let position = (existing?.[0]?.position ?? -1) + 1;

  const questions = await generateQuestions(subject, difficulty, count, assessment.grade_band);
  if (questions.length === 0) return { error: 'Could not generate questions. Try again.' };

  let added = 0;
  for (const q of questions) {
    const { data: question, error } = await supabase
      .from('assessment_questions')
      .insert({
        organization_id: ctx.organizationId,
        assessment_id: assessmentId,
        type: 'multiple_choice',
        prompt: q.prompt,
        marks: q.marks,
        position: position++,
      })
      .select('id')
      .single();
    if (error || !question) continue;
    await supabase.from('assessment_options').insert(
      q.options.map((label, i) => ({
        organization_id: ctx.organizationId!,
        question_id: question.id,
        label,
        is_correct: i === q.correctIndex,
        position: i,
      })),
    );
    added++;
  }

  // Mark the assessment as a placement test and record the subject label.
  await supabase
    .from('assessments')
    .update({ is_placement: true, subject_label: subject })
    .eq('id', assessmentId)
    .eq('organization_id', ctx.organizationId);

  revalidatePath(`/dashboard/assessments/${assessmentId}`);
  return { success: true, added };
}

/** Assign a placement/aptitude test to a learner (creates an attempt). */
export async function assignPlacementAction(
  _prev: PlacementState,
  formData: FormData,
): Promise<PlacementState> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return { error: 'No active organization' };
  try {
    assertCan(ctx, 'assessments.manage');
  } catch (e) {
    if (e instanceof ForbiddenError) return { error: 'You cannot assign assessments.' };
    throw e;
  }

  const assessmentId = String(formData.get('assessmentId') ?? '');
  const learnerId = String(formData.get('learnerId') ?? '');
  if (!assessmentId || !learnerId) return { error: 'Choose a learner.' };

  const supabase = await createClient();

  // Must have at least one question before assigning.
  const { count: qCount } = await supabase
    .from('assessment_questions')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', ctx.organizationId)
    .eq('assessment_id', assessmentId);
  if (!qCount || qCount === 0) {
    return { error: 'Add or generate questions before assigning this test.' };
  }

  const { error } = await supabase.from('assessment_attempts').upsert(
    {
      organization_id: ctx.organizationId,
      assessment_id: assessmentId,
      learner_id: learnerId,
      assigned_by: ctx.userId,
      status: 'assigned',
    },
    { onConflict: 'assessment_id,learner_id' },
  );
  if (error) return { error: 'Could not assign the test.' };

  // Publish so the learner can access it.
  await supabase
    .from('assessments')
    .update({ status: 'published' })
    .eq('id', assessmentId)
    .eq('organization_id', ctx.organizationId);

  await supabase.from('audit_logs').insert({
    organization_id: ctx.organizationId,
    actor_id: ctx.userId,
    action: 'placement.assigned',
    resource_type: 'assessment',
    resource_id: assessmentId,
    metadata: { learner_id: learnerId },
  });

  revalidatePath(`/dashboard/assessments/${assessmentId}`);
  return { success: true };
}

export interface AttemptResult {
  id: string;
  learnerId: string;
  learnerName: string;
  status: string;
  percentage: number | null;
  placementLevel: string | null;
  submittedAt: string | null;
}

/** Results of a placement test across the learners it was assigned to. */
export async function listAssessmentAttempts(assessmentId: string): Promise<AttemptResult[]> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return [];
  assertCan(ctx, 'assessments.view');
  const supabase = await createClient();

  const { data: attempts } = await supabase
    .from('assessment_attempts')
    .select('id, learner_id, status, percentage, placement_level, submitted_at')
    .eq('organization_id', ctx.organizationId)
    .eq('assessment_id', assessmentId)
    .order('assigned_at', { ascending: false });
  const rows = attempts ?? [];
  if (rows.length === 0) return [];

  const { data: learners } = await supabase
    .from('learners')
    .select('id, first_name, last_name')
    .eq('organization_id', ctx.organizationId)
    .in('id', rows.map((r) => r.learner_id));
  const nameById = new Map(
    (learners ?? []).map((l) => [l.id, `${l.first_name} ${l.last_name ?? ''}`.trim()]),
  );

  return rows.map((r) => ({
    id: r.id,
    learnerId: r.learner_id,
    learnerName: nameById.get(r.learner_id) ?? 'Learner',
    status: r.status,
    percentage: r.percentage,
    placementLevel: r.placement_level,
    submittedAt: r.submitted_at,
  }));
}

export interface LearnerPlacement {
  id: string;
  title: string;
  subjectLabel: string | null;
  status: string;
  percentage: number | null;
  placementLevel: string | null;
  submittedAt: string | null;
}

/** Placement attempts for one learner (shown on their profile). */
export async function getLearnerPlacements(learnerId: string): Promise<LearnerPlacement[]> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId || !can(ctx, 'assessments.view')) return [];
  const supabase = await createClient();

  const { data: attempts } = await supabase
    .from('assessment_attempts')
    .select('id, assessment_id, status, percentage, placement_level, submitted_at')
    .eq('organization_id', ctx.organizationId)
    .eq('learner_id', learnerId)
    .order('assigned_at', { ascending: false });
  const rows = attempts ?? [];
  if (rows.length === 0) return [];

  const { data: assessments } = await supabase
    .from('assessments')
    .select('id, title, subject_label')
    .eq('organization_id', ctx.organizationId)
    .in('id', rows.map((r) => r.assessment_id));
  const byId = new Map((assessments ?? []).map((a) => [a.id, a]));

  return rows.map((r) => ({
    id: r.id,
    title: byId.get(r.assessment_id)?.title ?? 'Placement test',
    subjectLabel: byId.get(r.assessment_id)?.subject_label ?? null,
    status: r.status,
    percentage: r.percentage,
    placementLevel: r.placement_level,
    submittedAt: r.submitted_at,
  }));
}
