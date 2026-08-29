import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Presentation, Video } from 'lucide-react';
import { getAuthContext } from '@/lib/auth/context';
import { createClient } from '@/lib/supabase/server';
import { SectionCard, EmptyPanel } from '@/components/dashboard/widgets';

export const metadata: Metadata = { title: 'Lessons' };

export default async function LessonsPage() {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) redirect('/onboarding');
  const supabase = await createClient();

  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, title, description, video_url, position')
    .eq('organization_id', ctx.organizationId)
    .order('position', { ascending: true })
    .limit(100);
  const rows = lessons ?? [];

  return (
    <div className="space-y-6 pb-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Lessons</h1>
        <p className="text-sm text-muted-foreground">
          Lesson content across your courses and classes.
        </p>
      </div>

      <SectionCard title="All lessons" icon={Presentation} bodyClassName={rows.length ? 'p-0' : undefined}>
        {rows.length === 0 ? (
          <EmptyPanel
            icon={Presentation}
            title="No lessons yet"
            description="Lessons you add to your courses and classes will appear here."
            ctaLabel="Go to Courses"
            ctaHref="/dashboard/courses"
          />
        ) : (
          <ul className="divide-y">
            {rows.map((l) => (
              <li key={l.id} className="flex items-start gap-3 px-5 py-3">
                <span className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  {l.video_url ? <Video className="h-4 w-4" /> : <Presentation className="h-4 w-4" />}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{l.title}</p>
                  {l.description && (
                    <p className="truncate text-xs text-muted-foreground">{l.description}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}
