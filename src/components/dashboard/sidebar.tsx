'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DASHBOARD_NAV } from '@/config/dashboard-nav';
import { Logo } from '@/components/brand/logo';
import { cn } from '@/lib/utils';
import type { Permission } from '@/constants/roles';

/**
 * Dashboard sidebar. The set of permissions the current member holds is
 * resolved server-side and passed down; the sidebar only renders items the
 * member is allowed to see (defence in depth — routes also re-check).
 */
export function Sidebar({ permissions }: { permissions: Permission[] }) {
  const pathname = usePathname();
  const allowed = new Set(permissions);

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-card lg:flex lg:flex-col">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" aria-label="Tuvora dashboard">
          <Logo />
        </Link>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-6">
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
                            ? 'bg-accent text-accent-foreground'
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
    </aside>
  );
}

export type { Permission };
