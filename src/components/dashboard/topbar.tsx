import { logoutAction } from '@/app/(auth)/actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { initials } from '@/lib/utils';
import { LogOut } from 'lucide-react';
import { DashboardMobileNav } from '@/components/dashboard/mobile-nav';
import type { Permission } from '@/constants/roles';

export function Topbar({
  orgName,
  userName,
  planLabel,
  permissions,
}: {
  orgName: string;
  userName: string | null;
  planLabel?: string;
  permissions: Permission[];
}) {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-4 lg:px-8">
      <div className="flex items-center gap-3">
        <DashboardMobileNav permissions={permissions} />
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-900 text-sm font-semibold text-white">
          {initials(orgName)}
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold">{orgName}</p>
          {planLabel && <p className="text-xs text-muted-foreground">{planLabel}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {planLabel && (
          <Badge variant="secondary" className="hidden sm:inline-flex">
            {planLabel}
          </Badge>
        )}
        <span className="hidden text-sm text-muted-foreground sm:inline">{userName}</span>
        <form action={logoutAction}>
          <Button variant="ghost" size="icon" type="submit" aria-label="Log out">
            <LogOut className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </header>
  );
}
