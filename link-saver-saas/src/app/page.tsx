import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 text-center">
      <div className="max-w-lg">
        <h1 className="text-4xl font-bold tracking-tight text-text-primary mb-4">
          Save Smarter.
          <br />
          Find Faster.
        </h1>
        <p className="text-lg text-muted mb-8 leading-relaxed">
          Save any link — articles, YouTube videos, places. Get AI-powered
          structured summaries and find anything instantly.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center px-6 py-3 rounded-[--radius-md] bg-accent text-white font-medium hover:bg-accent-hover transition-colors"
          >
            Get Started Free
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-6 py-3 rounded-[--radius-md] bg-surface text-text-primary font-medium border border-border hover:bg-surface-hover transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
