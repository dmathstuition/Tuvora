import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Megaphone } from 'lucide-react';
import { getAuthContext } from '@/lib/auth/context';
import { createClient } from '@/lib/supabase/server';
import { SectionCard, EmptyPanel } from '@/components/dashboard/widgets';
import { relativeTime } from '@/lib/activity';

export const metadata: Metadata = { title: 'Announcements' };

export default async function AnnouncementsPage() {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) redirect('/onboarding');
  const supabase = await createClient();

  const { data: threads } = await supabase
    .from('message_threads')
    .select('id, subject, kind, created_at')
    .eq('organization_id', ctx.organizationId)
    .eq('kind', 'announcement')
    .order('created_at', { ascending: false })
    .limit(50);
  const rows = threads ?? [];

  return (
    <div className="space-y-6 pb-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
          <p className="text-sm text-muted-foreground">
            Broadcast updates to learners, parents and staff.
          </p>
        </div>
        <Link
          href="/dashboard/messages"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Megaphone className="h-4 w-4" /> New announcement
        </Link>
      </div>

      <SectionCard title="Recent announcements" icon={Megaphone} bodyClassName={rows.length ? 'p-0' : undefined}>
        {rows.length === 0 ? (
          <EmptyPanel
            icon={Megaphone}
            title="No announcements yet"
            description="Post an announcement to reach everyone in your academy at once."
            ctaLabel="Compose in Messages"
            ctaHref="/dashboard/messages"
          />
        ) : (
          <ul className="divide-y">
            {rows.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/dashboard/messages/${t.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-accent/40"
                >
                  <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                    <Megaphone className="h-4 w-4" />
                  </span>
                  <span className="flex-1 text-sm font-medium">{t.subject ?? 'Announcement'}</span>
                  <span className="text-xs text-muted-foreground">{relativeTime(t.created_at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
