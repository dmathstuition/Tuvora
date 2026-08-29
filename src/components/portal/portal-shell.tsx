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
    <div className="min-h-screen bg-[#f6f7fb] pb-24">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur">
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

      <main className="mx-auto max-w-3xl px-4 py-5">{children}</main>

      {/* Bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-stretch justify-between px-2">
          {TABS.map((t) => {
            const Icon = t.icon;
            const on = t.key === active;
            return (
              <Link
                key={t.key}
                href={t.href}
                className={cn(
                  'relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors',
                  on ? 'text-brand-700' : 'text-slate-400 hover:text-slate-600',
                )}
              >
                {on && <span className="absolute top-0 h-1 w-8 rounded-full bg-amber-400" />}
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
