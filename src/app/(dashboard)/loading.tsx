/**
 * Instant skeleton shown while a dashboard page's server render (auth + data)
 * completes — so navigation feels immediate instead of frozen.
 */
export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-64 rounded-lg bg-muted" />
        <div className="h-4 w-80 rounded bg-muted/70" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 rounded-2xl border border-border/60 bg-muted" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="h-72 rounded-2xl border border-border/60 bg-muted lg:col-span-2" />
        <div className="h-72 rounded-2xl border border-border/60 bg-muted" />
      </div>
    </div>
  );
}
