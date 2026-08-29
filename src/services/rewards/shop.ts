'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthContext } from '@/lib/auth/context';
import { assertCan, ForbiddenError } from '@/lib/permissions';

const ACTIVE_STATUSES = ['pending', 'approved', 'fulfilled'];

export interface ShopItem {
  id: string;
  name: string;
  emoji: string | null;
  description: string | null;
  cost: number;
  stock: number | null;
  active: boolean;
}

export interface Redemption {
  id: string;
  itemName: string;
  pointsSpent: number;
  status: string;
  createdAt: string;
  learnerId?: string;
  learnerName?: string;
}

export interface Wallet {
  lifetime: number;
  reserved: number;
  spendable: number;
}

// ---------------------------------------------------------------------------
// Learner side (portal) — service role, ownership bound to the signed-in user.
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

async function walletFor(admin: ReturnType<typeof createAdminClient>, learnerId: string): Promise<Wallet> {
  const [{ data: lifetime }, { data: reds }] = await Promise.all([
    admin.rpc('learner_points', { learner: learnerId }),
    admin.from('reward_redemptions').select('points_spent, status').eq('learner_id', learnerId),
  ]);
  const reserved = (reds ?? [])
    .filter((r) => ACTIVE_STATUSES.includes(r.status))
    .reduce((s, r) => s + (r.points_spent ?? 0), 0);
  const life = lifetime ?? 0;
  return { lifetime: life, reserved, spendable: Math.max(0, life - reserved) };
}

export async function getShopForLearner(): Promise<{
  items: ShopItem[];
  redemptions: Redemption[];
  wallet: Wallet;
} | null> {
  const learner = await ownLearner();
  if (!learner) return null;
  const admin = createAdminClient();

  const [{ data: items }, { data: reds }, wallet] = await Promise.all([
    admin
      .from('reward_shop_items')
      .select('id, name, emoji, description, cost, stock, active')
      .eq('organization_id', learner.organizationId)
      .eq('active', true)
      .order('cost', { ascending: true }),
    admin
      .from('reward_redemptions')
      .select('id, item_name, points_spent, status, created_at')
      .eq('learner_id', learner.id)
      .order('created_at', { ascending: false })
      .limit(20),
    walletFor(admin, learner.id),
  ]);

  return {
    items: (items ?? []) as ShopItem[],
    redemptions: (reds ?? []).map((r) => ({
      id: r.id,
      itemName: r.item_name,
      pointsSpent: r.points_spent,
      status: r.status,
      createdAt: r.created_at,
    })),
    wallet,
  };
}

export type RedeemState = { error?: string; success?: string };

export async function redeemAction(_prev: RedeemState, formData: FormData): Promise<RedeemState> {
  const learner = await ownLearner();
  if (!learner) return { error: 'No linked learner account.' };
  const itemId = String(formData.get('itemId') ?? '');
  if (!itemId) return { error: 'Choose an item.' };

  const admin = createAdminClient();
  const { data: item } = await admin
    .from('reward_shop_items')
    .select('id, name, cost, stock, active, organization_id')
    .eq('id', itemId)
    .maybeSingle();
  if (!item || item.organization_id !== learner.organizationId || !item.active) {
    return { error: 'That item is not available.' };
  }
  if (item.stock != null && item.stock <= 0) return { error: 'Out of stock.' };

  const wallet = await walletFor(admin, learner.id);
  if (wallet.spendable < item.cost) {
    return { error: `You need ${item.cost - wallet.spendable} more points for this.` };
  }

  const { error } = await admin.from('reward_redemptions').insert({
    organization_id: learner.organizationId,
    learner_id: learner.id,
    item_id: item.id,
    item_name: item.name,
    points_spent: item.cost,
    status: 'pending',
  });
  if (error) return { error: 'Could not redeem. Please try again.' };

  if (item.stock != null) {
    await admin.from('reward_shop_items').update({ stock: item.stock - 1 }).eq('id', item.id);
  }

  revalidatePath('/portal/shop');
  return { success: `Redeemed ${item.name}! Your tutor will approve it soon. 🎉` };
}

// ---------------------------------------------------------------------------
// Teacher side (dashboard) — RLS-scoped authed client.
// ---------------------------------------------------------------------------

export async function listShopItems(): Promise<ShopItem[]> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return [];
  assertCan(ctx, 'rewards.view');
  const supabase = await createClient();
  const { data } = await supabase
    .from('reward_shop_items')
    .select('id, name, emoji, description, cost, stock, active')
    .eq('organization_id', ctx.organizationId)
    .order('created_at', { ascending: false });
  return (data ?? []) as ShopItem[];
}

export type ShopAdminState = { error?: string; success?: boolean };

export async function createShopItemAction(
  _prev: ShopAdminState,
  formData: FormData,
): Promise<ShopAdminState> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return { error: 'No active organization' };
  try {
    assertCan(ctx, 'rewards.manage');
  } catch (e) {
    if (e instanceof ForbiddenError) return { error: 'You cannot manage the shop.' };
    throw e;
  }
  const name = String(formData.get('name') ?? '').trim();
  const cost = Math.max(0, Math.round(Number(formData.get('cost') ?? 0)));
  if (name.length < 2) return { error: 'Enter an item name.' };
  if (!cost) return { error: 'Enter a points cost.' };
  const stockRaw = String(formData.get('stock') ?? '').trim();

  const supabase = await createClient();
  const { error } = await supabase.from('reward_shop_items').insert({
    organization_id: ctx.organizationId,
    name,
    cost,
    emoji: String(formData.get('emoji') ?? '').trim() || null,
    description: String(formData.get('description') ?? '').trim() || null,
    stock: stockRaw === '' ? null : Math.max(0, Math.round(Number(stockRaw))),
  });
  if (error) return { error: 'Could not add the item.' };
  revalidatePath('/dashboard/shop');
  return { success: true };
}

export async function setShopItemActiveAction(formData: FormData): Promise<void> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return;
  const { can } = await import('@/lib/permissions');
  if (!can(ctx, 'rewards.manage')) return;
  const id = String(formData.get('id') ?? '');
  const active = String(formData.get('active') ?? '') === 'true';
  const supabase = await createClient();
  await supabase
    .from('reward_shop_items')
    .update({ active })
    .eq('id', id)
    .eq('organization_id', ctx.organizationId);
  revalidatePath('/dashboard/shop');
}

export async function listRedemptions(): Promise<Redemption[]> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return [];
  assertCan(ctx, 'rewards.view');
  const supabase = await createClient();
  const { data: reds } = await supabase
    .from('reward_redemptions')
    .select('id, item_name, points_spent, status, created_at, learner_id')
    .eq('organization_id', ctx.organizationId)
    .order('created_at', { ascending: false })
    .limit(100);
  const rows = reds ?? [];
  if (rows.length === 0) return [];
  const { data: learners } = await supabase
    .from('learners')
    .select('id, first_name, last_name')
    .in('id', rows.map((r) => r.learner_id));
  const nameById = new Map((learners ?? []).map((l) => [l.id, `${l.first_name} ${l.last_name ?? ''}`.trim()]));
  return rows.map((r) => ({
    id: r.id,
    itemName: r.item_name,
    pointsSpent: r.points_spent,
    status: r.status,
    createdAt: r.created_at,
    learnerId: r.learner_id,
    learnerName: nameById.get(r.learner_id) ?? 'Learner',
  }));
}

export async function decideRedemptionAction(formData: FormData): Promise<void> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return;
  const { can } = await import('@/lib/permissions');
  if (!can(ctx, 'rewards.manage')) return;
  const id = String(formData.get('id') ?? '');
  const decision = String(formData.get('decision') ?? '');
  if (!['approved', 'fulfilled', 'rejected'].includes(decision)) return;

  const supabase = await createClient();
  const { data: red } = await supabase
    .from('reward_redemptions')
    .select('id, item_id, status')
    .eq('id', id)
    .eq('organization_id', ctx.organizationId)
    .maybeSingle();
  if (!red) return;

  await supabase
    .from('reward_redemptions')
    .update({ status: decision, decided_by: ctx.userId, decided_at: new Date().toISOString() })
    .eq('id', id)
    .eq('organization_id', ctx.organizationId);

  // Rejecting frees the points and restocks the item.
  if (decision === 'rejected' && red.item_id && ACTIVE_STATUSES.includes(red.status)) {
    const { data: item } = await supabase
      .from('reward_shop_items')
      .select('id, stock')
      .eq('id', red.item_id)
      .maybeSingle();
    if (item && item.stock != null) {
      await supabase.from('reward_shop_items').update({ stock: item.stock + 1 }).eq('id', item.id);
    }
  }
  revalidatePath('/dashboard/shop');
  revalidatePath('/portal/shop');
}
