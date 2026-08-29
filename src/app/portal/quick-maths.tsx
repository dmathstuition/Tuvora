'use client';

import { useActionState, useCallback, useEffect, useRef, useState } from 'react';
import { Gamepad2, Timer } from 'lucide-react';
import { recordGameScoreAction, type GameState } from '@/services/portal';
import { Button } from '@/components/ui/button';

type Problem = { a: number; b: number; op: '+' | '×'; answer: number };

function makeProblem(): Problem {
  const op = Math.random() < 0.5 ? '+' : '×';
  if (op === '+') {
    const a = 2 + Math.floor(Math.random() * 40);
    const b = 2 + Math.floor(Math.random() * 40);
    return { a, b, op, answer: a + b };
  }
  const a = 2 + Math.floor(Math.random() * 11);
  const b = 2 + Math.floor(Math.random() * 11);
  return { a, b, op, answer: a * b };
}

const ROUND_SECONDS = 30;

/**
 * Quick Maths — a 30-second mental-arithmetic mini-game. Correct answers become
 * reward points (capped server-side) that a tutor can monitor and that feed the
 * leaderboard.
 */
export function QuickMaths() {
  const [phase, setPhase] = useState<'idle' | 'playing' | 'done'>('idle');
  const [problem, setProblem] = useState<Problem>(() => makeProblem());
  const [value, setValue] = useState('');
  const [correct, setCorrect] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, submit, pending] = useActionState<GameState, FormData>(recordGameScoreAction, {});

  const finish = useCallback(
    (score: number) => {
      setPhase('done');
      const fd = new FormData();
      fd.set('correct', String(score));
      submit(fd);
    },
    [submit],
  );

  useEffect(() => {
    if (phase !== 'playing') return;
    if (timeLeft <= 0) {
      finish(correct);
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft, correct, finish]);

  function start() {
    setCorrect(0);
    setTimeLeft(ROUND_SECONDS);
    setProblem(makeProblem());
    setValue('');
    setPhase('playing');
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (Number(value) === problem.answer) setCorrect((c) => c + 1);
    setProblem(makeProblem());
    setValue('');
  }

  return (
    <div className="rounded-[1.75rem] bg-white p-5 shadow-[8px_8px_22px_rgba(99,102,241,0.18),-8px_-8px_22px_rgba(255,255,255,0.95)]">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-extrabold text-slate-800">
          <Gamepad2 className="h-5 w-5 text-violet-500" /> Quick Maths
        </h3>
        {phase === 'playing' && (
          <span className="flex items-center gap-1 rounded-full bg-violet-50 px-3 py-1 text-sm font-bold tabular-nums text-violet-600">
            <Timer className="h-4 w-4" /> {timeLeft}s
          </span>
        )}
      </div>

      {phase === 'idle' && (
        <div className="text-center">
          <p className="mb-4 text-sm text-slate-500">
            Solve as many as you can in {ROUND_SECONDS} seconds. Each correct answer earns a point!
          </p>
          <Button onClick={start} className="rounded-full">
            Start challenge 🚀
          </Button>
        </div>
      )}

      {phase === 'playing' && (
        <form onSubmit={onSubmit} className="text-center">
          <p className="text-4xl font-extrabold tracking-tight text-slate-800">
            {problem.a} {problem.op} {problem.b}
          </p>
          <input
            ref={inputRef}
            type="number"
            inputMode="numeric"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="mx-auto mt-4 w-36 rounded-2xl bg-slate-50 px-3 py-2.5 text-center text-lg font-bold text-slate-800 shadow-[inset_4px_4px_10px_rgba(99,102,241,0.15),inset_-4px_-4px_10px_rgba(255,255,255,0.9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            aria-label="Your answer"
            autoComplete="off"
          />
          <p className="mt-3 text-sm font-semibold text-slate-500">Score: {correct}</p>
        </form>
      )}

      {phase === 'done' && (
        <div className="text-center">
          <p className="text-3xl font-extrabold text-slate-800">🎉 {correct} correct!</p>
          <p className="mt-1 text-sm text-slate-500">
            {pending
              ? 'Saving your points…'
              : state.earned
                ? `You earned ${state.earned} points! New total: ${state.total ?? '—'}`
                : 'No points this round — try again!'}
          </p>
          <Button className="mt-4 rounded-full" variant="outline" onClick={start}>
            Play again
          </Button>
        </div>
      )}
    </div>
  );
}
