'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthContext } from '@/lib/auth/context';
import { assertCan, can, ForbiddenError } from '@/lib/permissions';

export interface Deck {
  id: string;
  title: string;
  subject: string | null;
  cardCount: number;
}

export interface Card {
  id: string;
  front: string;
  back: string;
}

// ---------------------------------------------------------------------------
// Teacher side
// ---------------------------------------------------------------------------

export async function listDecks(): Promise<Deck[]> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return [];
  assertCan(ctx, 'lessons.view');
  const supabase = await createClient();
  const { data: decks } = await supabase
    .from('revision_decks')
    .select('id, title, subject')
    .eq('organization_id', ctx.organizationId)
    .order('created_at', { ascending: false });
  const rows = decks ?? [];
  if (rows.length === 0) return [];
  const { data: cards } = await supabase
    .from('revision_cards')
    .select('deck_id')
    .eq('organization_id', ctx.organizationId)
    .in('deck_id', rows.map((d) => d.id));
  const counts = new Map<string, number>();
  for (const c of cards ?? []) counts.set(c.deck_id, (counts.get(c.deck_id) ?? 0) + 1);
  return rows.map((d) => ({ id: d.id, title: d.title, subject: d.subject, cardCount: counts.get(d.id) ?? 0 }));
}

export async function getDeckDetail(id: string): Promise<{ deck: Deck; cards: Card[] } | null> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return null;
  assertCan(ctx, 'lessons.view');
  const supabase = await createClient();
  const { data: deck } = await supabase
    .from('revision_decks')
    .select('id, title, subject')
    .eq('id', id)
    .eq('organization_id', ctx.organizationId)
    .maybeSingle();
  if (!deck) return null;
  const { data: cards } = await supabase
    .from('revision_cards')
    .select('id, front, back, position')
    .eq('deck_id', id)
    .order('position');
  const list = (cards ?? []).map((c) => ({ id: c.id, front: c.front, back: c.back }));
  return { deck: { id: deck.id, title: deck.title, subject: deck.subject, cardCount: list.length }, cards: list };
}

export type DeckState = { error?: string; success?: boolean; deckId?: string };

export async function createDeckAction(_prev: DeckState, formData: FormData): Promise<DeckState> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return { error: 'No active organization' };
  try {
    assertCan(ctx, 'lessons.manage');
  } catch (e) {
    if (e instanceof ForbiddenError) return { error: 'You cannot manage revision decks.' };
    throw e;
  }
  const title = String(formData.get('title') ?? '').trim();
  if (title.length < 2) return { error: 'Enter a deck title.' };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('revision_decks')
    .insert({
      organization_id: ctx.organizationId,
      title,
      subject: String(formData.get('subject') ?? '').trim() || null,
      created_by: ctx.userId,
    })
    .select('id')
    .single();
  if (error || !data) return { error: 'Could not create the deck.' };
  revalidatePath('/dashboard/revision');
  return { success: true, deckId: data.id };
}

export async function addCardAction(_prev: DeckState, formData: FormData): Promise<DeckState> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return { error: 'No active organization' };
  try {
    assertCan(ctx, 'lessons.manage');
  } catch {
    return { error: 'You cannot manage revision decks.' };
  }
  const deckId = String(formData.get('deckId') ?? '');
  const front = String(formData.get('front') ?? '').trim();
  const back = String(formData.get('back') ?? '').trim();
  if (!deckId || !front || !back) return { error: 'Fill in both sides of the card.' };

  const supabase = await createClient();
  const { count } = await supabase
    .from('revision_cards')
    .select('id', { count: 'exact', head: true })
    .eq('deck_id', deckId);
  const { error } = await supabase.from('revision_cards').insert({
    organization_id: ctx.organizationId,
    deck_id: deckId,
    front,
    back,
    position: count ?? 0,
  });
  if (error) return { error: 'Could not add the card.' };
  revalidatePath(`/dashboard/revision/${deckId}`);
  return { success: true, deckId };
}

export async function deleteCardAction(formData: FormData): Promise<void> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId || !can(ctx, 'lessons.manage')) return;
  const id = String(formData.get('id') ?? '');
  const deckId = String(formData.get('deckId') ?? '');
  const supabase = await createClient();
  await supabase.from('revision_cards').delete().eq('id', id).eq('organization_id', ctx.organizationId);
  revalidatePath(`/dashboard/revision/${deckId}`);
}

// ---------------------------------------------------------------------------
// Learner side (portal)
// ---------------------------------------------------------------------------

async function learnerOrg(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data } = await admin.from('learners').select('organization_id').eq('user_id', user.id).maybeSingle();
  return data?.organization_id ?? null;
}

export async function getDecksForLearner(): Promise<Deck[]> {
  const orgId = await learnerOrg();
  if (!orgId) return [];
  const admin = createAdminClient();
  const { data: decks } = await admin
    .from('revision_decks')
    .select('id, title, subject')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });
  const rows = decks ?? [];
  if (rows.length === 0) return [];
  const { data: cards } = await admin
    .from('revision_cards')
    .select('deck_id')
    .in('deck_id', rows.map((d) => d.id));
  const counts = new Map<string, number>();
  for (const c of cards ?? []) counts.set(c.deck_id, (counts.get(c.deck_id) ?? 0) + 1);
  return rows.map((d) => ({ id: d.id, title: d.title, subject: d.subject, cardCount: counts.get(d.id) ?? 0 }));
}

export async function getDeckForLearner(id: string): Promise<{ deck: Deck; cards: Card[] } | null> {
  const orgId = await learnerOrg();
  if (!orgId) return null;
  const admin = createAdminClient();
  const { data: deck } = await admin
    .from('revision_decks')
    .select('id, title, subject, organization_id')
    .eq('id', id)
    .maybeSingle();
  if (!deck || deck.organization_id !== orgId) return null;
  const { data: cards } = await admin
    .from('revision_cards')
    .select('id, front, back, position')
    .eq('deck_id', id)
    .order('position');
  const list = (cards ?? []).map((c) => ({ id: c.id, front: c.front, back: c.back }));
  return { deck: { id: deck.id, title: deck.title, subject: deck.subject, cardCount: list.length }, cards: list };
}
