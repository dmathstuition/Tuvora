'use server';

import { randomBytes } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthContext } from '@/lib/auth/context';
import { assertCan, ForbiddenError } from '@/lib/permissions';
import { publicEnv } from '@/lib/public-env';

export interface PortalAccessStatus {
  linked: boolean;
  email: string | null;
  invite: { token: string; url: string; acceptedAt: string | null } | null;
}

function inviteUrl(token: string): string {
  return `${publicEnv.appUrl}/signup?invite=${token}`;
}

/** Portal-access status for a learner: linked, invited (with link), or neither. */
export async function getPortalAccessStatus(learnerId: string): Promise<PortalAccessStatus> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return { linked: false, email: null, invite: null };
  assertCan(ctx, 'learners.view');
  const supabase = await createClient();

  const { data: learner } = await supabase
    .from('learners')
    .select('email, user_id')
    .eq('id', learnerId)
    .eq('organization_id', ctx.organizationId)
    .maybeSingle();

  const { data: invite } = await supabase
    .from('learner_portal_invites')
    .select('token, accepted_at')
    .eq('learner_id', learnerId)
    .eq('organization_id', ctx.organizationId)
    .maybeSingle();

  return {
    linked: !!learner?.user_id,
    email: learner?.email ?? null,
    invite: invite ? { token: invite.token, url: inviteUrl(invite.token), acceptedAt: invite.accepted_at } : null,
  };
}

export type InviteState = { error?: string; url?: string };

/**
 * Create (or refresh) a portal invite for a learner and return the invite link.
 * Requires the learner to have an email. Enforces learners.update.
 */
export async function invitePortalAction(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return { error: 'No active organization' };

  try {
    assertCan(ctx, 'learners.update');
  } catch (e) {
    if (e instanceof ForbiddenError) return { error: 'You cannot invite learners.' };
    throw e;
  }

  const learnerId = formData.get('learnerId') as string;
  if (!learnerId) return { error: 'No learner specified.' };

  const supabase = await createClient();
  const { data: learner } = await supabase
    .from('learners')
    .select('email, user_id')
    .eq('id', learnerId)
    .eq('organization_id', ctx.organizationId)
    .maybeSingle();
  if (!learner) return { error: 'Learner not found.' };
  if (learner.user_id) return { error: 'This learner already has portal access.' };
  if (!learner.email) return { error: 'Add an email to this learner before inviting them.' };

  const token = randomBytes(24).toString('base64url');
  const { error } = await supabase.from('learner_portal_invites').upsert(
    {
      organization_id: ctx.organizationId,
      learner_id: learnerId,
      email: learner.email,
      token,
      invited_by: ctx.userId,
      expires_at: new Date(Date.now() + 30 * 86_400_000).toISOString(),
    },
    { onConflict: 'learner_id' },
  );
  if (error) return { error: 'Could not create the invite.' };

  await supabase.from('audit_logs').insert({
    organization_id: ctx.organizationId,
    actor_id: ctx.userId,
    action: 'learner.portal_invited',
    resource_type: 'learner',
    resource_id: learnerId,
    metadata: { email: learner.email },
  });

  // TODO: when Resend is wired, email the invite link to learner.email here.
  revalidatePath(`/dashboard/learners/${learnerId}`);
  return { url: inviteUrl(token) };
}

/**
 * Consume a portal invite token during signup, linking the learner record to
 * the newly created user. Runs under the service role (called from signUpAction
 * after the auth user exists). Idempotent: an already-accepted or unknown token
 * is a silent no-op.
 */
export async function consumePortalInvite(token: string, userId: string): Promise<void> {
  if (!token) return;
  const admin = createAdminClient();

  const { data: invite } = await admin
    .from('learner_portal_invites')
    .select('id, learner_id, accepted_at, expires_at')
    .eq('token', token)
    .maybeSingle();
  if (!invite || invite.accepted_at) return;
  if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) return;

  await admin.from('learners').update({ user_id: userId }).eq('id', invite.learner_id);
  await admin
    .from('learner_portal_invites')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', invite.id);
}

/** Look up the invited email for a token, to prefill the signup form. */
export async function getInviteEmail(token: string): Promise<string | null> {
  if (!token) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from('learner_portal_invites')
    .select('email, accepted_at')
    .eq('token', token)
    .maybeSingle();
  if (!data || data.accepted_at) return null;
  return data.email;
}
