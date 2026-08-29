'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { Users, Check } from 'lucide-react';
import { joinClassByCodeAction, type JoinState } from '@/services/portal/join';

/** Confirmation "Join class" button used on the join landing page. */
export function JoinClassButton({ code, className }: { code: string; className: string }) {
  const [state, action, pending] = useActionState<JoinState, FormData>(joinClassByCodeAction, {});

  if (state.success) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <Check className="h-8 w-8" />
        </div>
        <p className="mt-3 font-extrabold text-brand-900">{state.success}</p>
        <Link
          href="/portal/learn"
          className="mt-4 inline-flex rounded-full bg-brand-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
        >
          Go to my classes
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="text-center">
      <input type="hidden" name="code" value={code} />
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 text-white">
        <Users className="h-8 w-8" />
      </div>
      <p className="mt-3 text-sm text-slate-500">You&apos;re about to join</p>
      <p className="text-xl font-extrabold text-brand-900">{className}</p>
      {state.error && <p className="mt-2 text-sm font-semibold text-rose-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="mt-4 w-full rounded-full bg-gradient-to-r from-brand-500 to-violet-600 py-3 text-base font-extrabold text-white hover:opacity-90 disabled:opacity-60"
      >
        {pending ? 'Joining…' : 'Join class 🎉'}
      </button>
    </form>
  );
}

/** Compact "enter a code" widget (Learn tab). */
export function JoinCodeEntry() {
  const [state, action, pending] = useActionState<JoinState, FormData>(joinClassByCodeAction, {});

  return (
    <form action={action} className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
      <p className="mb-2 flex items-center gap-2 text-sm font-extrabold text-brand-900">
        <Users className="h-5 w-5 text-brand-600" /> Join a class
      </p>
      <div className="flex gap-2">
        <input
          name="code"
          placeholder="Enter class code"
          className="flex-1 rounded-2xl bg-slate-50 px-4 py-2.5 text-sm font-bold uppercase tracking-widest text-brand-900 shadow-[inset_2px_2px_6px_rgba(99,102,241,0.10),inset_-2px_-2px_6px_rgba(255,255,255,0.9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-2xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {pending ? '…' : 'Join'}
        </button>
      </div>
      {state.error && <p className="mt-2 text-sm font-semibold text-rose-600">{state.error}</p>}
      {state.success && <p className="mt-2 text-sm font-semibold text-emerald-600">{state.success}</p>}
    </form>
  );
}
