import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Colour tones for icon tiles across the dashboard widgets. */
export type Tone = 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'indigo' | 'slate' | 'emerald';

/** Gradient chips give the tiles a modern, tactile feel (white icon on top). */
const TONE: Record<Tone, { grad: string; glow: string }> = {
  blue: { grad: 'from-blue-500 to-blue-600', glow: 'shadow-blue-500/30' },
  green: { grad: 'from-emerald-500 to-green-600', glow: 'shadow-emerald-500/30' },
  amber: { grad: 'from-amber-400 to-orange-500', glow: 'shadow-amber-500/30' },
  red: { grad: 'from-rose-500 to-red-600', glow: 'shadow-rose-500/30' },
  purple: { grad: 'from-purple-500 to-fuchsia-600', glow: 'shadow-fuchsia-500/30' },
  indigo: { grad: 'from-indigo-500 to-violet-600', glow: 'shadow-violet-500/30' },
  slate: { grad: 'from-slate-500 to-slate-700', glow: 'shadow-slate-500/20' },
  emerald: { grad: 'from-emerald-500 to-teal-600', glow: 'shadow-teal-500/30' },
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
        'inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md',
        TONE[tone].grad,
        TONE[tone].glow,
        className,
      )}
    >
      <Icon className="h-5 w-5" />
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
    <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between gap-2">
        <IconTile icon={icon} tone={tone} />
        {hasTrend && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-xs font-bold',
              up ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600',
            )}
          >
            {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(trendPct as number)}%
          </span>
        )}
      </div>
      <p className="mt-4 text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-bold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {hasTrend ? 'vs last month' : 'all time'}
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
    <section
      className={cn(
        'flex flex-col rounded-2xl border border-border/60 bg-card shadow-sm transition-shadow duration-300 hover:shadow-md',
        className,
      )}
    >
      <header className="flex items-center justify-between gap-3 px-5 pb-3 pt-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          {Icon && (
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <Icon className="h-3.5 w-3.5" />
            </span>
          )}
          {title}
        </h2>
        {action}
      </header>
      <div className={cn('flex-1 p-5 pt-1', bodyClassName)}>{children}</div>
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
            className="group flex flex-col gap-2 rounded-xl border border-border/60 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
          >
            <IconTile icon={Icon} tone={a.tone ?? 'indigo'} className="transition-transform duration-300 group-hover:scale-110" />
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
