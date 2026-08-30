'use client';

import { useActionState, useRef } from 'react';
import { Camera } from 'lucide-react';
import { initials } from '@/lib/utils';

type AvatarState = { error?: string; success?: boolean };
type Action = (prev: AvatarState, formData: FormData) => Promise<AvatarState>;

/**
 * Circular avatar that doubles as an uploader: shows the current photo (or the
 * person's initials), and — when `canEdit` — a camera badge that opens the file
 * picker and submits the photo to `action`. The page revalidates on success so
 * the new photo shows on the person's pages.
 */
export function AvatarUpload({
  action,
  id,
  currentUrl,
  name,
  size = 56,
  canEdit = true,
}: {
  action: Action;
  id: string;
  currentUrl: string | null;
  name: string;
  size?: number;
  canEdit?: boolean;
}) {
  const [state, formAction, pending] = useActionState<AvatarState, FormData>(action, {});
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="flex flex-col items-center gap-1">
      <form action={formAction} ref={formRef}>
        <input type="hidden" name="id" value={id} />
        <div className="relative" style={{ width: size, height: size }}>
          <div
            className="flex items-center justify-center overflow-hidden rounded-full bg-brand-900 font-semibold text-white ring-2 ring-white"
            style={{ width: size, height: size, fontSize: size / 2.6 }}
          >
            {currentUrl ? (
              // Public bucket URL; plain img keeps it simple across remote hosts.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentUrl} alt={name} width={size} height={size} className="h-full w-full object-cover" />
            ) : (
              initials(name)
            )}
          </div>
          {canEdit && (
            <label
              className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-brand-600 text-white shadow-sm transition-colors hover:bg-brand-700"
              title="Upload photo"
            >
              <Camera className="h-3.5 w-3.5" />
              <input
                type="file"
                name="image"
                accept="image/*"
                className="hidden"
                disabled={pending}
                onChange={() => formRef.current?.requestSubmit()}
              />
            </label>
          )}
        </div>
      </form>
      {pending && <span className="text-[11px] text-muted-foreground">Uploading…</span>}
      {state.error && <span className="max-w-32 text-center text-[11px] text-destructive">{state.error}</span>}
    </div>
  );
}
