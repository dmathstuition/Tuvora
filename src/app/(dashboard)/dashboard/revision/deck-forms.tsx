'use client';

import { useActionState, useEffect, useRef } from 'react';
import { createDeckAction, addCardAction, type DeckState } from '@/services/revision';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function CreateDeck({ disabled }: { disabled: boolean }) {
  const [state, action, pending] = useActionState<DeckState, FormData>(createDeckAction, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.success) ref.current?.reset();
  }, [state.success]);

  return (
    <form ref={ref} action={action} className="flex flex-wrap items-end gap-3">
      <fieldset disabled={disabled} className="flex flex-1 flex-wrap items-end gap-3">
        <div className="min-w-48 flex-1 space-y-2">
          <Label htmlFor="title">Deck title</Label>
          <Input id="title" name="title" placeholder="Algebra basics" required />
        </div>
        <div className="w-40 space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Input id="subject" name="subject" placeholder="Maths" />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? 'Creating…' : 'Create deck'}
        </Button>
      </fieldset>
      {state.error && (
        <p className="w-full rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      )}
    </form>
  );
}

export function AddCard({ deckId, disabled }: { deckId: string; disabled: boolean }) {
  const [state, action, pending] = useActionState<DeckState, FormData>(addCardAction, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.success) ref.current?.reset();
  }, [state.success]);

  return (
    <form ref={ref} action={action} className="space-y-3">
      <input type="hidden" name="deckId" value={deckId} />
      <fieldset disabled={disabled} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="front">Front (question)</Label>
            <Input id="front" name="front" placeholder="What is 7 × 8?" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="back">Back (answer)</Label>
            <Input id="back" name="back" placeholder="56" required />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? 'Adding…' : 'Add card'}
          </Button>
          {state.success && <p className="text-sm text-success">Added.</p>}
          {state.error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
          )}
        </div>
      </fieldset>
    </form>
  );
}
