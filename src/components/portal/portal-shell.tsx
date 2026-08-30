import Link from 'next/link';
import { Bell } from 'lucide-react';
import { LogoMark } from '@/components/brand/logo';
import { cn } from '@/lib/utils';
import { PortalSidebar, PortalBottomNav } from './portal-nav';

export type PortalTab = 'home' | 'learn' | 'progress' | 'messages' | 'profile' | 'more';

/**
 * The learner-app shell. On phones it reads as a native app — top bar + fixed
 * bottom tab bar. On tablets and laptops it expands to a left sidebar layout
 * with a wider content area. (`active` is kept for API compatibility; the nav
 * highlights itself from the current path.)
 */
export function PortalShell({
  studentId,
  avatarEmoji,
  themeGradient,
  avatarUrl = null,
  children,
}: {
  active?: PortalTab;
  studentId?: string;
  avatarEmoji: string;
  themeGradient: string;
  avatarUrl?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-indigo-50 via-fuchsia-50/50 to-amber-50/50">
      {/* Playful floating blobs */}
      <div className="pointer-events-none fixed -left-20 top-24 h-56 w-56 rounded-full bg-sky-300/30 blur-3xl" />
      <div className="pointer-events-none fixed -right-16 top-40 h-52 w-52 rounded-full bg-fuchsia-300/30 blur-3xl" />
      <div className="pointer-events-none fixed bottom-24 left-1/3 h-48 w-48 rounded-full bg-amber-300/30 blur-3xl" />

      <div className="relative flex">
        {/* Tablet / laptop sidebar */}
        <PortalSidebar
          studentId={studentId}
          avatarEmoji={avatarEmoji}
          themeGradient={themeGradient}
          avatarUrl={avatarUrl}
        />

        {/* Content column */}
        <div className="min-w-0 flex-1 pb-24 md:pb-0">
          {/* Top bar */}
          <header className="sticky top-0 z-30 border-b border-white/60 bg-white/70 backdrop-blur-xl">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 md:px-8">
              <Link href="/portal" className="flex items-center gap-2 md:hidden" aria-label="Home">
                <LogoMark className="h-8 w-8" />
                <span className="text-xs font-bold tracking-widest text-brand-900">TUVORA</span>
              </Link>
              {studentId && (
                <span className="hidden font-mono text-[11px] tracking-wider text-slate-400 md:block">
                  {studentId}
                </span>
              )}
              <div className="flex items-center gap-2 md:ml-auto">
                <Link
                  href="/portal/notifications"
                  aria-label="Notifications"
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200"
                >
                  <Bell className="h-5 w-5" />
                </Link>
                <Link
                  href="/portal/profile"
                  aria-label="Profile"
                  className={cn(
                    'flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br text-lg ring-2 ring-white md:hidden',
                    themeGradient,
                  )}
                >
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    avatarEmoji
                  )}
                </Link>
              </div>
            </div>
          </header>

          <main className="relative mx-auto max-w-5xl px-4 py-5 md:px-8 md:py-8">{children}</main>
        </div>
      </div>

      {/* Phone bottom tab bar */}
      <PortalBottomNav />
    </div>
  );
}
