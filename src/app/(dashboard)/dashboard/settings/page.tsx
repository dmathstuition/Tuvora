import type { Metadata } from 'next';
import Link from 'next/link';
import { Users } from 'lucide-react';
import { getAuthContext } from '@/lib/auth/context';
import { getOrgSettings } from '@/services/organizations/settings';
import { getOrgFeatureSettings } from '@/services/portal/features';
import { can } from '@/lib/permissions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OrgProfileForm, BrandingForm, LogoUpload } from './settings-forms';
import { StudentAppForm } from './student-app-form';
import { ChangePasswordForm } from './change-password';

export const metadata: Metadata = { title: 'Settings' };

export default async function SettingsPage() {
  const [ctx, settings, features] = await Promise.all([
    getAuthContext(),
    getOrgSettings(),
    getOrgFeatureSettings(),
  ]);
  if (!settings) return null;

  const canSettings = !!ctx && can(ctx, 'org.settings.manage');
  const canBranding = !!ctx && can(ctx, 'org.branding.manage');
  const canMembers = !!ctx && can(ctx, 'members.view');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your organization profile, branding and team.
          </p>
        </div>
        {canMembers && (
          <Button asChild variant="outline">
            <Link href="/dashboard/settings/team">
              <Users className="h-4 w-4" /> Manage team
            </Link>
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Organization profile</CardTitle>
          <CardDescription>
            Your business details and billing currency.
            {!canSettings && ' You need admin access to edit these.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrgProfileForm settings={settings} disabled={!canSettings} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Branding &amp; portal</CardTitle>
          <CardDescription>
            How your learner portal looks — name, colour and welcome message.
            {!canBranding && ' You need admin access to edit these.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <LogoUpload settings={settings} disabled={!canBranding} />
          <div className="border-t pt-6">
            <BrandingForm settings={settings} disabled={!canBranding} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Student app features</CardTitle>
          <CardDescription>
            Choose which features your learners see in their app. Turn off anything you&apos;re not
            using yet.
            {!canBranding && ' You need admin access to edit these.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StudentAppForm features={features} disabled={!canBranding} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Security</CardTitle>
          <CardDescription>Change the password you use to sign in to Tuvora.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
