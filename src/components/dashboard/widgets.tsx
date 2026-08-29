import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Soft colour tones for icon tiles across the dashboard widgets. */
export type Tone = 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'indigo' | 'slate' | 'emerald';

const TONE: Record<Tone, { bg: string; fg: string }> = {
  blue: { bg: 'bg-blue-50', fg: 'text-blue-600' },
  green: { bg: 'bg-green-50', fg: 'text-green-600' },
  amber: { bg: 'bg-amber-50', fg: 'text-amber-600' },
  red: { bg: 'bg-rose-50', fg: 'text-rose-600' },
  purple: { bg: 'bg-purple-50', fg: 'text-purple-600' },
  indigo: { bg: 'bg-indigo-50', fg: 'text-indigo-600' },
  slate: { bg: 'bg-slate-100', fg: 'text-slate-600' },
  emerald: { bg: 'bg-emerald-50', fg: 'text-emerald-600' },
};

export function IconTile({
  icon: Icon,
  tone = 'indigo',
  className,
}: {
  icon: LucideIcon;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-xl',
        TONE[tone].bg,
        className,
      )}
    >
      <Icon className={cn('h-5 w-5', TONE[tone].fg)} />
    </span>
  );
}

/** Headline metric card with an icon tile and a "vs last month" trend line. */
export function StatTile({
  icon,
  tone = 'indigo',
  label,
  value,
  trendPct,
}: {
  icon: LucideIcon;
  tone?: Tone;
  label: string;
  value: string | number;
  trendPct?: number | null;
}) {
  const hasTrend = trendPct != null;
  const up = (trendPct ?? 0) >= 0;
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <IconTile icon={icon} tone={tone} />
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
      <p className="mt-1 flex items-center gap-1 text-xs">
        {hasTrend ? (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 font-semibold',
              up ? 'text-emerald-600' : 'text-rose-600',
            )}
          >
            {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(trendPct as number)}%
          </span>
        ) : (
          <span className="font-semibold text-muted-foreground">0%</span>
        )}
        <span className="text-muted-foreground">vs last month</span>
      </p>
    </div>
  );
}

/** Card shell with a title row and an optional right-aligned action node. */
export function SectionCard({
  title,
  icon: Icon,
  action,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn('flex flex-col rounded-2xl border bg-card shadow-sm', className)}>
      <header className="flex items-center justify-between gap-3 border-b px-5 py-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
          {title}
        </h2>
        {action}
      </header>
      <div className={cn('flex-1 p-5', bodyClassName)}>{children}</div>
    </section>
  );
}

/** Centered empty state with an illustration icon and a call to action. */
export function EmptyPanel({
  icon: Icon,
  title,
  description,
  ctaLabel,
  ctaHref,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <Icon className="h-7 w-7 text-muted-foreground" />
      </span>
      <p className="mt-4 font-semibold">{title}</p>
      <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">{description}</p>
      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  );
}

/** Simple label + count list (Task List widget). */
export function TaskList({
  items,
}: {
  items: { label: string; count: number; href?: string; highlight?: boolean }[];
}) {
  return (
    <ul className="divide-y">
      {items.map((t) => {
        const row = (
          <div className="flex items-center justify-between py-3 text-sm">
            <span className="text-foreground">{t.label}</span>
            <span
              className={cn(
                'inline-flex min-w-6 items-center justify-center rounded-full px-2 py-0.5 text-xs font-semibold',
                t.count > 0
                  ? t.highlight
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-muted text-foreground'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {t.count}
            </span>
          </div>
        );
        return (
          <li key={t.label}>
            {t.href ? (
              <Link href={t.href} className="block hover:opacity-80">
                {row}
              </Link>
            ) : (
              row
            )}
          </li>
        );
      })}
    </ul>
  );
}

export interface ActivityItem {
  icon: LucideIcon;
  tone?: Tone;
  title: string;
  subtitle?: string;
  time: string;
}

/** Vertical activity feed with icon tiles and timestamps. */
export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">No activity yet.</p>;
  }
  return (
    <ul className="space-y-4">
      {items.map((a, i) => {
        const Icon = a.icon;
        return (
          <li key={i} className="flex gap-3">
            <IconTile icon={Icon} tone={a.tone ?? 'indigo'} className="h-9 w-9 rounded-lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{a.title}</p>
              {a.subtitle && <p className="truncate text-xs text-muted-foreground">{a.subtitle}</p>}
            </div>
            <span className="whitespace-nowrap text-xs text-muted-foreground">{a.time}</span>
          </li>
        );
      })}
    </ul>
  );
}

export interface QuickAction {
  icon: LucideIcon;
  tone?: Tone;
  title: string;
  subtitle: string;
  href: string;
}

/** Grid of quick-action shortcuts. */
export function QuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {actions.map((a) => {
        const Icon = a.icon;
        return (
          <Link
            key={a.title}
            href={a.href}
            className="group flex flex-col gap-2 rounded-xl border p-4 transition-colors hover:border-primary/40 hover:bg-accent/50"
          >
            <IconTile icon={Icon} tone={a.tone ?? 'indigo'} />
            <div>
              <p className="text-sm font-semibold">{a.title}</p>
              <p className="text-xs text-muted-foreground">{a.subtitle}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export interface Tip {
  icon: LucideIcon;
  tone?: Tone;
  title: string;
  subtitle: string;
}

/** Getting-started tips list with an optional footer link. */
export function TipsList({
  tips,
  footerLabel,
  footerHref,
}: {
  tips: Tip[];
  footerLabel?: string;
  footerHref?: string;
}) {
  return (
    <div className="flex h-full flex-col">
      <ul className="space-y-4">
        {tips.map((t) => {
          const Icon = t.icon;
          return (
            <li key={t.title} className="flex gap-3">
              <IconTile icon={Icon} tone={t.tone ?? 'emerald'} className="h-9 w-9 rounded-lg" />
              <div>
                <p className="text-sm font-semibold">{t.title}</p>
                <p className="text-xs text-muted-foreground">{t.subtitle}</p>
              </div>
            </li>
          );
        })}
      </ul>
      {footerLabel && footerHref && (
        <Link
          href={footerHref}
          className="mt-4 block text-center text-sm font-medium text-primary hover:underline"
        >
          {footerLabel}
        </Link>
      )}
    </div>
  );
}

/** Big value + trend line used inside the Growth / Revenue cards. */
export function MetricHeadline({
  value,
  label,
  trendPct,
}: {
  value: string;
  label: string;
  trendPct?: number | null;
}) {
  const up = (trendPct ?? 0) >= 0;
  return (
    <div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      <p className="mt-0.5 flex items-center gap-1 text-xs">
        <span className="text-muted-foreground">{label}</span>
        {trendPct != null ? (
          <span
            className={cn('font-semibold', up ? 'text-emerald-600' : 'text-rose-600')}
          >
            {up ? '▲' : '▼'} {Math.abs(trendPct)}% vs last month
          </span>
        ) : (
          <span className="font-semibold text-muted-foreground">0% vs last month</span>
        )}
      </p>
    </div>
  );
}

/** Legend row (dot + label + value) for donut widgets. */
export function LegendRow({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
        <span className="text-muted-foreground">{label}</span>
      </span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
