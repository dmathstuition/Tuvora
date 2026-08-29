import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, FileText } from 'lucide-react';
import { getCourseDetail, addModuleAction, addLessonAction } from '@/services/courses';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { CreateDialog } from '@/components/ui/create-dialog';

export const metadata: Metadata = { title: 'Course' };

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getCourseDetail(id);
  if (!detail) notFound();
  const { course, modules, canManage } = detail;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/courses" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Courses
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{course.title}</h1>
              <Badge variant={course.status === 'published' ? 'success' : 'warning'}>{course.status}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{course.level ?? 'All levels'}</p>
          </div>
          {canManage && (
            <CreateDialog
              action={addModuleAction}
              fields={[{ name: 'title', label: 'Module title', required: true }]}
              title="Add a module"
              triggerLabel="Add module"
              submitLabel="Add module"
              hidden={{ courseId: course.id }}
            />
          )}
        </div>
        {course.description && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{course.description}</p>}
      </div>

      {modules.length === 0 ? (
        <EmptyState icon={FileText} title="No modules yet" description="Add a module, then add lessons to it." />
      ) : (
        <div className="space-y-4">
          {modules.map((m) => (
            <Card key={m.id}>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-base">{m.title}</CardTitle>
                {canManage && (
                  <CreateDialog
                    action={addLessonAction}
                    fields={[
                      { name: 'title', label: 'Lesson title', required: true },
                      { name: 'description', label: 'Description', type: 'textarea' },
                      { name: 'videoUrl', label: 'Video URL', placeholder: 'https://…' },
                    ]}
                    title={`Add lesson to ${m.title}`}
                    triggerLabel="Add lesson"
                    submitLabel="Add lesson"
                    triggerVariant="outline"
                    hidden={{ moduleId: m.id, courseId: course.id }}
                  />
                )}
              </CardHeader>
              <CardContent className="p-0">
                {m.lessons.length === 0 ? (
                  <p className="px-6 pb-6 text-sm text-muted-foreground">No lessons in this module yet.</p>
                ) : (
                  <ul className="divide-y">
                    {m.lessons.map((l) => (
                      <li key={l.id} className="flex items-center gap-2 px-6 py-3 text-sm">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {l.title}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
