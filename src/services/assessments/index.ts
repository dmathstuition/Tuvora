'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/auth/context';
import { getEntitlements } from '@/lib/entitlements/service';
import { hasFeature } from '@/lib/entitlements/engine';
import { assertCan, can, ForbiddenError } from '@/lib/permissions';

export interface AssessmentListItem {
  id: string;
  title: string;
  type: string;
  status: string;
  questions: number;
}

export async function listAssessments(): Promise<AssessmentListItem[]> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return [];
  assertCan(ctx, 'assessments.view');
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from('assessments')
    .select('id, title, type, status')
    .eq('organization_id', ctx.organizationId)
    .order('created_at', { ascending: false });
  const list = rows ?? [];
  if (list.length === 0) return [];
  const { data: questions } = await supabase
    .from('assessment_questions')
    .select('assessment_id')
    .eq('organization_id', ctx.organizationId)
    .in('assessment_id', list.map((a) => a.id));
  const counts = new Map<string, number>();
  for (const q of questions ?? []) counts.set(q.assessment_id, (counts.get(q.assessment_id) ?? 0) + 1);
  return list.map((a) => ({ ...a, questions: counts.get(a.id) ?? 0 }));
}

export type AssessmentState = { error?: string; success?: boolean };

export async function createAssessmentAction(_prev: AssessmentState, formData: FormData): Promise<AssessmentState> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return { error: 'No active organization' };
  try {
    assertCan(ctx, 'assessments.manage');
  } catch (e) {
    if (e instanceof ForbiddenError) return { error: 'You cannot manage assessments.' };
    throw e;
  }
  const entitlements = await getEntitlements(ctx.organizationId);
  if (!hasFeature(entitlements, 'assessments')) {
    return { error: 'Assessments are not included in your current plan.' };
  }
  const title = String(formData.get('title') ?? '').trim();
  if (title.length < 2) return { error: 'Enter a title.' };

  const supabase = await createClient();
  const { error } = await supabase.from('assessments').insert({
    organization_id: ctx.organizationId,
    title,
    type: String(formData.get('type') ?? 'quiz'),
    pass_mark: formData.get('passMark') ? Number(formData.get('passMark')) : null,
    status: 'draft',
    created_by: ctx.userId,
  });
  if (error) return { error: 'Could not create the assessment.' };
  revalidatePath('/dashboard/assessments');
  return { success: true };
}

export interface AssessmentDetail {
  assessment: { id: string; title: string; type: string; status: string; passMark: number | null };
  questions: {
    id: string;
    prompt: string;
    type: string;
    marks: number;
    options: { id: string; label: string; isCorrect: boolean }[];
  }[];
  canManage: boolean;
}

export async function getAssessmentDetail(id: string): Promise<AssessmentDetail | null> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return null;
  assertCan(ctx, 'assessments.view');
  const supabase = await createClient();

  const { data: a } = await supabase
    .from('assessments')
    .select('id, title, type, status, pass_mark')
    .eq('id', id)
    .eq('organization_id', ctx.organizationId)
    .maybeSingle();
  if (!a) return null;

  const { data: questions } = await supabase
    .from('assessment_questions')
    .select('id, prompt, type, marks, position')
    .eq('organization_id', ctx.organizationId)
    .eq('assessment_id', id)
    .order('position');
  const qRows = questions ?? [];

  const optionsByQ = new Map<string, { id: string; label: string; isCorrect: boolean }[]>();
  if (qRows.length > 0) {
    const { data: options } = await supabase
      .from('assessment_options')
      .select('id, question_id, label, is_correct, position')
      .eq('organization_id', ctx.organizationId)
      .in('question_id', qRows.map((q) => q.id))
      .order('position');
    for (const o of options ?? []) {
      const arr = optionsByQ.get(o.question_id) ?? [];
      arr.push({ id: o.id, label: o.label, isCorrect: o.is_correct });
      optionsByQ.set(o.question_id, arr);
    }
  }

  return {
    assessment: { id: a.id, title: a.title, type: a.type, status: a.status, passMark: a.pass_mark },
    questions: qRows.map((q) => ({ id: q.id, prompt: q.prompt, type: q.type, marks: q.marks, options: optionsByQ.get(q.id) ?? [] })),
    canManage: can(ctx, 'assessments.manage'),
  };
}

export async function addQuestionAction(_prev: AssessmentState, formData: FormData): Promise<AssessmentState> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return { error: 'No active organization' };
  try {
    assertCan(ctx, 'assessments.manage');
  } catch {
    return { error: 'You cannot manage assessments.' };
  }
  const assessmentId = String(formData.get('assessmentId') ?? '');
  const prompt = String(formData.get('prompt') ?? '').trim();
  const type = String(formData.get('type') ?? 'multiple_choice') as 'multiple_choice' | 'true_false' | 'short_answer';
  const marks = Number(formData.get('marks') ?? 1) || 1;
  if (!assessmentId || !prompt) return { error: 'Enter a question.' };

  const supabase = await createClient();

  // Build answer key for auto-gradable types.
  let answerKey: unknown = null;
  if (type === 'true_false') answerKey = { correct: String(formData.get('correctBool') ?? 'true') === 'true' };
  if (type === 'short_answer') answerKey = { accepted: String(formData.get('accepted') ?? '').split(',').map((s) => s.trim()).filter(Boolean) };

  const { data: question, error } = await supabase
    .from('assessment_questions')
    .insert({ organization_id: ctx.organizationId, assessment_id: assessmentId, type, prompt, marks, answer_key: answerKey })
    .select('id')
    .single();
  if (error || !question) return { error: 'Could not add the question.' };

  if (type === 'multiple_choice') {
    const correct = String(formData.get('correct') ?? '1');
    const opts = [1, 2, 3, 4]
      .map((n) => ({ n, label: String(formData.get(`option${n}`) ?? '').trim() }))
      .filter((o) => o.label);
    if (opts.length >= 2) {
      await supabase.from('assessment_options').insert(
        opts.map((o, i) => ({
          organization_id: ctx.organizationId!,
          question_id: question.id,
          label: o.label,
          is_correct: String(o.n) === correct,
          position: i,
        })),
      );
    }
  }

  revalidatePath(`/dashboard/assessments/${assessmentId}`);
  return { success: true };
}

/** Plain form action (used directly on a <form>), so it takes FormData only. */
export async function publishAssessmentAction(formData: FormData): Promise<void> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return;
  if (!can(ctx, 'assessments.manage')) return;
  const id = String(formData.get('assessmentId') ?? '');
  const supabase = await createClient();
  await supabase
    .from('assessments')
    .update({ status: 'published' })
    .eq('id', id)
    .eq('organization_id', ctx.organizationId);
  revalidatePath(`/dashboard/assessments/${id}`);
}
