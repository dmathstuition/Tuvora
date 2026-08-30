/** Instant loading state for the learner portal between page navigations. */
export default function PortalLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-indigo-50 via-fuchsia-50/50 to-amber-50/50">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
    </div>
  );
}
