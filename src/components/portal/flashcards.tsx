'use client';

import { useState } from 'react';
import { RotateCcw, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import type { Card } from '@/services/revision';
import { cn } from '@/lib/utils';

/** Flip-through study mode for a revision deck. */
export function Flashcards({ cards }: { cards: Card[] }) {
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<number>>(new Set());

  if (cards.length === 0) {
    return (
      <p className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
        This deck has no cards yet.
      </p>
    );
  }

  const card = cards[i]!;
  const done = known.size >= cards.length;

  function go(delta: number) {
    setFlipped(false);
    setI((v) => (v + delta + cards.length) % cards.length);
  }
  function markKnown() {
    setKnown((s) => new Set(s).add(i));
    if (i < cards.length - 1) go(1);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm font-bold text-slate-500">
        <span>
          Card {i + 1}/{cards.length}
        </span>
        <span className="text-emerald-600">{known.size} known</span>
      </div>

      <button
        onClick={() => setFlipped((f) => !f)}
        className={cn(
          'flex min-h-56 w-full flex-col items-center justify-center rounded-3xl bg-gradient-to-br p-8 text-center text-white shadow-lg transition',
          flipped ? 'from-emerald-500 to-teal-600' : 'from-brand-600 to-violet-700',
        )}
      >
        <span className="text-xs font-bold uppercase tracking-widest text-white/70">
          {flipped ? 'Answer' : 'Question'}
        </span>
        <span className="mt-3 text-2xl font-extrabold">{flipped ? card.back : card.front}</span>
        <span className="mt-4 flex items-center gap-1 text-xs text-white/70">
          <RotateCcw className="h-3.5 w-3.5" /> Tap to flip
        </span>
      </button>

      <div className="flex items-center justify-between gap-2">
        <button
          onClick={() => go(-1)}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={markKnown}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-emerald-500 py-3 text-sm font-extrabold text-white hover:bg-emerald-600"
        >
          <Check className="h-4 w-4" /> I know this
        </button>
        <button
          onClick={() => go(1)}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {done && (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-center text-sm font-bold text-emerald-700">
          🎉 You&apos;ve reviewed every card in this deck!
        </p>
      )}
    </div>
  );
}
