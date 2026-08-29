'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const RANGES = ['Today', 'This Week', 'This Month', 'This Quarter', 'This Year'] as const;

/**
 * Lightweight period selector shown on card headers and the page header. It is
 * presentational for now (the widgets already scope to sensible defaults); the
 * selected label is surfaced so it can later drive server queries.
 */
export function RangePicker({
  defaultValue = 'This Month',
  size = 'sm',
}: {
  defaultValue?: (typeof RANGES)[number];
  size?: 'sm' | 'md';
}) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string>(defaultValue);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-lg border bg-background font-medium text-foreground hover:bg-accent',
          size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm',
        )}
      >
        {value}
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-lg border bg-popover p-1 shadow-lg">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onMouseDown={() => {
                setValue(r);
                setOpen(false);
              }}
              className={cn(
                'block w-full rounded-md px-3 py-1.5 text-left text-sm hover:bg-accent',
                r === value ? 'font-semibold text-foreground' : 'text-muted-foreground',
              )}
            >
              {r}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
