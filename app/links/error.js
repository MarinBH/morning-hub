"use client";

export default function LinksError({ error, reset }) {
  return (
    <div className="min-h-screen bg-bg text-text font-sans flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-error/10 border border-error/20 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FF6B6B" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        </div>
        <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
        <p className="text-sm text-text-muted mb-6">{error?.message || "An unexpected error occurred while loading the knowledge base."}</p>
        <button
          onClick={reset}
          className="bg-accent hover:bg-accent-hover text-bg font-medium rounded-xl px-6 py-3 text-sm transition-all duration-250 active:scale-[0.96]"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
