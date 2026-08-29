'use client';

import { useActionState, useCallback, useEffect, useRef, useState } from 'react';
import { Timer, Check, X, Trophy, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { recordGameResultAction, type GameState } from '@/services/portal';
import { makeQuestion, type Difficulty, type GameQuestion, type Op } from '@/lib/games/arithmetic';
import { cn } from '@/lib/utils';

const OPS: Op[] = ['+', '−', '×', '÷'];
const PRACTICE_COUNT = 12;
const SPRINT_SECONDS = 60;

type Phase = 'idle' | 'playing' | 'done';

export function GameEngine({
  mode,
  accent,
  title,
}: {
  mode: 'practice' | 'sprint';
  accent: string;
  title: string;
}) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [q, setQ] = useState<GameQuestion>(() => makeQuestion('medium', OPS));
  const [value, setValue] = useState('');
  const [correct, setCorrect] = useState(0);
  const [asked, setAsked] = useState(0);
  const [index, setIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(SPRINT_SECONDS);
  const [flash, setFlash] = useState<'right' | 'wrong' | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, submit, pending] = useActionState<GameState, FormData>(recordGameResultAction, {});

  const finish = useCallback(
    (score: number) => {
      setPhase('done');
      const fd = new FormData();
      fd.set('mode', mode);
      fd.set('correct', String(score));
      submit(fd);
    },
    [mode, submit],
  );

  // Sprint timer.
  useEffect(() => {
    if (mode !== 'sprint' || phase !== 'playing') return;
    if (timeLeft <= 0) {
      finish(correct);
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [mode, phase, timeLeft, correct, finish]);

  function start() {
    setCorrect(0);
    setAsked(0);
    setIndex(0);
    setTimeLeft(SPRINT_SECONDS);
    setQ(makeQuestion(difficulty, OPS));
    setValue('');
    setFlash(null);
    setPhase('playing');
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function next(wasCorrect: boolean) {
    const nextCorrect = correct + (wasCorrect ? 1 : 0);
    if (wasCorrect) setCorrect(nextCorrect);
    setValue('');
    setAsked((a) => a + 1);
    if (mode === 'practice') {
      const nextIdx = index + 1;
      if (nextIdx >= PRACTICE_COUNT) {
        finish(nextCorrect);
        return;
      }
      setIndex(nextIdx);
    }
    setQ(makeQuestion(difficulty, OPS));
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (value.trim() === '') return;
    const wasCorrect = Number(value) === q.answer;
    if (mode === 'practice') {
      setFlash(wasCorrect ? 'right' : 'wrong');
      setTimeout(() => {
        setFlash(null);
        next(wasCorrect);
      }, 550);
    } else {
      next(wasCorrect);
    }
  }

  // ---- Idle / start screen -------------------------------------------------
  if (phase === 'idle') {
    return (
      <div className={cn('overflow-hidden rounded-3xl bg-gradient-to-br p-6 text-white', accent)}>
        <h2 className="text-2xl font-extrabold">{title}</h2>
        <p className="mt-1 text-white/85">
          {mode === 'sprint'
            ? `Answer as many as you can in ${SPRINT_SECONDS} seconds. Every correct answer is a point! ⚡`
            : `Solve ${PRACTICE_COUNT} questions at your own pace and earn points. 🎯`}
        </p>

        <p className="mt-5 text-sm font-bold uppercase tracking-wide text-white/70">Difficulty</p>
        <div className="mt-2 flex gap-2">
          {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={cn(
                'flex-1 rounded-2xl px-3 py-2.5 text-sm font-bold capitalize transition',
                difficulty === d ? 'bg-white text-slate-800' : 'bg-white/15 text-white hover:bg-white/25',
              )}
            >
              {d}
            </button>
          ))}
        </div>

        <button
          onClick={start}
          className="mt-6 w-full rounded-full bg-white py-3.5 text-base font-extrabold text-slate-800 shadow-lg transition hover:scale-[1.01]"
        >
          Start {mode === 'sprint' ? 'sprint ⚡' : 'practice 🚀'}
        </button>
      </div>
    );
  }

  // ---- Results screen ------------------------------------------------------
  if (phase === 'done') {
    const total = mode === 'practice' ? PRACTICE_COUNT : asked;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-sm">
        <div className="text-6xl">{accuracy >= 80 ? '🎉' : accuracy >= 50 ? '👍' : '💪'}</div>
        <h2 className="mt-3 text-2xl font-extrabold text-brand-900">{correct} correct!</h2>
        <p className="mt-1 text-slate-500">Accuracy {accuracy}%</p>
        <div
          className={cn(
            'mx-auto mt-5 flex w-fit items-center gap-2 rounded-full bg-gradient-to-r px-5 py-2 text-white',
            accent,
          )}
        >
          <Trophy className="h-5 w-5" />
          <span className="font-extrabold">
            {pending ? 'Saving…' : state.earned ? `+${state.earned} points` : 'No points this time'}
          </span>
        </div>
        {state.total != null && (
          <p className="mt-2 text-sm text-slate-400">New total: {state.total} points</p>
        )}
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={start}
            className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
          >
            <RotateCcw className="h-4 w-4" /> Play again
          </button>
          <Link
            href="/portal"
            className="inline-flex items-center rounded-full border px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
          >
            Home
          </Link>
        </div>
      </div>
    );
  }

  // ---- Playing screen ------------------------------------------------------
  return (
    <div
      className={cn(
        'rounded-3xl border-4 bg-white p-6 shadow-sm transition-colors',
        flash === 'right' ? 'border-emerald-400' : flash === 'wrong' ? 'border-rose-400' : 'border-transparent',
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        {mode === 'sprint' ? (
          <span className="flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-sm font-extrabold tabular-nums text-brand-700">
            <Timer className="h-4 w-4" /> {timeLeft}s
          </span>
        ) : (
          <span className="text-sm font-bold text-slate-400">
            Question {index + 1}/{PRACTICE_COUNT}
          </span>
        )}
        <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-extrabold text-amber-600">
          ⭐ {correct}
        </span>
      </div>

      {mode === 'practice' && (
        <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={cn('h-full rounded-full bg-gradient-to-r', accent)}
            style={{ width: `${(index / PRACTICE_COUNT) * 100}%` }}
          />
        </div>
      )}

      <form onSubmit={onSubmit} className="text-center">
        <p className="py-4 text-5xl font-extrabold tracking-tight text-brand-900">{q.prompt}</p>
        <div className="relative mx-auto w-44">
          <input
            ref={inputRef}
            type="number"
            inputMode="numeric"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full rounded-2xl bg-slate-50 px-3 py-3 text-center text-2xl font-extrabold text-brand-900 shadow-[inset_3px_3px_8px_rgba(99,102,241,0.12),inset_-3px_-3px_8px_rgba(255,255,255,0.9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
            aria-label="Your answer"
            autoComplete="off"
          />
          {flash === 'right' && (
            <Check className="absolute -right-8 top-1/2 h-6 w-6 -translate-y-1/2 text-emerald-500" />
          )}
          {flash === 'wrong' && (
            <X className="absolute -right-8 top-1/2 h-6 w-6 -translate-y-1/2 text-rose-500" />
          )}
        </div>
        <button
          type="submit"
          className={cn('mt-5 w-full rounded-full bg-gradient-to-r py-3 text-base font-extrabold text-white', accent)}
        >
          {mode === 'sprint' ? 'Next ⚡' : 'Check'}
        </button>
      </form>
    </div>
  );
}
