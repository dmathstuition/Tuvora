import type { Metadata } from 'next';
import { LayoutGrid } from 'lucide-react';
import { getPlatformFeatureSettings } from '@/services/portal/features';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlatformFeaturesForm } from './platform-features-form';

export const metadata: Metadata = { title: 'Admin · Learner features' };

export default async function LearnerFeaturesPage() {
  const features = await getPlatformFeatureSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <LayoutGrid className="h-6 w-6" /> Learner app features
        </h1>
        <p className="text-sm text-muted-foreground">
          Control which student-app features are available across the whole platform. Each academy
          can then choose which of the available features to switch on for their learners in their
          own settings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Global availability</CardTitle>
          <CardDescription>
            Turning a feature off here hides it everywhere, regardless of academy settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PlatformFeaturesForm features={features} />
        </CardContent>
      </Card>
    </div>
  );
}
