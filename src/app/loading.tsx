// App Router shows this fallback while a route segment is loading.
export default function Loading() {
  return <div role="status" aria-live="polite" className="state-panel">
    <p className="text-base font-semibold">Loading workspace</p>
    <p className="mt-2 text-sm text-muted-foreground">The next page will appear shortly.</p>
    <div aria-hidden="true" className="mt-6 space-y-4">
      <div className="loading-placeholder w-2/3" />
      <div className="loading-placeholder" />
      <div className="loading-placeholder w-5/6" />
    </div>
  </div>;
}
