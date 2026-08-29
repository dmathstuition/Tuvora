'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { effectiveEnabledFeatures } from '@/lib/portal/feature-flags';
import { getPlatformFeatureAvailability } from '@/services/portal/features';

const DAILY_LIMIT = 20;

export type SolveState = {
  error?: string;
  question?: string;
  answer?: string;
  remaining?: number;
};

interface AnthropicBlock {
  type: string;
  text?: string;
}

async function resolveLearner(): Promise<{ userId: string; learnerId: string; orgId: string } | null> {
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
  return data ? { userId: user.id, learnerId: data.id, orgId: data.organization_id } : null;
}

/**
 * Kid-safe step-by-step maths tutor. Explains the working rather than just
 * handing over the answer. Guarded by the question_solver feature flag and a
 * daily per-learner cap (tracked in audit_logs, so no extra table).
 */
export async function solveQuestionAction(
  _prev: SolveState,
  formData: FormData,
): Promise<SolveState> {
  const who = await resolveLearner();
  if (!who) return { error: 'Please sign in again.' };

  const question = String(formData.get('question') ?? '').trim();
  if (question.length < 3) return { error: 'Type a question to solve.' };
  if (question.length > 1000) return { error: 'That question is a bit long — please shorten it.' };

  const admin = createAdminClient();

  // Feature gate (platform + academy).
  const [{ data: org }, platform] = await Promise.all([
    admin.from('organizations').select('portal_preferences').eq('id', who.orgId).maybeSingle(),
    getPlatformFeatureAvailability(),
  ]);
  if (!effectiveEnabledFeatures(org?.portal_preferences, platform).has('question_solver')) {
    return { error: 'The question solver is turned off for your academy.' };
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return {
      error: "The AI tutor isn't set up yet — ask your tutor to enable it.",
      question,
    };
  }

  // Daily rate limit via audit_logs.
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const { count } = await admin
    .from('audit_logs')
    .select('id', { count: 'exact', head: true })
    .eq('actor_id', who.userId)
    .eq('action', 'ai.solve')
    .gte('created_at', startOfDay.toISOString());
  const used = count ?? 0;
  if (used >= DAILY_LIMIT) {
    return { error: "You've used all your AI helper questions for today — come back tomorrow!", question };
  }

  const prompt = `You are a friendly, encouraging maths tutor for a school student. A student asks:\n\n"${question}"\n\nHelp them understand. Rules:\n- Work through it step by step in plain, simple language a student can follow.\n- Number each step (1., 2., 3., …).\n- Keep it concise and age-appropriate; be encouraging.\n- If it is not a maths/school question, gently say you can only help with schoolwork.\n- End with a final line exactly like: "Answer: <the final answer>".\nReturn plain text only (no markdown, no code fences).`;

  let answer = '';
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: process.env.PLACEMENT_MODEL ?? 'claude-sonnet-5',
        max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) return { error: 'The AI tutor is busy right now — please try again.', question };
    const data = (await res.json()) as { content?: AnthropicBlock[] };
    answer = (data.content?.find((b) => b.type === 'text')?.text ?? '').trim();
  } catch {
    return { error: 'Could not reach the AI tutor — please try again.', question };
  }
  if (!answer) return { error: 'No answer came back — please rephrase and try again.', question };

  await admin.from('audit_logs').insert({
    organization_id: who.orgId,
    actor_id: who.userId,
    action: 'ai.solve',
    resource_type: 'learner',
    resource_id: who.learnerId,
    metadata: { q: question.slice(0, 200) },
  });

  return { question, answer, remaining: Math.max(0, DAILY_LIMIT - used - 1) };
}
