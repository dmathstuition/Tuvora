import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';

export const ACADEMY_BUCKET = 'academy-files';
const MAX_BYTES = 15 * 1024 * 1024; // 15MB per file

export interface StoredFile {
  path: string;
  name: string;
  mime: string | null;
  size: number;
}

function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80) || 'file';
}

/**
 * Upload a single file to the private `academy-files` bucket under `prefix`.
 * Returns the stored metadata, or null when the entry isn't a real file.
 * Throws on an oversized file or a storage error so callers can surface it.
 */
export async function uploadAcademyFile(prefix: string, entry: FormDataEntryValue): Promise<StoredFile | null> {
  if (!(entry instanceof File) || entry.size === 0) return null;
  if (entry.size > MAX_BYTES) throw new Error('Each file must be under 15MB.');

  const admin = createAdminClient();
  const path = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName(entry.name)}`;
  const bytes = new Uint8Array(await entry.arrayBuffer());
  const { error } = await admin.storage
    .from(ACADEMY_BUCKET)
    .upload(path, bytes, { contentType: entry.type || 'application/octet-stream', upsert: false });
  if (error) throw new Error('Upload failed. Please try again.');

  return { path, name: entry.name, mime: entry.type || null, size: entry.size };
}

/** Upload every File under `field` in the form. Skips empty entries. */
export async function uploadAcademyFiles(prefix: string, files: FormDataEntryValue[]): Promise<StoredFile[]> {
  const out: StoredFile[] = [];
  for (const f of files) {
    const stored = await uploadAcademyFile(prefix, f);
    if (stored) out.push(stored);
  }
  return out;
}

/** Short-lived signed URL for reading a private academy file (default 1h). */
export async function signAcademyFile(path: string, expiresIn = 3600): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin.storage.from(ACADEMY_BUCKET).createSignedUrl(path, expiresIn);
  return data?.signedUrl ?? null;
}

/** Sign many paths at once, preserving order (nulls where signing failed). */
export async function signAcademyFiles(paths: string[]): Promise<(string | null)[]> {
  return Promise.all(paths.map((p) => signAcademyFile(p)));
}
