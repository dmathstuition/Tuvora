import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Public image storage (avatars, logos). We reuse the existing public
 * `org-logos` bucket so uploads render anywhere via a plain public URL — no
 * signed URLs, and no extra bucket to provision.
 */
const PUBLIC_BUCKET = 'org-logos';
const MAX_BYTES = 4 * 1024 * 1024; // 4MB

export interface UploadImageResult {
  url?: string;
  error?: string;
}

/**
 * Upload one image to the public bucket under `prefix` and return its public
 * URL. Validates that the entry is an image within the size limit.
 */
export async function uploadPublicImage(
  prefix: string,
  entry: FormDataEntryValue | null,
): Promise<UploadImageResult> {
  if (!(entry instanceof File) || entry.size === 0) return { error: 'Choose an image to upload.' };
  if (!entry.type.startsWith('image/')) return { error: 'Please upload an image file.' };
  if (entry.size > MAX_BYTES) return { error: 'Image must be under 4MB.' };

  const admin = createAdminClient();
  const ext = (entry.name.split('.').pop() ?? 'png').toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
  const path = `${prefix}-${Date.now()}.${ext}`;
  const bytes = new Uint8Array(await entry.arrayBuffer());

  const { error } = await admin.storage
    .from(PUBLIC_BUCKET)
    .upload(path, bytes, { contentType: entry.type, upsert: true });
  if (error) return { error: 'Upload failed. Please try again.' };

  const { data } = admin.storage.from(PUBLIC_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
}
