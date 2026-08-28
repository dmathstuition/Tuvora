import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Consistent scaffold for platform-admin areas that are wired into navigation
 * but whose data views are still being built out. Keeps every nav destination a
 * polished page rather than a 404.
 */
export function AdminPlaceholder({
  title,
  description,
  icon: Icon,
  points,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  points?: string[];
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <Icon className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-base font-semibold">This area is being built out</h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              The data and controls for {title.toLowerCase()} plug in here.
            </p>
          </div>
          {points && points.length > 0 && (
            <ul className="mx-auto max-w-md space-y-1 text-left text-sm text-muted-foreground">
              {points.map((p) => (
                <li key={p} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {p}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
