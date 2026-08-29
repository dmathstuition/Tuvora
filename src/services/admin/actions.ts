'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthContext } from '@/lib/auth/context';
import { isSuperAdmin } from '@/lib/permissions';
import { slugify } from '@/lib/utils';
import type { Json } from '@/types/database.types';
import { z } from 'zod';

async function requireSuperAdmin() {
  const ctx = await getAuthContext();
  if (!ctx || !isSuperAdmin(ctx)) return null;
  return ctx;
}

export type AdminActionState = { error?: string; success?: boolean };

const featureSchema = z.object({
  name: z.string().min(2).max(60),
  slug: z.string().min(2).max(60).optional().or(z.literal('')),
  type: z.enum(['boolean', 'numeric', 'unlimited']),
  description: z.string().max(200).optional().or(z.literal('')),
});

export async function createFeatureAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const ctx = await requireSuperAdmin();
  if (!ctx) return { error: 'Super admin access required.' };

  const parsed = featureSchema.safeParse({
    name: formData.get('name'),
    slug: formData.get('slug') || '',
    type: formData.get('type'),
    description: formData.get('description') || '',
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Check the form' };

  const slug = parsed.data.slug || slugify(parsed.data.name);
  const defaultValue = parsed.data.type === 'boolean' ? false : parsed.data.type === 'unlimited' ? { unlimited: true } : { limit: 0 };

  const supabase = await createClient();
  const { error } = await supabase.from('features').insert({
    name: parsed.data.name,
    slug,
    type: parsed.data.type,
    description: parsed.data.description || null,
    default_value: defaultValue,
  });
  if (error) return { error: error.message.includes('duplicate') ? 'That slug already exists.' : 'Could not create the feature.' };

  revalidatePath('/admin/features');
  return { success: true };
}

const couponSchema = z.object({
  code: z.string().min(3).max(40),
  description: z.string().max(200).optional().or(z.literal('')),
  discountType: z.enum(['percent', 'fixed']),
  discountValue: z.coerce.number().int().min(1),
  currency: z.string().optional().or(z.literal('')),
  maxRedemptions: z.coerce.number().int().min(1).optional(),
  expiresAt: z.string().optional().or(z.literal('')),
});

export async function createCouponAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const ctx = await requireSuperAdmin();
  if (!ctx) return { error: 'Super admin access required.' };

  const parsed = couponSchema.safeParse({
    code: formData.get('code'),
    description: formData.get('description') || '',
    discountType: formData.get('discountType'),
    discountValue: formData.get('discountValue'),
    currency: formData.get('currency') || '',
    maxRedemptions: formData.get('maxRedemptions') || undefined,
    expiresAt: formData.get('expiresAt') || '',
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Check the form' };

  if (parsed.data.discountType === 'percent' && parsed.data.discountValue > 100) {
    return { error: 'Percentage discounts cannot exceed 100%.' };
  }
  if (parsed.data.discountType === 'fixed' && !parsed.data.currency) {
    return { error: 'Choose a currency for a fixed-amount coupon.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('coupons').insert({
    code: parsed.data.code.toUpperCase(),
    description: parsed.data.description || null,
    discount_type: parsed.data.discountType,
    discount_value: parsed.data.discountValue,
    currency: parsed.data.discountType === 'fixed' ? parsed.data.currency : null,
    max_redemptions: parsed.data.maxRedemptions ?? null,
    expires_at: parsed.data.expiresAt ? new Date(parsed.data.expiresAt).toISOString() : null,
    created_by: ctx.userId,
  });
  if (error) return { error: error.message.includes('duplicate') ? 'That code already exists.' : 'Could not create the coupon.' };

  revalidatePath('/admin/coupons');
  return { success: true };
}

export async function toggleCouponAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const ctx = await requireSuperAdmin();
  if (!ctx) return { error: 'Super admin access required.' };

  const id = formData.get('couponId') as string;
  const active = formData.get('active') === 'true';
  if (!id) return { error: 'Missing coupon.' };

  const supabase = await createClient();
  const { error } = await supabase.from('coupons').update({ is_active: active }).eq('id', id);
  if (error) return { error: 'Could not update the coupon.' };

  revalidatePath('/admin/coupons');
  return { success: true };
}

const TICKET_STATUSES = ['open', 'pending', 'resolved', 'closed'] as const;

export async function updateTicketStatusAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const ctx = await getAuthContext();
  const { isPlatformStaff } = await import('@/lib/permissions');
  if (!ctx || !isPlatformStaff(ctx)) return { error: 'Platform staff access required.' };

  const id = formData.get('ticketId') as string;
  const status = formData.get('status') as (typeof TICKET_STATUSES)[number];
  if (!id || !TICKET_STATUSES.includes(status)) return { error: 'Invalid request.' };

  const supabase = await createClient();
  const { error } = await supabase.from('support_tickets').update({ status }).eq('id', id);
  if (error) return { error: 'Could not update the ticket.' };

  revalidatePath('/admin/support');
  return { success: true };
}

// ---------------------------------------------------------------------------
// Super-admin destructive actions
//
// These act across tenants, so they use the service-role client AFTER a strict
// super-admin check. Each is append-only audit-logged with organization_id null
// (the log row survives even when the org it referenced is deleted).
// ---------------------------------------------------------------------------

async function logPlatformAction(
  actorId: string,
  action: string,
  resourceType: string,
  resourceId: string,
  metadata: Json,
) {
  const admin = createAdminClient();
  await admin.from('audit_logs').insert({
    organization_id: null,
    actor_id: actorId,
    action,
    resource_type: resourceType,
    resource_id: resourceId,
    metadata,
  });
}

/** Archive (soft-disable) an organization without deleting its data. */
export async function archiveOrganizationAction(formData: FormData): Promise<void> {
  const ctx = await requireSuperAdmin();
  if (!ctx) return;
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  const admin = createAdminClient();
  await admin
    .from('organizations')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id);
  await logPlatformAction(ctx.userId, 'org.archived', 'organization', id, {});
  revalidatePath('/admin/organizations');
}

/** Restore a previously archived organization. */
export async function restoreOrganizationAction(formData: FormData): Promise<void> {
  const ctx = await requireSuperAdmin();
  if (!ctx) return;
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  const admin = createAdminClient();
  await admin.from('organizations').update({ archived_at: null }).eq('id', id);
  await logPlatformAction(ctx.userId, 'org.restored', 'organization', id, {});
  revalidatePath('/admin/organizations');
}

/**
 * Permanently delete an organization and ALL of its data. Tenant tables carry
 * `organization_id … on delete cascade`, so this removes learners, classes,
 * subscriptions, billing, etc. in one go. Irreversible.
 */
export async function deleteOrganizationAction(formData: FormData): Promise<void> {
  const ctx = await requireSuperAdmin();
  if (!ctx) return;
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  const admin = createAdminClient();

  const { data: org } = await admin
    .from('organizations')
    .select('name')
    .eq('id', id)
    .maybeSingle();

  await admin.from('organizations').delete().eq('id', id);
  await logPlatformAction(ctx.userId, 'org.deleted', 'organization', id, {
    name: org?.name ?? null,
  });
  revalidatePath('/admin/organizations');
}

/** Permanently delete a coupon. */
export async function deleteCouponAction(formData: FormData): Promise<void> {
  const ctx = await requireSuperAdmin();
  if (!ctx) return;
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  const admin = createAdminClient();
  await admin.from('coupons').delete().eq('id', id);
  await logPlatformAction(ctx.userId, 'coupon.deleted', 'coupon', id, {});
  revalidatePath('/admin/coupons');
}

/**
 * Delete a feature from the catalogue. Guarded server-side: no-op while any plan
 * still grants it, so plan entitlements never dangle. (The UI only offers the
 * button when the feature is in zero plans.)
 */
export async function deleteFeatureAction(formData: FormData): Promise<void> {
  const ctx = await requireSuperAdmin();
  if (!ctx) return;
  const id = String(formData.get('id') ?? '');
  if (!id) return;

  const admin = createAdminClient();
  const { count } = await admin
    .from('plan_features')
    .select('plan_id', { count: 'exact', head: true })
    .eq('feature_id', id);
  if ((count ?? 0) > 0) return; // still used by a plan — refuse

  await admin.from('features').delete().eq('id', id);
  await logPlatformAction(ctx.userId, 'feature.deleted', 'feature', id, {});
  revalidatePath('/admin/features');
}

/**
 * Delete a subscription plan. Guarded server-side: no-op while any org still has
 * a live subscription on it, so tenants never lose their plan. (The UI only
 * offers the button when the plan has zero live subscribers.)
 */
export async function deletePlanAction(formData: FormData): Promise<void> {
  const ctx = await requireSuperAdmin();
  if (!ctx) return;
  const id = String(formData.get('id') ?? '');
  if (!id) return;

  const admin = createAdminClient();
  const { count } = await admin
    .from('subscriptions')
    .select('id', { count: 'exact', head: true })
    .eq('plan_id', id)
    .in('status', ['trialing', 'active', 'past_due', 'paused']);
  if ((count ?? 0) > 0) return; // still has live subscribers — refuse

  await admin.from('subscription_plans').delete().eq('id', id);
  await logPlatformAction(ctx.userId, 'plan.deleted', 'plan', id, {});
  revalidatePath('/admin/plans');
}

/** Permanently delete a support ticket. */
export async function deleteTicketAction(formData: FormData): Promise<void> {
  const ctx = await requireSuperAdmin();
  if (!ctx) return;
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  const admin = createAdminClient();
  await admin.from('support_tickets').delete().eq('id', id);
  await logPlatformAction(ctx.userId, 'ticket.deleted', 'support_ticket', id, {});
  revalidatePath('/admin/support');
}
