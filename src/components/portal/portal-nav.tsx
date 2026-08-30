'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  BookOpen,
  NotebookPen,
  Sparkles,
  TrendingUp,
  CalendarDays,
  MessageSquare,
  LayoutGrid,
  LogOut,
  type LucideIcon,
} from 'lucide-react';
import { LogoMark } from '@/components/brand/logo';
import { logoutAction } from '@/app/(auth)/actions';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

/** Full destination set — shown in the tablet/laptop sidebar. */
const SIDEBAR_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/portal', icon: Home },
  { label: 'Learn', href: '/portal/learn', icon: BookOpen },
  { label: 'Homework', href: '/portal/homework', icon: NotebookPen },
  { label: 'Question solver', href: '/portal/solver', icon: Sparkles },
  { label: 'Progress', href: '/portal/progress', icon: TrendingUp },
  { label: 'Calendar', href: '/portal/calendar', icon: CalendarDays },
  { label: 'Messages', href: '/portal/messages', icon: MessageSquare },
  { label: 'More', href: '/portal/more', icon: LayoutGrid },
];

/** Core set — the phone bottom tab bar. */
const TAB_ITEMS: NavItem[] = [
  { label: 'Home', href: '/portal', icon: Home },
  { label: 'Learn', href: '/portal/learn', icon: BookOpen },
  { label: 'Homework', href: '/portal/homework', icon: NotebookPen },
  { label: 'Progress', href: '/portal/progress', icon: TrendingUp },
  { label: 'More', href: '/portal/more', icon: LayoutGrid },
];

function isActive(pathname: string, href: string): boolean {
  if (href === '/portal') return pathname === '/portal';
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Tablet & laptop left sidebar (hidden on phones). */
export function PortalSidebar({
  studentId,
  avatarEmoji,
  themeGradient,
  avatarUrl = null,
}: {
  studentId?: string;
  avatarEmoji: string;
  themeGradient: string;
  avatarUrl?: string | null;
}) {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/60 bg-white/70 backdrop-blur-xl md:flex">
      <div className="flex h-16 items-center gap-2 border-b border-white/60 px-5">
        <LogoMark className="h-8 w-8" />
        <span className="text-lg font-bold tracking-tight text-brand-900">Tuvora</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {SIDEBAR_ITEMS.map((item) => {
          const on = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-all',
                on
                  ? 'bg-gradient-to-r from-brand-500 to-violet-600 text-white shadow-md shadow-violet-500/20'
                  : 'text-slate-500 hover:bg-white hover:text-brand-700',
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/60 p-3">
        <Link
          href="/portal/profile"
          className="flex items-center gap-3 rounded-xl p-2 hover:bg-white"
        >
          <span
            className={cn(
              'flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br text-lg ring-2 ring-white',
              themeGradient,
            )}
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              avatarEmoji
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-brand-900">My profile</p>
            {studentId && <p className="truncate font-mono text-[11px] text-slate-400">{studentId}</p>}
          </div>
        </Link>
        <form action={logoutAction}>
          <button
            type="submit"
            className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
          >
            <LogOut className="h-5 w-5" /> Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}

/** Phone bottom tab bar (hidden on tablet & laptop). */
export function PortalBottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/60 bg-white/85 backdrop-blur-xl md:hidden">
      <div className="mx-auto flex max-w-3xl items-stretch justify-between px-2 py-1.5">
        {TAB_ITEMS.map((t) => {
          const Icon = t.icon;
          const on = isActive(pathname, t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                'relative flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-[11px] font-bold transition-all',
                on ? 'text-white' : 'text-slate-400 hover:text-slate-600',
              )}
            >
              {on && (
                <span className="absolute inset-1 -z-10 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 shadow-lg" />
              )}
              <Icon className="h-5 w-5" />
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
