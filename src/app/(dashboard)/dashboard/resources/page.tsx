import type { Metadata } from 'next';
import { FolderOpen, LinkIcon, FileText } from 'lucide-react';
import { getAuthContext } from '@/lib/auth/context';
import { can } from '@/lib/permissions';
import { listResources, createResourceAction } from '@/services/resources';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { CreateDialog } from '@/components/ui/create-dialog';

export const metadata: Metadata = { title: 'Resources' };

const fields = [
  { name: 'title', label: 'Title', required: true },
  {
    name: 'kind',
    label: 'Type',
    type: 'select' as const,
    options: [
      { value: 'link', label: 'Link' },
      { value: 'note', label: 'Note' },
      { value: 'video', label: 'Video' },
    ],
  },
  { name: 'url', label: 'URL', placeholder: 'https://…' },
  { name: 'description', label: 'Description', type: 'textarea' as const },
];

export default async function ResourcesPage() {
  const ctx = await getAuthContext();
  const canManage = !!ctx && can(ctx, 'resources.manage');
  const resources = await listResources();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Resources</h1>
          <p className="text-sm text-muted-foreground">Share links, notes and materials with your learners.</p>
        </div>
        {canManage && (
          <CreateDialog action={createResourceAction} fields={fields} title="Add a resource" triggerLabel="Add resource" submitLabel="Add resource" />
        )}
      </div>

      {resources.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No resources yet"
          description="Add links and materials your learners can access."
          action={canManage ? <CreateDialog action={createResourceAction} fields={fields} title="Add a resource" triggerLabel="Add resource" submitLabel="Add resource" /> : undefined}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {resources.map((r) => (
            <Card key={r.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {r.kind === 'link' ? <LinkIcon className="h-4 w-4 text-muted-foreground" /> : <FileText className="h-4 w-4 text-muted-foreground" />}
                    <h3 className="font-semibold">{r.title}</h3>
                  </div>
                  <Badge variant="secondary">{r.kind}</Badge>
                </div>
                {r.description && <p className="mt-1 text-sm text-muted-foreground">{r.description}</p>}
                {r.url && (
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-primary hover:underline">
                    Open resource →
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
