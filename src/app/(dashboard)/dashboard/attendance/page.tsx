import type { Metadata } from 'next';
import { CalendarCheck } from 'lucide-react';
import { getAttendanceClasses, getRegister } from '@/services/attendance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { RegisterForm } from './register-form';

export const metadata: Metadata = { title: 'Attendance' };

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string; date?: string }>;
}) {
  const { classId, date } = await searchParams;
  const classes = await getAttendanceClasses();
  const selectedDate = date || today();

  const register = classId ? await getRegister(classId, selectedDate) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Attendance</h1>
        <p className="text-sm text-muted-foreground">
          Take the register for a class session. Re-saving a session corrects it.
        </p>
      </div>

      {classes.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No classes to register"
          description="Create a class and enrol learners to start taking attendance."
        />
      ) : (
        <>
          {/* Class + date picker (GET form updates the URL). */}
          <Card>
            <CardContent className="pt-6">
              <form method="get" className="flex flex-wrap items-end gap-3">
                <div className="space-y-1.5">
                  <label htmlFor="classId" className="text-sm font-medium">
                    Class
                  </label>
                  <select
                    id="classId"
                    name="classId"
                    defaultValue={classId ?? ''}
                    className="h-10 min-w-56 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="" disabled>
                      Select a class…
                    </option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="date" className="text-sm font-medium">
                    Session date
                  </label>
                  <input
                    id="date"
                    name="date"
                    type="date"
                    defaultValue={selectedDate}
                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <Button type="submit" variant="secondary">
                  Load register
                </Button>
              </form>
            </CardContent>
          </Card>

          {classId && register && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Register · {new Date(selectedDate).toLocaleDateString()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {register.rows.length === 0 ? (
                  <EmptyState
                    title="No learners enrolled"
                    description="Enrol learners in this class to take attendance."
                  />
                ) : register.canManage ? (
                  <RegisterForm classId={classId} date={selectedDate} rows={register.rows} />
                ) : (
                  <div className="divide-y rounded-lg border text-sm">
                    {register.rows.map((r) => (
                      <div key={r.learner_id} className="flex justify-between px-4 py-3">
                        <span className="font-medium">{r.name}</span>
                        <span className="text-muted-foreground">{r.status ?? 'not marked'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
