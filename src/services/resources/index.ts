'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/auth/context';
import { assertCan, ForbiddenError } from '@/lib/permissions';

export interface ResourceItem {
  id: string;
  title: string;
  description: string | null;
  kind: string;
  url: string | null;
  createdAt: string;
}

export async function listResources(): Promise<ResourceItem[]> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return [];
  assertCan(ctx, 'resources.view');
  const supabase = await createClient();
  const { data } = await supabase
    .from('resources')
    .select('id, title, description, kind, url, created_at')
    .eq('organization_id', ctx.organizationId)
    .order('created_at', { ascending: false });
  return (data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    kind: r.kind,
    url: r.url,
    createdAt: r.created_at,
  }));
}

export type ResourceState = { error?: string; success?: boolean };

export async function createResourceAction(_prev: ResourceState, formData: FormData): Promise<ResourceState> {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) return { error: 'No active organization' };
  try {
    assertCan(ctx, 'resources.manage');
  } catch (e) {
    if (e instanceof ForbiddenError) return { error: 'You cannot manage resources.' };
    throw e;
  }
  const title = String(formData.get('title') ?? '').trim();
  const kind = String(formData.get('kind') ?? 'link');
  const url = String(formData.get('url') ?? '').trim();
  if (title.length < 2) return { error: 'Enter a title.' };
  if (kind === 'link' && !url) return { error: 'Enter a URL for a link resource.' };

  const supabase = await createClient();
  const { error } = await supabase.from('resources').insert({
    organization_id: ctx.organizationId,
    title,
    kind,
    url: url || null,
    description: String(formData.get('description') ?? '') || null,
    created_by: ctx.userId,
  });
  if (error) return { error: 'Could not add the resource.' };
  revalidatePath('/dashboard/resources');
  return { success: true };
}
