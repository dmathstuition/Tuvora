import Link from 'next/link';
import { Home, BookOpen, TrendingUp, MessageSquare, User, LayoutGrid, Bell } from 'lucide-react';
import { LogoMark } from '@/components/brand/logo';
import { cn } from '@/lib/utils';

export type PortalTab = 'home' | 'learn' | 'progress' | 'messages' | 'profile' | 'more';

const TABS: { key: PortalTab; label: string; href: string; icon: typeof Home }[] = [
  { key: 'home', label: 'Home', href: '/portal', icon: Home },
  { key: 'learn', label: 'Learn', href: '/portal/learn', icon: BookOpen },
  { key: 'progress', label: 'Progress', href: '/portal/progress', icon: TrendingUp },
  { key: 'messages', label: 'Messages', href: '/portal/messages', icon: MessageSquare },
  { key: 'profile', label: 'Profile', href: '/portal/profile', icon: User },
  { key: 'more', label: 'More', href: '/portal/more', icon: LayoutGrid },
];

/**
 * The learner-app shell: a Tuvora-branded top bar and a fixed bottom tab bar,
 * wrapping each portal page so the whole thing reads as one native-feeling app.
 */
export function PortalShell({
  active,
  studentId,
  avatarEmoji,
  themeGradient,
  children,
}: {
  active: PortalTab;
  studentId?: string;
  avatarEmoji: string;
  themeGradient: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-b from-indigo-50 via-fuchsia-50/50 to-amber-50/50 pb-24">
      {/* Playful floating blobs */}
      <div className="pointer-events-none fixed -left-20 top-24 h-56 w-56 rounded-full bg-sky-300/30 blur-3xl" />
      <div className="pointer-events-none fixed -right-16 top-40 h-52 w-52 rounded-full bg-fuchsia-300/30 blur-3xl" />
      <div className="pointer-events-none fixed bottom-24 left-1/3 h-48 w-48 rounded-full bg-amber-300/30 blur-3xl" />

      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-white/60 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/portal" className="flex items-center gap-2" aria-label="Home">
            <LogoMark className="h-8 w-8" />
            <span className="hidden text-xs font-bold tracking-widest text-brand-900 sm:block">
              TUVORA
            </span>
          </Link>
          {studentId && (
            <span className="font-mono text-[11px] tracking-wider text-slate-400">{studentId}</span>
          )}
          <div className="flex items-center gap-2">
            <Link
              href="/portal/more"
              aria-label="Notifications"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200"
            >
              <Bell className="h-5 w-5" />
            </Link>
            <Link
              href="/portal/profile"
              aria-label="Profile"
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br text-lg ring-2 ring-white',
                themeGradient,
              )}
            >
              {avatarEmoji}
            </Link>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-3xl px-4 py-5">{children}</main>

      {/* Bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/60 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-stretch justify-between px-2 py-1.5">
          {TABS.map((t) => {
            const Icon = t.icon;
            const on = t.key === active;
            return (
              <Link
                key={t.key}
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
    </div>
  );
}
