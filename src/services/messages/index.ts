'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/auth/context';
import { assertCan, ForbiddenError } from '@/lib/permissions';

export interface ThreadRow {
  id: string;
  subject: string | null;
  kind: string;
  updatedAt: string;
}

export async function listThreads(): Promise<ThreadRow[]> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return [];
  assertCan(ctx, 'messages.view');
  const supabase = await createClient();
  const { data } = await supabase
    .from('message_threads')
    .select('id, subject, kind, updated_at')
    .eq('organization_id', ctx.organizationId)
    .order('updated_at', { ascending: false });
  return (data ?? []).map((t) => ({ id: t.id, subject: t.subject, kind: t.kind, updatedAt: t.updated_at }));
}

export interface ThreadDetail {
  thread: { id: string; subject: string | null };
  messages: { id: string; body: string; senderName: string; mine: boolean; createdAt: string }[];
  canSend: boolean;
}

export async function getThread(id: string): Promise<ThreadDetail | null> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return null;
  assertCan(ctx, 'messages.view');
  const supabase = await createClient();

  const { data: thread } = await supabase
    .from('message_threads')
    .select('id, subject')
    .eq('id', id)
    .eq('organization_id', ctx.organizationId)
    .maybeSingle();
  if (!thread) return null;

  const { data: msgs } = await supabase
    .from('messages')
    .select('id, body, sender_id, created_at')
    .eq('organization_id', ctx.organizationId)
    .eq('thread_id', id)
    .order('created_at');
  const rows = msgs ?? [];

  const senderIds = [...new Set(rows.map((m) => m.sender_id).filter(Boolean))] as string[];
  const names = new Map<string, string>();
  if (senderIds.length > 0) {
    const { data: profiles } = await supabase.from('profiles').select('id, full_name, email').in('id', senderIds);
    for (const p of profiles ?? []) names.set(p.id, p.full_name ?? p.email);
  }

  return {
    thread,
    messages: rows.map((m) => ({
      id: m.id,
      body: m.body,
      senderName: m.sender_id ? (names.get(m.sender_id) ?? 'Member') : 'System',
      mine: m.sender_id === ctx.userId,
      createdAt: m.created_at,
    })),
    canSend: true,
  };
}

export type MessageState = { error?: string; success?: boolean };

export async function createThreadAction(_prev: MessageState, formData: FormData): Promise<MessageState> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return { error: 'No active organization' };
  try {
    assertCan(ctx, 'messages.send');
  } catch (e) {
    if (e instanceof ForbiddenError) return { error: 'You cannot send messages.' };
    throw e;
  }
  const subject = String(formData.get('subject') ?? '').trim();
  const body = String(formData.get('body') ?? '').trim();
  if (!subject) return { error: 'Enter a subject.' };
  if (!body) return { error: 'Enter a message.' };

  const supabase = await createClient();
  const { data: thread, error } = await supabase
    .from('message_threads')
    .insert({
      organization_id: ctx.organizationId,
      subject,
      kind: String(formData.get('kind') ?? 'direct'),
      created_by: ctx.userId,
      participant_ids: [ctx.userId],
    })
    .select('id')
    .single();
  if (error || !thread) return { error: 'Could not start the conversation.' };

  await supabase.from('messages').insert({
    organization_id: ctx.organizationId,
    thread_id: thread.id,
    sender_id: ctx.userId,
    body,
  });

  revalidatePath('/dashboard/messages');
  return { success: true };
}

export async function replyAction(_prev: MessageState, formData: FormData): Promise<MessageState> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return { error: 'No active organization' };
  try {
    assertCan(ctx, 'messages.send');
  } catch {
    return { error: 'You cannot send messages.' };
  }
  const threadId = String(formData.get('threadId') ?? '');
  const body = String(formData.get('body') ?? '').trim();
  if (!threadId || !body) return { error: 'Enter a message.' };

  const supabase = await createClient();
  const { error } = await supabase.from('messages').insert({
    organization_id: ctx.organizationId,
    thread_id: threadId,
    sender_id: ctx.userId,
    body,
  });
  if (error) return { error: 'Could not send.' };
  await supabase.from('message_threads').update({ updated_at: new Date().toISOString() }).eq('id', threadId);

  revalidatePath(`/dashboard/messages/${threadId}`);
  return { success: true };
}
