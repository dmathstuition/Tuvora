import type { Metadata } from 'next';
import { ToggleRight } from 'lucide-react';
import { listFeatures, viewerIsSuperAdmin } from '@/services/admin';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { ConfirmButton } from '@/components/ui/confirm-button';
import { deleteFeatureAction } from '@/services/admin/actions';
import { FeatureForm } from './feature-form';

export const metadata: Metadata = { title: 'Admin · Features' };

export default async function AdminFeaturesPage() {
  const [features, canWrite] = await Promise.all([listFeatures(), viewerIsSuperAdmin()]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Features</h1>
          <p className="text-sm text-muted-foreground">
            The catalogue of capabilities that plans grant. {features.length} features.
          </p>
        </div>
        {canWrite && <FeatureForm />}
      </div>

      {features.length === 0 ? (
        <EmptyState icon={ToggleRight} title="No features yet" description="Seed the catalogue or add a feature to get started." />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="border-b text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Feature</th>
                  <th className="px-4 py-3 font-medium">Slug</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">In plans</th>
                  {canWrite && <th className="px-4 py-3" />}
                </tr>
              </thead>
              <tbody>
                {features.map((f) => (
                  <tr key={f.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <p className="font-medium">{f.name}</p>
                      {f.description && <p className="text-xs text-muted-foreground">{f.description}</p>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{f.slug}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">{f.type}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{f.plans}</td>
                    {canWrite && (
                      <td className="px-4 py-3 text-right">
                        {f.plans > 0 ? (
                          <span className="text-xs text-muted-foreground">In use</span>
                        ) : (
                          <form action={deleteFeatureAction}>
                            <input type="hidden" name="id" value={f.id} />
                            <ConfirmButton
                              variant="outline"
                              label="Delete"
                              message={`Delete feature "${f.name}"? This cannot be undone.`}
                            />
                          </form>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
