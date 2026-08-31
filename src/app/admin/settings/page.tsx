import type { Metadata } from 'next';
import { listPlans, listFeatures } from '@/services/admin';
import { CURRENCIES } from '@/constants/currencies';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = { title: 'Admin · System Settings' };

export default async function AdminSettingsPage() {
  const [plans, features] = await Promise.all([listPlans(), listFeatures()]);
  const defaultProvider = process.env.NEXT_PUBLIC_DEFAULT_PAYMENT_PROVIDER ?? 'paystack';

  const config: { label: string; value: string }[] = [
    { label: 'Application', value: process.env.NEXT_PUBLIC_APP_NAME ?? 'Tuvoria' },
    { label: 'Active plans', value: String(plans.filter((p) => p.isActive).length) },
    { label: 'Features', value: String(features.length) },
    { label: 'Default payment provider', value: defaultProvider },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
        <p className="text-sm text-muted-foreground">Platform-wide configuration overview.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Platform</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              {config.map((c) => (
                <div key={c.label} className="flex items-center justify-between">
                  <dt className="text-muted-foreground">{c.label}</dt>
                  <dd className="font-medium capitalize">{c.value}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Currencies &amp; providers</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {CURRENCIES.map((c) => (
                <li key={c.code} className="flex items-center justify-between">
                  <span>
                    {c.symbol} {c.code} — {c.label}
                  </span>
                  <Badge variant="secondary" className="capitalize">
                    {c.provider}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Plan pricing, feature entitlements and coupons are managed from their respective admin
          pages. Payment provider keys and webhooks are configured via environment variables — see
          <code className="mx-1">.env.example</code> and the deployment guide.
        </CardContent>
      </Card>
    </div>
  );
}
