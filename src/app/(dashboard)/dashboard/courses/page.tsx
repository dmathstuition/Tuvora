import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { getAuthContext } from '@/lib/auth/context';
import { can } from '@/lib/permissions';
import { listCourses, createCourseAction } from '@/services/courses';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { CreateDialog } from '@/components/ui/create-dialog';

export const metadata: Metadata = { title: 'Courses' };

const createFields = [
  { name: 'title', label: 'Course title', required: true, placeholder: 'e.g. Foundations of Algebra' },
  { name: 'level', label: 'Level', placeholder: 'e.g. JSS2' },
  { name: 'description', label: 'Description', type: 'textarea' as const },
];

export default async function CoursesPage() {
  const ctx = await getAuthContext();
  const canManage = !!ctx && can(ctx, 'courses.manage');
  const courses = await listCourses();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Courses</h1>
          <p className="text-sm text-muted-foreground">Structured learning content — modules and lessons.</p>
        </div>
        {canManage && (
          <CreateDialog action={createCourseAction} fields={createFields} title="Create a course" triggerLabel="New course" submitLabel="Create course" />
        )}
      </div>

      {courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses yet"
          description="Create a course to organise lessons into modules your learners can work through."
          action={canManage ? <CreateDialog action={createCourseAction} fields={createFields} title="Create a course" triggerLabel="New course" submitLabel="Create course" /> : undefined}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((c) => (
            <Link key={c.id} href={`/dashboard/courses/${c.id}`}>
              <Card className="h-full transition-colors hover:border-primary">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{c.title}</h3>
                    <Badge variant={c.status === 'published' ? 'success' : 'warning'}>{c.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {c.level ?? 'All levels'} · {c.lessons} lessons
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
