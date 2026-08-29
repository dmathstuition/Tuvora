'use client';

import { Printer } from 'lucide-react';

/** Opens the browser print dialog ("Save as PDF"). Hidden when printing. */
export function PrintButton({ label = 'Print / Save as PDF' }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700 print:hidden"
    >
      <Printer className="h-4 w-4" /> {label}
    </button>
  );
}
