import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Video, Users, User, ExternalLink, CalendarCheck } from 'lucide-react';
import { getAuthContext } from '@/lib/auth/context';
import { can } from '@/lib/permissions';
import {
  listOnlineLessons,
  getLessonTargets,
  createOnlineLessonAction,
  deleteOnlineLessonAction,
} from '@/services/lessons';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { CreateDialog } from '@/components/ui/create-dialog';
import { ConfirmButton } from '@/components/ui/confirm-button';

export const metadata: Metadata = { title: 'Online lessons' };

export default async function LessonsPage() {
  const ctx = await getAuthContext();
  if (!ctx?.organizationId) redirect('/onboarding');

  const [lessons, targets] = await Promise.all([listOnlineLessons(), getLessonTargets()]);
  const canManage = can(ctx, 'lessons.manage');

  const targetOptions = [
    { value: '', label: 'Choose a class or learner…' },
    ...targets.classes.map((c) => ({ value: `class:${c.id}`, label: `Class · ${c.name}` })),
    ...targets.learners.map((l) => ({ value: `learner:${l.id}`, label: `1-to-1 · ${l.name}` })),
  ];
  const canSchedule = canManage && (targets.classes.length > 0 || targets.learners.length > 0);

  return (
    <div className="space-y-6 pb-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Online lessons</h1>
          <p className="text-sm text-muted-foreground">
            Schedule live online lessons for a class or a one-to-one learner. Learners join from
            their app using the meeting link.
          </p>
        </div>
        {canSchedule && (
          <CreateDialog
            action={createOnlineLessonAction}
            title="Schedule an online lesson"
            triggerLabel="Schedule lesson"
            submitLabel="Schedule"
            fields={[
              { name: 'title', label: 'Lesson title', required: true, placeholder: 'Algebra — quadratic equations' },
              { name: 'target', label: 'Assign to', type: 'select', required: true, options: targetOptions },
              { name: 'startsAt', label: 'Date & time', type: 'datetime-local', required: true },
              {
                name: 'meetingUrl',
                label: 'Meeting link',
                placeholder: 'https://meet.google.com/… or Zoom link',
              },
            ]}
          />
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scheduled lessons · {lessons.length}</CardTitle>
          <CardDescription>Upcoming lessons first, then past ones.</CardDescription>
        </CardHeader>
        <CardContent className={lessons.length ? 'p-0' : undefined}>
          {lessons.length === 0 ? (
            <EmptyState
              icon={Video}
              title="No lessons scheduled yet"
              description={
                canSchedule
                  ? 'Schedule your first online lesson and share the meeting link with your learners.'
                  : 'Create a class or add a learner first, then schedule online lessons here.'
              }
            />
          ) : (
            <ul className="divide-y">
              {lessons.map((l) => (
                <li key={l.id} className="flex items-center gap-3 px-4 py-3">
                  <span
                    className={`flex h-10 w-10 flex-none items-center justify-center rounded-xl ${
                      l.past ? 'bg-muted text-muted-foreground' : 'bg-brand-50 text-brand-600'
                    }`}
                  >
                    {l.classId ? <Users className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{l.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {l.className ? `Class · ${l.className}` : l.learnerName ? `1-to-1 · ${l.learnerName}` : 'Unassigned'}
                      {' · '}
                      {new Date(l.startsAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      {l.past && ' · past'}
                    </p>
                  </div>
                  {l.meetingUrl && (
                    <Link
                      href={l.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Join
                    </Link>
                  )}
                  {canManage && l.classId && (
                    <Link
                      href={`/dashboard/attendance?classId=${l.classId}&date=${new Date(l.startsAt).toISOString().slice(0, 10)}`}
                      className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
                    >
                      <CalendarCheck className="h-3.5 w-3.5" /> Attendance
                    </Link>
                  )}
                  {canManage && (
                    <form action={deleteOnlineLessonAction}>
                      <input type="hidden" name="id" value={l.id} />
                      <ConfirmButton message="Delete this scheduled lesson?" label="" withIcon />
                    </form>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
