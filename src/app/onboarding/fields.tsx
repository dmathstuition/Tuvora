'use client';

import { useState, type ReactNode } from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const inputBase =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200';

export function Field({
  label,
  hint,
  optional,
  children,
}: {
  label: string;
  hint?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-center gap-2 text-sm font-semibold text-brand-900">
        {label}
        {optional && <span className="text-xs font-normal text-slate-400">Optional</span>}
      </span>
      {children}
      {hint && <span className="block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

export function TextField(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputBase, props.className)} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(inputBase, 'min-h-20', props.className)} />;
}

export function SelectField({
  options,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  options: { value: string; label: string }[];
}) {
  return (
    <select {...props} className={cn(inputBase, 'h-11', props.className)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/** Big single-select cards (e.g. business type, format, delivery). */
export function OptionCards({
  value,
  onChange,
  options,
  columns = 2,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; hint?: string }[];
  columns?: 2 | 3;
}) {
  return (
    <div className={cn('grid gap-3', columns === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            type="button"
            key={o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              'rounded-2xl border p-4 text-left transition-all',
              active
                ? 'border-brand-500 bg-brand-50/60 ring-2 ring-brand-200'
                : 'border-slate-200 bg-white hover:border-brand-300 hover:bg-slate-50',
            )}
          >
            <span className="flex items-center justify-between">
              <span className="text-sm font-bold text-brand-900">{o.label}</span>
              {active && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white">
                  <Check className="h-3 w-3" />
                </span>
              )}
            </span>
            {o.hint && <span className="mt-1 block text-xs text-slate-500">{o.hint}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Toggle chips for multi-select (age groups, curricula, levels, working days). */
export function ChipMultiSelect({
  values,
  onChange,
  options,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  options: readonly string[] | { value: string; label: string }[];
}) {
  const norm = (options as (string | { value: string; label: string })[]).map((o) =>
    typeof o === 'string' ? { value: o, label: o } : o,
  );
  const toggle = (v: string) =>
    onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
  return (
    <div className="flex flex-wrap gap-2">
      {norm.map((o) => {
        const active = values.includes(o.value);
        return (
          <button
            type="button"
            key={o.value}
            onClick={() => toggle(o.value)}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all',
              active
                ? 'border-brand-500 bg-brand-600 text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** Free-form tag input (subjects). Enter or comma to add. */
export function TagInput({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const t = draft.trim();
    if (t && !values.includes(t)) onChange([...values, t]);
    setDraft('');
  };
  return (
    <div className={cn(inputBase, 'flex flex-wrap items-center gap-2')}>
      {values.map((v) => (
        <span
          key={v}
          className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-700"
        >
          {v}
          <button type="button" onClick={() => onChange(values.filter((x) => x !== v))} aria-label={`Remove ${v}`}>
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            add();
          }
        }}
        onBlur={add}
        placeholder={values.length === 0 ? placeholder : ''}
        className="min-w-24 flex-1 border-0 bg-transparent p-0 text-sm focus:outline-none focus:ring-0"
      />
    </div>
  );
}

/** Yes/No pill toggle. */
export function YesNoToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="inline-flex rounded-full border border-slate-200 bg-white p-1">
      {[
        { v: true, label: 'Yes' },
        { v: false, label: 'No' },
      ].map((o) => (
        <button
          type="button"
          key={o.label}
          onClick={() => onChange(o.v)}
          className={cn(
            'rounded-full px-5 py-1.5 text-sm font-semibold transition',
            value === o.v ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-500',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
