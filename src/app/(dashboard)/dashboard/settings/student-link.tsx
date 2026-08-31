'use client';

import { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Shows the tutor the branded login link to share with their learners
 * (`/school/<slug>`), with a one-tap copy button.
 */
export function StudentLoginLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard may be blocked — the link is still visible to copy manually */
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <code className="flex-1 truncate rounded-md border bg-muted/40 px-3 py-2 text-sm">{url}</code>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={copy}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
        <Button asChild variant="outline">
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" /> Open
          </a>
        </Button>
      </div>
    </div>
  );
}
