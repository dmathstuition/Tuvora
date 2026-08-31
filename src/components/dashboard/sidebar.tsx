'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronsUpDown, Rocket, LifeBuoy, LogOut } from 'lucide-react';
import { DASHBOARD_NAV } from '@/config/dashboard-nav';
import { Logo, LogoMark } from '@/components/brand/logo';
import { logoutAction } from '@/app/(auth)/actions';
import { cn } from '@/lib/utils';
import type { Permission } from '@/constants/roles';

export interface SidebarOrg {
  name: string;
  planLabel: string;
  logoUrl: string | null;
  hasPlan: boolean;
}

/**
 * Dashboard sidebar. A pinned logo and organization card sit above a
 * permission-filtered, independently scrolling nav; an upsell card, Help Centre
 * and Logout stay pinned at the bottom. The nav uses `min-h-0` + `overflow-y-auto`
 * so long navigation always scrolls instead of clipping the footer.
 */
export function Sidebar({ permissions, org }: { permissions: Permission[]; org: SidebarOrg }) {
  const pathname = usePathname();
  const allowed = new Set(permissions);

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-card lg:flex lg:h-screen lg:flex-col">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center border-b px-6">
        <Link href="/dashboard" aria-label="Tuvoria dashboard">
          <Logo showTagline />
        </Link>
      </div>

      {/* Organization card */}
      <div className="shrink-0 px-3 pt-4">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 rounded-xl border bg-background p-2.5 text-left transition-colors hover:bg-accent/60"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full ring-2 ring-primary/30">
            {org.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={org.logoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-muted">
                <LogoMark className="h-6 w-6" />
              </span>
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">{org.name}</span>
            <span
              className={cn(
                'mt-0.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold',
                org.hasPlan ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600',
              )}
            >
              {org.planLabel}
            </span>
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </Link>
        <p className="mt-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Organization
        </p>
      </div>

      {/* Navigation (scrolls independently) */}
      <nav className="min-h-0 flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {DASHBOARD_NAV.map((section) => {
          const items = section.items.filter(
            (item) => !item.permission || allowed.has(item.permission),
          );
          if (items.length === 0) return null;
          return (
            <div key={section.label}>
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {section.label}
              </p>
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const active =
                    pathname === item.href ||
                    (item.href !== '/dashboard' && pathname.startsWith(item.href));
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                          active
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {item.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Footer: upsell + help + logout (pinned) */}
      <div className="shrink-0 space-y-2 border-t p-3">
        {!org.hasPlan && (
          <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 p-4 text-white">
            <p className="flex items-center gap-1.5 text-sm font-bold">
              <Rocket className="h-4 w-4" /> Unlock the full power of Tuvoria
            </p>
            <p className="mt-1 text-xs text-white/80">
              Subscribe to a plan and access all premium features.
            </p>
            <Link
              href="/dashboard/subscription"
              className="mt-3 block rounded-lg bg-white/95 px-3 py-1.5 text-center text-xs font-semibold text-indigo-600 hover:bg-white"
            >
              View Plans
            </Link>
          </div>
        )}
        <Link
          href="/dashboard/support"
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent/60 hover:text-foreground"
        >
          <LifeBuoy className="h-4 w-4" /> Help Center
        </Link>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent/60 hover:text-foreground"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </form>
      </div>
    </aside>
  );
}

export type { Permission };
