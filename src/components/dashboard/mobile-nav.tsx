'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { DASHBOARD_NAV } from '@/config/dashboard-nav';
import { Logo } from '@/components/brand/logo';
import { cn } from '@/lib/utils';
import type { Permission } from '@/constants/roles';

/**
 * Mobile navigation drawer for the tutor dashboard. Rendered only below the lg
 * breakpoint (the persistent sidebar takes over above it). Mirrors the sidebar's
 * permission filtering.
 */
export function DashboardMobileNav({ permissions }: { permissions: Permission[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const allowed = new Set(permissions);

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="flex h-9 w-9 items-center justify-center rounded-md border hover:bg-accent"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <nav className="relative flex h-full w-72 max-w-[85%] flex-col overflow-y-auto border-r bg-card">
            <div className="flex h-16 items-center justify-between border-b px-4">
              <Logo />
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="rounded-md p-1 hover:bg-accent">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-6 px-3 py-6">
              {DASHBOARD_NAV.map((section) => {
                const items = section.items.filter((i) => !i.permission || allowed.has(i.permission));
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
                              onClick={() => setOpen(false)}
                              className={cn(
                                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium',
                                active ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
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
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
