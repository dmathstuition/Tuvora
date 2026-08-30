'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ADMIN_NAV } from '@/config/admin-nav';
import { LogoMark } from '@/components/brand/logo';
import { cn } from '@/lib/utils';

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="relative hidden w-64 shrink-0 flex-col overflow-hidden bg-gradient-to-b from-brand-900 via-brand-900 to-brand-950 text-white lg:flex">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -left-16 top-10 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-12 bottom-24 h-40 w-40 rounded-full bg-fuchsia-500/10 blur-3xl" />

      <div className="relative flex h-16 items-center gap-2 border-b border-white/10 px-6">
        <Link href="/admin" aria-label="Tuvora admin" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm">
            <LogoMark className="h-6 w-6" />
          </span>
          <span className="text-lg font-bold tracking-tight text-white">Tuvora</span>
        </Link>
        <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/70">
          Admin
        </span>
      </div>
      <nav className="relative flex-1 space-y-6 overflow-y-auto px-3 py-6">
        {ADMIN_NAV.map((section) => (
          <div key={section.label}>
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-white/40">
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== '/admin' && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all',
                        active
                          ? 'bg-white/15 text-white shadow-sm ring-1 ring-white/20 backdrop-blur'
                          : 'text-white/60 hover:bg-white/10 hover:text-white',
                      )}
                    >
                      <Icon className={cn('h-4 w-4', active ? 'text-amber-300' : '')} />
                      {item.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
