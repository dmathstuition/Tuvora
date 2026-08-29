import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Users } from 'lucide-react';
import { CalendarClock } from 'lucide-react';
import { getClassDetail, updateClassAction, deleteClassAction } from '@/services/classes';
import { listClassSessions, scheduleClassSessionAction, deleteEventAction } from '@/services/calendar';
import { getRequestBaseUrl } from '@/lib/base-url';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { CreateDialog } from '@/components/ui/create-dialog';
import { ConfirmButton } from '@/components/ui/confirm-button';
import { EnrolLearner } from './enrol-learner';
import { UnenrolButton } from './unenrol-button';
import { JoinLink } from './join-link';

export const metadata: Metadata = { title: 'Class' };

const statusVariant: Record<string, 'success' | 'warning' | 'secondary' | 'outline'> = {
  active: 'success',
  draft: 'warning',
  completed: 'secondary',
  archived: 'outline',
};

export default async function ClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getClassDetail(id);
  if (!detail) notFound();

  const { klass, joinCode, enrolled, enrollable, canManage, atCapacity } = detail;
  const capacityLabel = klass.capacity
    ? `${enrolled.length} / ${klass.capacity} enrolled`
    : `${enrolled.length} enrolled`;
  const joinUrl = joinCode ? `${await getRequestBaseUrl()}/portal/join/${joinCode}` : null;
  const sessions = await listClassSessions(id);
  const now = Date.now();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/classes"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Classes
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{klass.name}</h1>
            <Badge variant={statusVariant[klass.status] ?? 'secondary'}>{klass.status}</Badge>
          </div>
          {canManage && (
            <div className="flex items-center gap-2">
              <CreateDialog
                action={updateClassAction}
                title="Edit class"
                triggerLabel="Edit"
                submitLabel="Save changes"
                triggerVariant="outline"
                hidden={{ id: klass.id }}
                fields={[
                  { name: 'name', label: 'Class name', required: true, defaultValue: klass.name },
                  { name: 'description', label: 'Description', type: 'textarea', defaultValue: klass.description ?? '' },
                  {
                    name: 'mode',
                    label: 'Mode',
                    type: 'select',
                    defaultValue: klass.mode,
                    options: [
                      { value: 'group', label: 'Group' },
                      { value: 'one_to_one', label: 'One-to-one' },
                    ],
                  },
                  { name: 'capacity', label: 'Capacity', type: 'number', defaultValue: klass.capacity ? String(klass.capacity) : '' },
                  { name: 'startDate', label: 'Start date', type: 'date', defaultValue: klass.start_date ? klass.start_date.slice(0, 10) : '' },
                  {
                    name: 'status',
                    label: 'Status',
                    type: 'select',
                    defaultValue: klass.status,
                    options: [
                      { value: 'active', label: 'Active' },
                      { value: 'draft', label: 'Draft' },
                      { value: 'completed', label: 'Completed' },
                      { value: 'archived', label: 'Archived' },
                    ],
                  },
                ]}
              />
              <form action={deleteClassAction}>
                <input type="hidden" name="id" value={klass.id} />
                <ConfirmButton
                  variant="outline"
                  message={`Delete "${klass.name}"? This removes the class and its enrolments. This cannot be undone.`}
                />
              </form>
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {klass.mode === 'one_to_one' ? 'One-to-one' : 'Group'} · {capacityLabel}
          {klass.start_date && ` · Starts ${new Date(klass.start_date).toLocaleDateString()}`}
        </p>
        {klass.description && (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{klass.description}</p>
        )}
      </div>

      {/* Scheduled sessions */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="h-4 w-4" /> Scheduled sessions
            </CardTitle>
            <CardDescription>Schedule lessons for this class — no course needed.</CardDescription>
          </div>
          {canManage && (
            <CreateDialog
              action={scheduleClassSessionAction}
              title="Schedule a session"
              triggerLabel="Schedule session"
              submitLabel="Schedule"
              hidden={{ classId: klass.id }}
              fields={[
                { name: 'title', label: 'Session title', required: true, placeholder: 'Week 1 — Fractions' },
                { name: 'startsAt', label: 'Date & time', type: 'datetime-local', required: true },
              ]}
            />
          )}
        </CardHeader>
        <CardContent className={sessions.length ? 'p-0' : undefined}>
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sessions scheduled yet.</p>
          ) : (
            <ul className="divide-y">
              {sessions.map((s) => {
                const past = new Date(s.startsAt).getTime() < now;
                return (
                  <li key={s.id} className="flex items-center gap-3 px-4 py-3">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${past ? 'bg-muted text-muted-foreground' : 'bg-brand-50 text-brand-600'}`}>
                      <CalendarClock className="h-4 w-4" />
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{s.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(s.startsAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        {past && ' · past'}
                      </p>
                    </div>
                    {canManage && (
                      <form action={deleteEventAction}>
                        <input type="hidden" name="id" value={s.id} />
                        <input type="hidden" name="classId" value={klass.id} />
                        <ConfirmButton message="Delete this scheduled session?" label="" withIcon />
                      </form>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {canManage && joinCode && joinUrl && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Class join link</CardTitle>
            <CardDescription>
              Share this when scheduling the class — learners open it (or enter the code in their
              app) to join themselves.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <JoinLink code={joinCode} url={joinUrl} />
          </CardContent>
        </Card>
      )}

      {canManage && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Enrol a learner</CardTitle>
          </CardHeader>
          <CardContent>
            <EnrolLearner classId={klass.id} enrollable={enrollable} atCapacity={atCapacity} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Enrolled learners · {enrolled.length}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {enrolled.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Users}
                title="No learners enrolled yet"
                description="Enrol learners to set assignments, take attendance and track their progress in this class."
              />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Learner</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="hidden px-4 py-3 font-medium md:table-cell">Enrolled</th>
                  {canManage && <th className="px-4 py-3" />}
                </tr>
              </thead>
              <tbody>
                {enrolled.map((l) => (
                  <tr key={l.member_id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium">{l.name}</td>
                    <td className="px-4 py-3">
                      <Badge variant={l.status === 'active' ? 'success' : 'secondary'}>
                        {l.status}
                      </Badge>
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                      {new Date(l.enrolled_at).toLocaleDateString()}
                    </td>
                    {canManage && (
                      <td className="px-4 py-3 text-right">
                        <UnenrolButton memberId={l.member_id} classId={klass.id} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
