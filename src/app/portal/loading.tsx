/**
 * Skeleton shown while a learner-portal page loads. Mirrors the portal shell
 * (sidebar on tablet/laptop, top bar + bottom tab bar on phones) so navigation
 * feels instant and stable instead of flashing a spinner.
 */
export default function PortalLoading() {
  const block = 'animate-pulse rounded-2xl bg-white/70';
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-indigo-50 via-fuchsia-50/50 to-amber-50/50">
      <div className="relative flex">
        {/* Sidebar skeleton (tablet / laptop) */}
        <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-white/60 bg-white/70 p-4 backdrop-blur-xl md:flex">
          <div className="mb-6 flex items-center gap-2">
            <div className="h-8 w-8 animate-pulse rounded-xl bg-slate-200" />
            <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-9 w-full animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        </aside>

        {/* Content column */}
        <div className="min-w-0 flex-1 pb-24 md:pb-0">
          {/* Top bar */}
          <header className="border-b border-white/60 bg-white/70 backdrop-blur-xl">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 md:px-8">
              <div className="h-6 w-24 animate-pulse rounded bg-slate-200 md:hidden" />
              <div className="hidden h-4 w-28 animate-pulse rounded bg-slate-200 md:block" />
              <div className="ml-auto flex items-center gap-2">
                <div className="h-10 w-10 animate-pulse rounded-xl bg-slate-200" />
                <div className="h-10 w-10 animate-pulse rounded-full bg-slate-200" />
              </div>
            </div>
          </header>

          <main className="mx-auto max-w-5xl space-y-5 px-4 py-5 md:px-8 md:py-8">
            {/* Hero banner */}
            <div className={`${block} h-40 bg-gradient-to-br from-slate-200/80 to-slate-100`} />
            {/* Row of cards */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={`${block} h-28`} />
              ))}
            </div>
            {/* List rows */}
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={`${block} h-16`} />
              ))}
            </div>
          </main>
        </div>
      </div>

      {/* Bottom tab bar skeleton (phone) */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/60 bg-white/85 backdrop-blur-xl md:hidden">
        <div className="mx-auto flex max-w-3xl items-stretch justify-between px-2 py-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1.5 py-2">
              <div className="h-5 w-5 animate-pulse rounded bg-slate-200" />
              <div className="h-2.5 w-8 animate-pulse rounded bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
