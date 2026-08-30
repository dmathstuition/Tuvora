/** Instant skeleton for admin pages while their server render completes. */
export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-28 rounded-3xl bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-32 rounded-2xl border border-border/60 bg-muted" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-64 rounded-2xl border border-border/60 bg-muted" />
        <div className="h-64 rounded-2xl border border-border/60 bg-muted" />
      </div>
    </div>
  );
}
