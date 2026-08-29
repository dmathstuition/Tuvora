'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthContext } from '@/lib/auth/context';
import { assertCan, can, ForbiddenError } from '@/lib/permissions';

export interface Certificate {
  id: string;
  title: string;
  type: string;
  description: string | null;
  serial: string;
  issuedAt: string;
  revokedAt: string | null;
  learnerId: string;
  learnerName?: string;
  orgName?: string;
}

function makeSerial(): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `TVR-CERT-${new Date().getFullYear()}-${rand}`;
}

// ---------------------------------------------------------------------------
// Teacher side
// ---------------------------------------------------------------------------

export async function listCertificates(): Promise<Certificate[]> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return [];
  assertCan(ctx, 'reports.view');
  const supabase = await createClient();
  const { data } = await supabase
    .from('certificates')
    .select('id, title, type, description, serial, issued_at, revoked_at, learner_id')
    .eq('organization_id', ctx.organizationId)
    .order('issued_at', { ascending: false })
    .limit(200);
  const rows = data ?? [];
  if (rows.length === 0) return [];
  const { data: learners } = await supabase
    .from('learners')
    .select('id, first_name, last_name')
    .in('id', rows.map((r) => r.learner_id));
  const nameById = new Map((learners ?? []).map((l) => [l.id, `${l.first_name} ${l.last_name ?? ''}`.trim()]));
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    type: r.type,
    description: r.description,
    serial: r.serial,
    issuedAt: r.issued_at,
    revokedAt: r.revoked_at,
    learnerId: r.learner_id,
    learnerName: nameById.get(r.learner_id) ?? 'Learner',
  }));
}

export type CertState = { error?: string; success?: boolean };

export async function issueCertificateAction(
  _prev: CertState,
  formData: FormData,
): Promise<CertState> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return { error: 'No active organization' };
  try {
    assertCan(ctx, 'reports.generate');
  } catch (e) {
    if (e instanceof ForbiddenError) return { error: 'You cannot issue certificates.' };
    throw e;
  }
  const learnerId = String(formData.get('learnerId') ?? '');
  const title = String(formData.get('title') ?? '').trim();
  const type = String(formData.get('type') ?? 'achievement');
  if (!learnerId) return { error: 'Choose a learner.' };
  if (title.length < 2) return { error: 'Enter a certificate title.' };

  const supabase = await createClient();
  const { error } = await supabase.from('certificates').insert({
    organization_id: ctx.organizationId,
    learner_id: learnerId,
    title,
    type,
    description: String(formData.get('description') ?? '').trim() || null,
    serial: makeSerial(),
    issued_by: ctx.userId,
  });
  if (error) return { error: 'Could not issue the certificate.' };

  await supabase.from('audit_logs').insert({
    organization_id: ctx.organizationId,
    actor_id: ctx.userId,
    action: 'certificate.issued',
    resource_type: 'learner',
    resource_id: learnerId,
    metadata: { title },
  });

  revalidatePath('/dashboard/certificates');
  revalidatePath('/portal/certificates');
  return { success: true };
}

export async function revokeCertificateAction(formData: FormData): Promise<void> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId || !can(ctx, 'reports.generate')) return;
  const id = String(formData.get('id') ?? '');
  const supabase = await createClient();
  await supabase
    .from('certificates')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', ctx.organizationId);
  revalidatePath('/dashboard/certificates');
  revalidatePath('/portal/certificates');
}

// ---------------------------------------------------------------------------
// Learner side (portal) — service role, bound to the signed-in learner.
// ---------------------------------------------------------------------------

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

export async function getMyCertificates(): Promise<Certificate[]> {
  const learner = await ownLearner();
  if (!learner) return [];
  const admin = createAdminClient();
  const { data } = await admin
    .from('certificates')
    .select('id, title, type, description, serial, issued_at, revoked_at, learner_id')
    .eq('learner_id', learner.id)
    .is('revoked_at', null)
    .order('issued_at', { ascending: false });
  return (data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    type: r.type,
    description: r.description,
    serial: r.serial,
    issuedAt: r.issued_at,
    revokedAt: r.revoked_at,
    learnerId: r.learner_id,
  }));
}

/** A single certificate for the printable page, verified to belong to the learner. */
export async function getMyCertificate(id: string): Promise<Certificate | null> {
  const learner = await ownLearner();
  if (!learner) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from('certificates')
    .select('id, title, type, description, serial, issued_at, revoked_at, learner_id')
    .eq('id', id)
    .maybeSingle();
  if (!data || data.learner_id !== learner.id || data.revoked_at) return null;

  const [{ data: l }, { data: org }] = await Promise.all([
    admin.from('learners').select('first_name, last_name').eq('id', learner.id).maybeSingle(),
    admin.from('organizations').select('name, portal_preferences, logo_url').eq('id', learner.organizationId).maybeSingle(),
  ]);
  const prefs = (org?.portal_preferences ?? {}) as { displayName?: string };
  return {
    id: data.id,
    title: data.title,
    type: data.type,
    description: data.description,
    serial: data.serial,
    issuedAt: data.issued_at,
    revokedAt: data.revoked_at,
    learnerId: data.learner_id,
    learnerName: l ? `${l.first_name} ${l.last_name ?? ''}`.trim() : 'Learner',
    orgName: prefs.displayName ?? org?.name ?? 'Academy',
  };
}
