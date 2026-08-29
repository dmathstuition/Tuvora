'use client';

import { useState } from 'react';
import { Copy, Check, LinkIcon } from 'lucide-react';

/**
 * Shows the shareable class join link + code with copy buttons. The tutor posts
 * this when scheduling a class; learners open it (or enter the code) to enrol.
 */
export function JoinLink({ code, url }: { code: string; url: string }) {
  const [copied, setCopied] = useState<'link' | 'code' | null>(null);

  function copy(text: string, which: 'link' | 'code') {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(which);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
        <LinkIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="flex-1 truncate text-sm">{url}</span>
        <button
          onClick={() => copy(url, 'link')}
          className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          {copied === 'link' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied === 'link' ? 'Copied' : 'Copy link'}
        </button>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Or share the code:</span>
        <button
          onClick={() => copy(code, 'code')}
          className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 font-mono text-sm font-bold tracking-widest hover:bg-accent"
        >
          {code}
          {copied === 'code' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}
