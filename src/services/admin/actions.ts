'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/auth/context';
import { isSuperAdmin } from '@/lib/permissions';
import { slugify } from '@/lib/utils';
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
