import { cn } from '@/lib/utils';

/**
 * Tuvoria logo mark — the academy's official icon (graduation cap over a
 * speech bubble holding a learner + growth chart). Served as the supplied
 * brand image so it renders exactly as designed. Square; scales with the
 * height/width utility classes callers pass (defaults to h-8 w-8).
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/tuvoria-mark.png"
      alt="Tuvoria"
      className={cn('h-8 w-8 object-contain', className)}
    />
  );
}

/**
 * Full brand lockup: the official mark next to the two-tone "Tuvoria" wordmark
 * (purple "Tu", navy "voria") to match the supplied logo, with an optional
 * tagline. Used in headers, footers and sidebars.
 */
export function Logo({
  className,
  showWordmark = true,
  showTagline = false,
}: {
  className?: string;
  showWordmark?: boolean;
  showTagline?: boolean;
}) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark className="h-9 w-9" />
      {showWordmark && (
        <span className="flex flex-col leading-none">
          <span className="text-xl font-extrabold tracking-tight">
            <span className="text-brand-600 dark:text-brand-400">Tu</span>
            <span className="text-brand-900 dark:text-foreground">voria</span>
          </span>
          {showTagline && (
            <span className="mt-0.5 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Manage. Teach. Grow.
            </span>
          )}
        </span>
      )}
    </span>
  );
}
