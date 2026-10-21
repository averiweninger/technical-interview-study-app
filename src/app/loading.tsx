// App Router shows this fallback while a route segment is loading.
export default function Loading() {
  return <div role="status" className="py-12">
    <p className="eyebrow">INTERVIEW COMPASS</p>
    <p className="text-lg font-semibold">Opening your workspace...</p>
    <p className="mt-2 text-sm text-muted-foreground">Getting the next page ready.</p>
  </div>;
}
