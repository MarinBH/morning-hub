export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg text-text font-sans flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="text-6xl font-bold text-text-dim mb-4 font-mono">404</div>
        <h2 className="text-lg font-semibold mb-2">Page not found</h2>
        <p className="text-sm text-text-muted mb-6">The page you're looking for doesn't exist.</p>
        <a
          href="/"
          className="inline-block bg-accent hover:bg-accent-hover text-bg font-medium rounded-xl px-6 py-3 text-sm transition-all duration-250"
        >
          Go home
        </a>
      </div>
    </div>
  );
}
