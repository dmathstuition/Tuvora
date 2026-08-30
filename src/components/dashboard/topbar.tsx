import { Search, Bell } from 'lucide-react';
import { logoutAction } from '@/app/(auth)/actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { initials } from '@/lib/utils';
import { DashboardMobileNav } from '@/components/dashboard/mobile-nav';
import type { Permission } from '@/constants/roles';

export function Topbar({
  userName,
  roleLabel,
  permissions,
  avatarUrl,
}: {
  orgName?: string;
  userName: string | null;
  roleLabel?: string;
  planLabel?: string;
  permissions: Permission[];
  avatarUrl?: string | null;
}) {
  return (
    <header className="glass-nav sticky top-0 z-30 flex h-16 items-center justify-between gap-4 px-4 lg:px-8">
      <DashboardMobileNav permissions={permissions} />
      <div className="relative hidden max-w-md flex-1 md:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Search learners, classes, lessons…"
          className="h-10 w-full rounded-lg border border-input bg-muted/40 pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <kbd className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground lg:block">
          ⌘K
        </kbd>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-brand-900 text-sm font-semibold text-white">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              initials(userName ?? 'U')
            )}
          </div>
          <div className="hidden leading-tight sm:block">
            <p className="text-sm font-semibold">{userName ?? 'User'}</p>
            {roleLabel && (
              <Badge variant="secondary" className="mt-0.5 capitalize">
                {roleLabel}
              </Badge>
            )}
          </div>
          <form action={logoutAction}>
            <Button variant="ghost" size="sm" type="submit">
              Sign out
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
