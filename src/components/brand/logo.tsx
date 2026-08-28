import { cn } from '@/lib/utils';

/**
 * Tuvora logo mark — the speech/communication shape holding a learner + growth
 * chart, capped with a graduation cap. Rendered as inline SVG so it inherits
 * theme colors and scales crisply. This encodes the supplied brand identity;
 * do not redesign it.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={cn('h-8 w-8', className)}
      role="img"
      aria-label="Tuvora"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Speech / communication shape */}
      <path
        d="M9 10.5A4.5 4.5 0 0 1 13.5 6h21A4.5 4.5 0 0 1 39 10.5v18a4.5 4.5 0 0 1-4.5 4.5H21l-7.2 6.2c-1 .86-2.55.15-2.55-1.18V33h-.25A4.5 4.5 0 0 1 6.5 28.5"
        fill="hsl(var(--brand-900))"
      />
      {/* Growth chart bars */}
      <rect x="14.5" y="20" width="3.2" height="6.5" rx="1" fill="hsl(var(--brand-400))" />
      <rect x="19.2" y="16.5" width="3.2" height="10" rx="1" fill="hsl(var(--brand-500))" />
      {/* Learner figure */}
      <circle cx="29" cy="16.5" r="3" fill="hsl(var(--brand-100))" />
      <path d="M23.6 26c0-3 2.4-5 5.4-5s5.4 2 5.4 5z" fill="hsl(var(--brand-100))" />
      {/* Graduation cap */}
      <path d="M24 2 40 8.5 24 15 8 8.5 24 2Z" fill="hsl(var(--brand-500))" />
      <path d="M37 11v5.5c0 2.4-5.8 4.5-13 4.5" stroke="hsl(var(--brand-500))" strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0" />
    </svg>
  );
}

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
      <LogoMark />
      {showWordmark && (
        <span className="flex flex-col leading-none">
          <span className="text-xl font-bold tracking-tight text-brand-900 dark:text-foreground">
            Tuvora
          </span>
          {showTagline && (
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
              Manage. Teach. Grow.
            </span>
          )}
        </span>
      )}
    </span>
  );
}
