'use server';

import { randomBytes } from 'node:crypto';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthContext } from '@/lib/auth/context';
import { assertCan, ForbiddenError } from '@/lib/permissions';
import { getRequestBaseUrl } from '@/lib/base-url';
import { uploadPublicImage } from '@/lib/storage/images';
import { inviteMemberSchema } from '@/schemas/organization';
import type { OrgRole } from '@/constants/roles';

export interface MemberRow {
  id: string;
  userId: string;
  name: string | null;
  email: string;
  role: OrgRole;
  status: string;
  isSelf: boolean;
  avatarUrl: string | null;
}
export interface PendingInvite {
  id: string;
  email: string;
  role: OrgRole;
  url: string;
}

export async function listTeam(): Promise<{ members: MemberRow[]; invites: PendingInvite[] }> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return { members: [], invites: [] };
  assertCan(ctx, 'members.view');
  const supabase = await createClient();

  const { data: members } = await supabase
    .from('organization_members')
    .select('id, user_id, role, status')
    .eq('organization_id', ctx.organizationId)
    .neq('status', 'removed')
    .order('created_at', { ascending: true });
  const rows = members ?? [];

  const profileById = new Map<string, { name: string | null; email: string; avatarUrl: string | null }>();
  if (rows.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url')
      .in('id', rows.map((m) => m.user_id));
    for (const p of profiles ?? [])
      profileById.set(p.id, { name: p.full_name, email: p.email, avatarUrl: p.avatar_url });
  }

  const canManageInvites = ctx.role === 'owner' || ctx.role === 'admin';
  let invites: PendingInvite[] = [];
  if (canManageInvites) {
    const { data: inv } = await supabase
      .from('organization_invitations')
      .select('id, email, role, token, accepted_at')
      .eq('organization_id', ctx.organizationId)
      .is('accepted_at', null);
    const baseUrl = await getRequestBaseUrl();
    invites = (inv ?? []).map((i) => ({
      id: i.id,
      email: i.email,
      role: i.role,
      url: `${baseUrl}/accept-invite?token=${i.token}`,
    }));
  }

  return {
    members: rows.map((m) => ({
      id: m.id,
      userId: m.user_id,
      name: profileById.get(m.user_id)?.name ?? null,
      email: profileById.get(m.user_id)?.email ?? '—',
      role: m.role,
      status: m.status,
      isSelf: m.user_id === ctx.userId,
      avatarUrl: profileById.get(m.user_id)?.avatarUrl ?? null,
    })),
    invites,
  };
}

export type MemberAvatarState = { error?: string; success?: boolean };

/**
 * Admin uploads a team member's profile photo. Writes to the member's profile
 * via the service role (RLS blocks editing another user's profile), after
 * confirming the caller may manage members and the target is in this org.
 */
export async function uploadMemberAvatarAction(
  _prev: MemberAvatarState,
  formData: FormData,
): Promise<MemberAvatarState> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return { error: 'No active organization' };
  try {
    assertCan(ctx, 'members.manage');
  } catch (e) {
    if (e instanceof ForbiddenError) return { error: 'You cannot manage members.' };
    throw e;
  }

  const memberId = String(formData.get('id') ?? '');
  if (!memberId) return { error: 'Missing member.' };

  const supabase = await createClient();
  const { data: member } = await supabase
    .from('organization_members')
    .select('user_id')
    .eq('id', memberId)
    .eq('organization_id', ctx.organizationId)
    .neq('status', 'removed')
    .maybeSingle();
  if (!member) return { error: 'Member not found.' };

  const uploaded = await uploadPublicImage(
    `${ctx.organizationId}/avatars/member-${member.user_id}`,
    formData.get('image'),
  );
  if (uploaded.error || !uploaded.url) return { error: uploaded.error ?? 'Upload failed.' };

  const admin = createAdminClient();
  const { error } = await admin
    .from('profiles')
    .update({ avatar_url: uploaded.url })
    .eq('id', member.user_id);
  if (error) return { error: 'Could not save the photo.' };

  revalidatePath('/dashboard/settings/team');
  revalidatePath('/', 'layout');
  return { success: true };
}

export type InviteMemberState = { error?: string; url?: string };

export async function inviteMemberAction(
  _prev: InviteMemberState,
  formData: FormData,
): Promise<InviteMemberState> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return { error: 'No active organization' };
  try {
    assertCan(ctx, 'members.invite');
  } catch (e) {
    if (e instanceof ForbiddenError) return { error: 'You cannot invite members.' };
    throw e;
  }

  const parsed = inviteMemberSchema.safeParse({
    email: formData.get('email'),
    role: formData.get('role'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Check the form' };

  const supabase = await createClient();
  const token = randomBytes(24).toString('base64url');
  const { error } = await supabase.from('organization_invitations').upsert(
    {
      organization_id: ctx.organizationId,
      email: parsed.data.email,
      role: parsed.data.role,
      token,
      invited_by: ctx.userId,
      expires_at: new Date(Date.now() + 14 * 86_400_000).toISOString(),
    },
    { onConflict: 'organization_id,email' },
  );
  if (error) return { error: 'Could not create the invite.' };

  await supabase.from('audit_logs').insert({
    organization_id: ctx.organizationId,
    actor_id: ctx.userId,
    action: 'member.invited',
    resource_type: 'organization',
    metadata: { email: parsed.data.email, role: parsed.data.role },
  });

  // TODO: email the invite via Resend when wired.
  revalidatePath('/dashboard/settings/team');
  return { url: `${await getRequestBaseUrl()}/accept-invite?token=${token}` };
}

export type MemberActionState = { error?: string; success?: boolean };

export async function changeMemberRoleAction(
  _prev: MemberActionState,
  formData: FormData,
): Promise<MemberActionState> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return { error: 'No active organization' };
  try {
    assertCan(ctx, 'members.manage');
  } catch (e) {
    if (e instanceof ForbiddenError) return { error: 'You cannot manage members.' };
    throw e;
  }

  const memberId = formData.get('memberId') as string;
  const role = formData.get('role') as OrgRole;
  if (!memberId || !role) return { error: 'Missing details.' };
  if (role === 'owner') return { error: 'Ownership transfer is not available here.' };

  const supabase = await createClient();
  const { data: target } = await supabase
    .from('organization_members')
    .select('role')
    .eq('id', memberId)
    .eq('organization_id', ctx.organizationId)
    .maybeSingle();
  if (!target) return { error: 'Member not found.' };
  if (target.role === 'owner') return { error: 'You cannot change the owner’s role.' };

  const { error } = await supabase
    .from('organization_members')
    .update({ role })
    .eq('id', memberId)
    .eq('organization_id', ctx.organizationId);
  if (error) return { error: 'Could not update the role.' };

  revalidatePath('/dashboard/settings/team');
  return { success: true };
}

export async function removeMemberAction(
  _prev: MemberActionState,
  formData: FormData,
): Promise<MemberActionState> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return { error: 'No active organization' };
  try {
    assertCan(ctx, 'members.remove');
  } catch (e) {
    if (e instanceof ForbiddenError) return { error: 'You cannot remove members.' };
    throw e;
  }

  const memberId = formData.get('memberId') as string;
  if (!memberId) return { error: 'Missing member.' };

  const supabase = await createClient();
  const { data: target } = await supabase
    .from('organization_members')
    .select('role, user_id')
    .eq('id', memberId)
    .eq('organization_id', ctx.organizationId)
    .maybeSingle();
  if (!target) return { error: 'Member not found.' };
  if (target.role === 'owner') return { error: 'You cannot remove the owner.' };
  if (target.user_id === ctx.userId) return { error: 'You cannot remove yourself.' };

  const { error } = await supabase
    .from('organization_members')
    .update({ status: 'removed' })
    .eq('id', memberId)
    .eq('organization_id', ctx.organizationId);
  if (error) return { error: 'Could not remove the member.' };

  revalidatePath('/dashboard/settings/team');
  return { success: true };
}

/**
 * Accept an organization invitation for the signed-in user (form action). Runs
 * the membership insert under the service role (self-insert into
 * organization_members is disallowed by RLS to prevent privilege escalation),
 * after verifying the token. Redirects to the dashboard on success or back to
 * the accept page with an error flag otherwise.
 */
export async function acceptInviteAction(formData: FormData): Promise<void> {
  const token = String(formData.get('token') ?? '');
  if (!token) redirect('/accept-invite?error=invalid');

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=${encodeURIComponent(`/accept-invite?token=${token}`)}`);

  const admin = createAdminClient();
  const { data: invite } = await admin
    .from('organization_invitations')
    .select('id, organization_id, role, accepted_at, expires_at')
    .eq('token', token)
    .maybeSingle();
  if (!invite || invite.accepted_at) redirect('/accept-invite?error=invalid');
  if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) {
    redirect('/accept-invite?error=expired');
  }

  await admin
    .from('organization_members')
    .upsert(
      {
        organization_id: invite.organization_id,
        user_id: user.id,
        role: invite.role,
        status: 'active',
        joined_at: new Date().toISOString(),
      },
      { onConflict: 'organization_id,user_id' },
    );
  await admin
    .from('organization_invitations')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', invite.id);
  await admin
    .from('profiles')
    .update({ last_active_organization_id: invite.organization_id })
    .eq('id', user.id);

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}
