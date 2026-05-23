// Default loading skeleton for the dashboard. Server components await data,
// so this shows during the await window on slow requests (e.g., AI briefing
// cache miss).

export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-64 rounded bg-muted" />
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg border border-border bg-card" />
        ))}
      </div>
      <div className="grid xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 h-80 rounded-lg border border-border bg-card" />
        <div className="h-80 rounded-lg border border-border bg-card" />
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-64 rounded-lg border border-border bg-card" />
        <div className="h-64 rounded-lg border border-border bg-card" />
      </div>
    </div>
  );
}
