import { redirect } from 'next/navigation';
import { Search, Bell } from 'lucide-react';
import { getAuthContext, getProfile } from '@/lib/auth/context';
import { isPlatformStaff } from '@/lib/permissions';
import { logoutAction } from '@/app/(auth)/actions';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { AdminMobileNav } from '@/components/admin/admin-mobile-nav';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { initials } from '@/lib/utils';

/**
 * Platform admin shell. Guarded to platform staff only — holding an
 * organization owner role never grants access here (explicit platform check).
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getAuthContext();
  if (!ctx) redirect('/login');
  if (!isPlatformStaff(ctx)) redirect('/dashboard');

  const profile = await getProfile();
  const roleLabel = ctx.platformRole === 'super_admin' ? 'Super Admin' : 'Platform Support';

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between gap-4 border-b bg-background px-4 lg:px-8">
          <AdminMobileNav />
          <div className="relative hidden max-w-md flex-1 md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search anything…"
              className="h-10 w-full rounded-lg border border-input bg-muted/40 pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-900 text-sm font-semibold text-white">
                {initials(profile?.full_name ?? profile?.email ?? 'A')}
              </div>
              <div className="hidden leading-tight sm:block">
                <p className="text-sm font-semibold">{profile?.full_name ?? 'Admin'}</p>
                <Badge variant="default" className="mt-0.5">
                  {roleLabel}
                </Badge>
              </div>
              <form action={logoutAction}>
                <Button variant="ghost" size="sm" type="submit">
                  Sign out
                </Button>
              </form>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-muted/20 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
