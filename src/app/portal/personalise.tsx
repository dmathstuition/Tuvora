'use client';

import { useActionState, useState } from 'react';
import { Palette } from 'lucide-react';
import { setPersonalisationAction, type PersonaliseState } from '@/services/portal';
import { AVATARS, THEMES } from '@/constants/gamification';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Personalise({
  currentAvatar,
  currentTheme,
}: {
  currentAvatar: string;
  currentTheme: string;
}) {
  const [open, setOpen] = useState(false);
  const [avatar, setAvatar] = useState(currentAvatar);
  const [theme, setTheme] = useState(currentTheme);
  const [state, formAction, pending] = useActionState<PersonaliseState, FormData>(
    setPersonalisationAction,
    {},
  );

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <Palette className="h-4 w-4" /> Customise
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold">Make it yours</h2>
            <form action={formAction} className="mt-4 space-y-5">
              <input type="hidden" name="avatar" value={avatar} />
              <input type="hidden" name="theme" value={theme} />

              <div>
                <p className="mb-2 text-sm font-medium">Avatar</p>
                <div className="grid grid-cols-6 gap-2">
                  {AVATARS.map((a) => (
                    <button
                      key={a.key}
                      type="button"
                      onClick={() => setAvatar(a.key)}
                      aria-label={a.label}
                      className={cn(
                        'flex h-11 items-center justify-center rounded-lg border text-2xl',
                        avatar === a.key ? 'border-primary ring-2 ring-primary' : 'hover:bg-muted',
                      )}
                    >
                      {a.emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">Theme</p>
                <div className="grid grid-cols-3 gap-2">
                  {THEMES.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setTheme(t.key)}
                      className={cn(
                        'h-11 rounded-lg bg-gradient-to-br text-xs font-medium text-white',
                        t.gradient,
                        theme === t.key && 'ring-2 ring-offset-2 ring-primary',
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {state.success && <p className="text-sm text-success">Saved!</p>}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Close
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
