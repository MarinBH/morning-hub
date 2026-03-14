import Link from "next/link";
import { ArrowRight, Sparkles, Search, Layers } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-dvh flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto w-full">
        <span className="font-display text-lg font-bold tracking-tight">Link Saver</span>
        <Link
          href="/login"
          className="btn btn-ghost btn-sm"
        >
          Sign In
        </Link>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center pb-20">
        <div className="max-w-xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-subtle border border-accent/20 text-accent text-xs font-medium font-heading mb-6">
            <Sparkles size={12} />
            AI-Powered Link Intelligence
          </div>

          <h1 className="font-display text-[40px] sm:text-5xl font-bold tracking-tight leading-[1.1] text-text-primary mb-4">
            Save Smarter.
            <br />
            <span className="text-accent">Find Faster.</span>
          </h1>
          <p className="text-base sm:text-lg text-text-secondary mb-10 leading-relaxed max-w-md mx-auto">
            Save any link — articles, YouTube videos, places. Get structured AI
            summaries and find anything instantly.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="btn btn-primary btn-lg gap-2"
            >
              Get Started Free
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/login"
              className="btn btn-secondary btn-lg"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-3 mt-16 max-w-lg">
          {[
            { icon: Sparkles, label: "AI Summaries" },
            { icon: Search, label: "Instant Search" },
            { icon: Layers, label: "Auto-Organized" },
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-border text-sm text-text-secondary font-heading">
              <f.icon size={14} className="text-accent" />
              {f.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
