'use client';

import { useActionState, useState } from 'react';
import { submitPlacementAction, type SubmitPlacementState, type PlacementQuestion } from '@/services/portal/placement';

export function TakeTest({
  attemptId,
  questions,
  clay,
}: {
  attemptId: string;
  questions: PlacementQuestion[];
  clay: string;
}) {
  const [state, formAction, pending] = useActionState<SubmitPlacementState, FormData>(
    submitPlacementAction,
    {},
  );
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const answered = Object.keys(answers).length;
  const allAnswered = answered === questions.length;

  // On successful grade the server revalidates and the page re-renders in its
  // result state; keep a graceful inline confirmation in the meantime.
  if (state.graded) {
    return (
      <div className={`${clay} p-8 text-center`}>
        <div className="text-5xl">🎉</div>
        <h2 className="mt-3 text-lg font-extrabold text-slate-800">Submitted!</h2>
        <p className="mt-2 text-sm text-slate-500">
          You scored {state.percentage}% — placement: <strong>{state.level}</strong>.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="attemptId" value={attemptId} />

      {questions.map((q, i) => (
        <div key={q.id} className={`${clay} p-5`}>
          <p className="mb-3 font-bold text-slate-800">
            <span className="mr-2 text-indigo-400">{i + 1}.</span>
            {q.prompt}
          </p>
          <div className="grid gap-2">
            {q.options.map((o) => {
              const selected = answers[q.id] === o.id;
              return (
                <label
                  key={o.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium transition ${
                    selected
                      ? 'bg-indigo-500 text-white shadow-[4px_4px_12px_rgba(99,102,241,0.35)]'
                      : 'bg-slate-50 text-slate-700 shadow-[inset_2px_2px_6px_rgba(99,102,241,0.12),inset_-2px_-2px_6px_rgba(255,255,255,0.9)]'
                  }`}
                >
                  <input
                    type="radio"
                    name={`q_${q.id}`}
                    value={o.id}
                    checked={selected}
                    onChange={() => setAnswers((a) => ({ ...a, [q.id]: o.id }))}
                    className="sr-only"
                  />
                  <span
                    className={`flex h-5 w-5 flex-none items-center justify-center rounded-full border-2 ${
                      selected ? 'border-white' : 'border-slate-300'
                    }`}
                  >
                    {selected && <span className="h-2 w-2 rounded-full bg-white" />}
                  </span>
                  {o.label}
                </label>
              );
            })}
          </div>
        </div>
      ))}

      {state.error && (
        <p className="rounded-2xl bg-pink-50 px-4 py-2.5 text-sm font-medium text-pink-600">
          {state.error}
        </p>
      )}

      <div className={`${clay} sticky bottom-4 flex items-center justify-between p-4`}>
        <span className="text-sm font-semibold text-slate-500">
          {answered}/{questions.length} answered
        </span>
        <button
          type="submit"
          disabled={pending || !allAnswered}
          className="rounded-full bg-indigo-500 px-6 py-2.5 text-sm font-bold text-white shadow-[6px_6px_16px_rgba(99,102,241,0.35),-4px_-4px_12px_rgba(255,255,255,0.8)] transition hover:bg-indigo-600 disabled:opacity-50"
        >
          {pending ? 'Submitting…' : 'Submit test'}
        </button>
      </div>
    </form>
  );
}
