'use client';

import { useActionState } from 'react';
import { Send, Paperclip } from 'lucide-react';
import { submitHomeworkAction, type SubmitHomeworkState } from '@/services/portal/homework';

export function SubmitHomeworkForm({
  submissionId,
  defaultContent,
  resubmit,
}: {
  submissionId: string;
  defaultContent: string | null;
  resubmit: boolean;
}) {
  const [state, formAction, pending] = useActionState<SubmitHomeworkState, FormData>(
    submitHomeworkAction,
    {},
  );

  return (
    <form action={formAction} className="space-y-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
      <input type="hidden" name="submissionId" value={submissionId} />

      <div className="space-y-2">
        <label htmlFor="content" className="text-sm font-bold text-brand-900">
          Digital notebook
        </label>
        <textarea
          id="content"
          name="content"
          rows={6}
          defaultValue={defaultContent ?? ''}
          placeholder="Type your answers here…"
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="files" className="flex items-center gap-1.5 text-sm font-bold text-brand-900">
          <Paperclip className="h-4 w-4" /> Attach photos or files
        </label>
        <input
          id="files"
          name="files"
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx"
          className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-full file:border-0 file:bg-indigo-100 file:px-4 file:py-2 file:text-sm file:font-bold file:text-indigo-700 hover:file:bg-indigo-200"
        />
        <p className="text-xs text-slate-400">
          Snap a photo of your working, or upload a document. Up to 15MB per file.
        </p>
      </div>

      {state.error && (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600">{state.error}</p>
      )}
      {state.success && (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
          Submitted! Your tutor will review it. 🎉
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-indigo-600 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
      >
        <Send className="h-4 w-4" />
        {pending ? 'Submitting…' : resubmit ? 'Resubmit homework' : 'Submit homework'}
      </button>
    </form>
  );
}
