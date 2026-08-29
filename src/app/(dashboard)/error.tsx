'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

/**
 * Dashboard segment error boundary. Turns an otherwise blank "Application error"
 * white-screen into a recoverable state and surfaces the error digest so a
 * failing render can be correlated with the server logs.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Also log to the browser console for quick inspection.
    console.error('Dashboard render error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="max-w-md space-y-4">
        <h1 className="text-xl font-bold">Something went wrong loading this page</h1>
        <p className="text-sm text-muted-foreground">
          An unexpected error stopped this page from rendering. You can try again — if it keeps
          happening, share the reference below with support.
        </p>
        {error.digest && (
          <p className="rounded-md bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
            Reference: {error.digest}
          </p>
        )}
        <div className="flex justify-center gap-2">
          <Button onClick={reset}>Try again</Button>
          <Button variant="outline" asChild>
            <a href="/dashboard">Back to dashboard</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
