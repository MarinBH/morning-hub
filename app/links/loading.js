export default function LinksLoading() {
  return (
    <div className="min-h-screen bg-bg text-text font-sans">
      <header className="sticky top-0 z-20 border-b border-border-subtle" style={{ background: "rgba(12, 11, 10, 0.85)" }}>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 skeleton rounded" />
            <div className="w-28 h-5 skeleton rounded" />
          </div>
          <div className="w-6 h-4 skeleton rounded" />
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        <div className="rounded-2xl border-2 border-dashed border-border bg-bg-drop p-5 mb-8">
          <div className="skeleton h-11 w-full rounded-xl" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-bg-card rounded-2xl border border-border p-4">
              <div className="skeleton h-5 w-3/4 mb-2" />
              <div className="skeleton h-3 w-1/3 mb-3" />
              <div className="skeleton h-3 w-full" />
              <div className="skeleton h-3 w-5/6 mt-1.5" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
