'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/auth/context';
import { z } from 'zod';

export interface EnrollmentContext {
  valid: boolean;
  expired?: boolean;
  learnerId?: string;
  learnerName?: string;
  orgName?: string;
  email?: string;
  alreadySubmitted?: boolean;
  token: string;
}

/** Resolve an enrollment invite token (public, service-role) for the intake form. */
export async function getEnrollmentContext(token: string): Promise<EnrollmentContext> {
  if (!token) return { valid: false, token };
  const admin = createAdminClient();

  const { data: invite } = await admin
    .from('learner_portal_invites')
    .select('learner_id, organization_id, email, expires_at')
    .eq('token', token)
    .maybeSingle();
  if (!invite) return { valid: false, token };
  if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) {
    return { valid: false, expired: true, token };
  }

  const [{ data: learner }, { data: org }, { data: intake }] = await Promise.all([
    admin.from('learners').select('first_name, last_name').eq('id', invite.learner_id).maybeSingle(),
    admin.from('organizations').select('name').eq('id', invite.organization_id).maybeSingle(),
    admin.from('learner_intake').select('submitted_at').eq('learner_id', invite.learner_id).maybeSingle(),
  ]);

  return {
    valid: true,
    token,
    learnerId: invite.learner_id,
    learnerName: learner ? `${learner.first_name} ${learner.last_name ?? ''}`.trim() : 'your child',
    orgName: org?.name ?? 'the academy',
    email: invite.email ?? undefined,
    alreadySubmitted: !!intake?.submitted_at,
  };
}

const intakeSchema = z.object({
  parentName: z.string().min(2, 'Enter the parent/guardian name').max(120),
  parentEmail: z.string().email('Enter a valid email').optional().or(z.literal('')),
  parentPhone: z.string().max(40).optional().or(z.literal('')),
  relationship: z.string().max(40).optional().or(z.literal('')),
  parentOccupation: z.string().max(80).optional().or(z.literal('')),
  dateOfBirth: z.string().optional().or(z.literal('')),
  currentSchool: z.string().max(120).optional().or(z.literal('')),
  currentGrade: z.string().max(60).optional().or(z.literal('')),
  strengths: z.string().max(1000).optional().or(z.literal('')),
  weaknesses: z.string().max(1000).optional().or(z.literal('')),
  learningGoals: z.string().max(1000).optional().or(z.literal('')),
  specialNeeds: z.string().max(1000).optional().or(z.literal('')),
  preferredMode: z.string().max(20).optional().or(z.literal('')),
  sessionsPerWeek: z.coerce.number().int().min(0).max(14).optional(),
  preferredTimes: z.string().max(200).optional().or(z.literal('')),
  emergencyContactName: z.string().max(120).optional().or(z.literal('')),
  emergencyContactPhone: z.string().max(40).optional().or(z.literal('')),
  howHeard: z.string().max(120).optional().or(z.literal('')),
});

export type IntakeState = { error?: string; success?: boolean };

export async function submitIntakeAction(_prev: IntakeState, formData: FormData): Promise<IntakeState> {
  const token = String(formData.get('token') ?? '');
  const ctxData = await getEnrollmentContext(token);
  if (!ctxData.valid || !ctxData.learnerId) return { error: 'This enrolment link is not valid.' };

  const parsed = intakeSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Please check the form' };
  const d = parsed.data;

  const admin = createAdminClient();

  // Resolve org for the learner.
  const { data: learner } = await admin
    .from('learners')
    .select('organization_id')
    .eq('id', ctxData.learnerId)
    .maybeSingle();
  if (!learner) return { error: 'Learner not found.' };
  const orgId = learner.organization_id;

  const subjects = String(formData.get('subjectsOfInterest') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const preferredDays = formData.getAll('preferredDays').map(String).filter(Boolean);

  const { error } = await admin.from('learner_intake').upsert(
    {
      organization_id: orgId,
      learner_id: ctxData.learnerId,
      parent_name: d.parentName,
      parent_email: d.parentEmail || null,
      parent_phone: d.parentPhone || null,
      relationship: d.relationship || null,
      parent_occupation: d.parentOccupation || null,
      date_of_birth: d.dateOfBirth || null,
      current_school: d.currentSchool || null,
      current_grade: d.currentGrade || null,
      subjects_of_interest: subjects,
      strengths: d.strengths || null,
      weaknesses: d.weaknesses || null,
      learning_goals: d.learningGoals || null,
      special_needs: d.specialNeeds || null,
      preferred_mode: d.preferredMode || null,
      sessions_per_week: d.sessionsPerWeek ?? null,
      preferred_days: preferredDays,
      preferred_times: d.preferredTimes || null,
      emergency_contact_name: d.emergencyContactName || null,
      emergency_contact_phone: d.emergencyContactPhone || null,
      how_heard: d.howHeard || null,
      submitted_at: new Date().toISOString(),
    },
    { onConflict: 'learner_id' },
  );
  if (error) return { error: 'Could not save the form. Please try again.' };

  // Reflect a couple of fields on the learner record + create/link a parent.
  if (d.dateOfBirth) {
    await admin.from('learners').update({ date_of_birth: d.dateOfBirth }).eq('id', ctxData.learnerId);
  }
  if (d.parentName) {
    const [firstName, ...rest] = d.parentName.split(' ');
    const { data: parent } = await admin
      .from('parents')
      .insert({
        organization_id: orgId,
        first_name: firstName || d.parentName,
        last_name: rest.join(' ') || null,
        email: d.parentEmail || null,
        phone: d.parentPhone || null,
      })
      .select('id')
      .single();
    if (parent) {
      await admin.from('parent_learners').insert({
        organization_id: orgId,
        parent_id: parent.id,
        learner_id: ctxData.learnerId,
        relationship: d.relationship || null,
      });
    }
  }

  await admin.from('audit_logs').insert({
    organization_id: orgId,
    action: 'learner.intake_submitted',
    resource_type: 'learner',
    resource_id: ctxData.learnerId,
    metadata: { parent: d.parentName },
  });

  return { success: true };
}

export interface LearnerIntake {
  parentName: string | null;
  parentEmail: string | null;
  parentPhone: string | null;
  relationship: string | null;
  currentSchool: string | null;
  currentGrade: string | null;
  subjects: string[];
  strengths: string | null;
  weaknesses: string | null;
  learningGoals: string | null;
  specialNeeds: string | null;
  preferredMode: string | null;
  sessionsPerWeek: number | null;
  preferredDays: string[];
  preferredTimes: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  howHeard: string | null;
  submittedAt: string | null;
}

/** Tutor-side reader for a learner's submitted intake (RLS-scoped). */
export async function getLearnerIntake(learnerId: string): Promise<LearnerIntake | null> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from('learner_intake')
    .select('*')
    .eq('learner_id', learnerId)
    .eq('organization_id', ctx.organizationId)
    .maybeSingle();
  if (!data) return null;
  return {
    parentName: data.parent_name,
    parentEmail: data.parent_email,
    parentPhone: data.parent_phone,
    relationship: data.relationship,
    currentSchool: data.current_school,
    currentGrade: data.current_grade,
    subjects: data.subjects_of_interest ?? [],
    strengths: data.strengths,
    weaknesses: data.weaknesses,
    learningGoals: data.learning_goals,
    specialNeeds: data.special_needs,
    preferredMode: data.preferred_mode,
    sessionsPerWeek: data.sessions_per_week,
    preferredDays: data.preferred_days ?? [],
    preferredTimes: data.preferred_times,
    emergencyContactName: data.emergency_contact_name,
    emergencyContactPhone: data.emergency_contact_phone,
    howHeard: data.how_heard,
    submittedAt: data.submitted_at,
  };
}
