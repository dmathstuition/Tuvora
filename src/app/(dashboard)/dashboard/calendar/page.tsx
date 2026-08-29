import type { Metadata } from 'next';
import { CalendarDays, GraduationCap, FileText, CalendarClock } from 'lucide-react';
import { getAuthContext } from '@/lib/auth/context';
import { can } from '@/lib/permissions';
import { listUpcomingEvents, createEventAction } from '@/services/calendar';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { CreateDialog } from '@/components/ui/create-dialog';

export const metadata: Metadata = { title: 'Calendar' };

const fields = [
  { name: 'title', label: 'Event title', required: true },
  { name: 'startsAt', label: 'Date & time', type: 'datetime-local' as const, required: true },
  {
    name: 'kind',
    label: 'Type',
    type: 'select' as const,
    options: [
      { value: 'event', label: 'Event' },
      { value: 'class', label: 'Class' },
      { value: 'assessment', label: 'Assessment' },
    ],
  },
];

function iconFor(kind: string) {
  if (kind === 'assignment_due') return FileText;
  if (kind === 'class') return GraduationCap;
  return CalendarClock;
}

export default async function CalendarPage() {
  const ctx = await getAuthContext();
  const canManage = !!ctx && can(ctx, 'calendar.manage');
  const events = await listUpcomingEvents();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          <p className="text-sm text-muted-foreground">Upcoming events, classes and assignment deadlines.</p>
        </div>
        {canManage && (
          <CreateDialog action={createEventAction} fields={fields} title="Add an event" triggerLabel="New event" submitLabel="Add event" />
        )}
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Nothing scheduled"
          description="Add events, or set assignment due dates — upcoming items appear here."
          action={canManage ? <CreateDialog action={createEventAction} fields={fields} title="Add an event" triggerLabel="New event" submitLabel="Add event" /> : undefined}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y">
              {events.map((e) => {
                const Icon = iconFor(e.kind);
                const d = new Date(e.startsAt);
                return (
                  <li key={`${e.source}-${e.id}`} className="flex items-center gap-4 px-4 py-3">
                    <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-accent text-accent-foreground">
                      <span className="text-xs font-semibold uppercase">{d.toLocaleString(undefined, { month: 'short' })}</span>
                      <span className="text-sm font-bold leading-none">{d.getDate()}</span>
                    </div>
                    <div className="flex-1">
                      <p className="flex items-center gap-2 text-sm font-medium">
                        <Icon className="h-4 w-4 text-muted-foreground" /> {e.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {d.toLocaleString(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' })}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
