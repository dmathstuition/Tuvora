'use client';

import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Triggers the browser print dialog, from which the user can "Save as PDF".
 * The report page's print CSS strips the dashboard chrome so the output is a
 * clean, single-document report suitable for sharing with parents.
 */
export function PrintButton() {
  return (
    <Button onClick={() => window.print()} className="print:hidden">
      <Printer className="h-4 w-4" /> Print / Save as PDF
    </Button>
  );
}
