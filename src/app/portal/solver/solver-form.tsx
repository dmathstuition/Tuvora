'use client';

import { useActionState } from 'react';
import { Sparkles, Send, Lightbulb } from 'lucide-react';
import { solveQuestionAction, type SolveState } from '@/services/portal/ai-solver';

const EXAMPLES = ['Solve 3x + 5 = 20', 'What is 15% of 240?', 'Area of a circle with radius 7'];

export function SolverForm() {
  const [state, action, pending] = useActionState<SolveState, FormData>(solveQuestionAction, {});

  // Split the reply into working steps and a final "Answer:" line.
  const lines = (state.answer ?? '').split('\n').filter((l) => l.trim() !== '');
  const finalIdx = lines.findIndex((l) => /^answer:/i.test(l.trim()));
  const steps = finalIdx >= 0 ? lines.slice(0, finalIdx) : lines;
  const finalLine = finalIdx >= 0 ? lines[finalIdx]!.replace(/^answer:\s*/i, '') : null;

  return (
    <div className="space-y-4">
      <form action={action} className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
        <label htmlFor="question" className="mb-2 block text-sm font-bold text-brand-900">
          Ask a maths question ✏️
        </label>
        <textarea
          id="question"
          name="question"
          rows={3}
          defaultValue={state.question}
          maxLength={1000}
          placeholder="e.g. Solve 2x + 3 = 11"
          className="w-full rounded-2xl bg-slate-50 px-4 py-3 text-sm text-brand-900 shadow-[inset_2px_2px_6px_rgba(99,102,241,0.10),inset_-2px_-2px_6px_rgba(255,255,255,0.9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLES.map((ex) => (
              <span key={ex} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500">
                {ex}
              </span>
            ))}
          </div>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-violet-600 px-5 py-2.5 text-sm font-extrabold text-white hover:opacity-90 disabled:opacity-60"
          >
            {pending ? 'Thinking…' : 'Solve it'} <Send className="h-4 w-4" />
          </button>
        </div>
      </form>

      {state.error && (
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">{state.error}</p>
      )}

      {state.answer && (
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="mb-3 flex items-center gap-2 text-sm font-extrabold text-brand-900">
            <Lightbulb className="h-5 w-5 text-amber-500" /> Step-by-step
          </p>
          <div className="space-y-1.5 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
            {steps.map((l, i) => (
              <p key={i}>{l}</p>
            ))}
          </div>
          {finalLine && (
            <div className="mt-4 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3 text-white">
              <Sparkles className="h-5 w-5" />
              <span className="font-extrabold">Answer: {finalLine}</span>
            </div>
          )}
          {state.remaining != null && (
            <p className="mt-3 text-center text-xs text-slate-400">
              {state.remaining} AI questions left today
            </p>
          )}
        </div>
      )}
    </div>
  );
}
