'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/auth/context';
import { z } from 'zod';

export interface MyTicket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
}

export async function listMyTickets(): Promise<MyTicket[]> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from('support_tickets')
    .select('id, subject, status, priority, created_at')
    .eq('organization_id', ctx.organizationId)
    .order('created_at', { ascending: false });
  return (data ?? []).map((t) => ({
    id: t.id,
    subject: t.subject,
    status: t.status,
    priority: t.priority,
    createdAt: t.created_at,
  }));
}

const ticketSchema = z.object({
  subject: z.string().min(3, 'Add a subject').max(120),
  message: z.string().min(10, 'Tell us a bit more').max(2000),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
});

export type TicketState = { error?: string; success?: boolean };

export async function createTicketAction(
  _prev: TicketState,
  formData: FormData,
): Promise<TicketState> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return { error: 'No active organization' };

  const parsed = ticketSchema.safeParse({
    subject: formData.get('subject'),
    message: formData.get('message'),
    priority: (formData.get('priority') as string) || 'normal',
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Check the form' };

  const supabase = await createClient();
  const { error } = await supabase.from('support_tickets').insert({
    organization_id: ctx.organizationId,
    created_by: ctx.userId,
    subject: parsed.data.subject,
    message: parsed.data.message,
    priority: parsed.data.priority,
  });
  if (error) return { error: 'Could not submit your request. Please try again.' };

  revalidatePath('/dashboard/support');
  return { success: true };
}
