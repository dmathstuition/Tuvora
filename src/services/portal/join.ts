'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentLearner } from '@/lib/portal/current-learner';

const ownLearner = getCurrentLearner;

export interface JoinPreview {
  valid: boolean;
  className?: string;
  alreadyIn?: boolean;
}

/** Look up a class by its join code (scoped to the learner's own academy). */
export async function getClassByCode(code: string): Promise<JoinPreview> {
  const learner = await ownLearner();
  if (!learner || !code) return { valid: false };
  const admin = createAdminClient();
  const { data: klass } = await admin
    .from('classes')
    .select('id, name, organization_id')
    .eq('join_code', code.trim().toUpperCase())
    .maybeSingle();
  if (!klass || klass.organization_id !== learner.organizationId) return { valid: false };

  const { data: member } = await admin
    .from('class_members')
    .select('id')
    .eq('class_id', klass.id)
    .eq('learner_id', learner.id)
    .maybeSingle();

  return { valid: true, className: klass.name, alreadyIn: !!member };
}

export type JoinState = { error?: string; success?: string; className?: string };

/** Enrol the signed-in learner into a class using its join code. */
export async function joinClassByCodeAction(_prev: JoinState, formData: FormData): Promise<JoinState> {
  const learner = await ownLearner();
  if (!learner) return { error: 'Please sign in again.' };
  const code = String(formData.get('code') ?? '').trim().toUpperCase();
  if (!code) return { error: 'Enter a class code.' };

  const admin = createAdminClient();
  const { data: klass } = await admin
    .from('classes')
    .select('id, name, organization_id, status')
    .eq('join_code', code)
    .maybeSingle();
  if (!klass || klass.organization_id !== learner.organizationId) {
    return { error: "That code doesn't match a class in your academy." };
  }

  const { data: existing } = await admin
    .from('class_members')
    .select('id')
    .eq('class_id', klass.id)
    .eq('learner_id', learner.id)
    .maybeSingle();
  if (existing) return { success: `You're already in ${klass.name}.`, className: klass.name };

  const { error } = await admin.from('class_members').insert({
    organization_id: learner.organizationId,
    class_id: klass.id,
    learner_id: learner.id,
  });
  if (error) return { error: 'Could not join the class. Please try again.' };

  revalidatePath('/portal');
  revalidatePath('/portal/learn');
  return { success: `You've joined ${klass.name}! 🎉`, className: klass.name };
}
