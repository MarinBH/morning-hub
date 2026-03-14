import Link from "next/link";
import {
  ArrowRight, Sparkles, Search, Layers, BookOpen, MapPin,
  Youtube, Globe, Zap, Shield,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-dvh flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-5xl mx-auto w-full">
        <span className="font-display text-lg font-bold tracking-tight">Keepmark</span>
        <Link
          href="/login"
          className="btn btn-ghost btn-sm"
        >
          Sign In
        </Link>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center px-6 text-center pt-16 sm:pt-24">
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

        {/* How It Works */}
        <div className="w-full max-w-3xl mt-24 sm:mt-32">
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-text-primary mb-12">
            How it works
          </h2>
          <div className="grid gap-8 sm:grid-cols-3 text-left">
            {[
              {
                step: "1",
                title: "Paste any link",
                description: "Drop an article, YouTube video, or Google Maps place — Keepmark detects the type automatically.",
                icon: Globe,
              },
              {
                step: "2",
                title: "AI does the work",
                description: "Get structured summaries, key takeaways, action items, and auto-tags in seconds.",
                icon: Sparkles,
              },
              {
                step: "3",
                title: "Find it later",
                description: "Search across all your saved content instantly. Everything organized, nothing lost.",
                icon: Search,
              },
            ].map((item) => (
              <div key={item.step} className="relative p-5 rounded-[--radius-lg] bg-surface border border-border">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center mb-3">
                  <item.icon size={16} className="text-accent" />
                </div>
                <h3 className="font-heading text-[15px] font-semibold mb-1.5">{item.title}</h3>
                <p className="text-[13px] text-text-secondary leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="w-full max-w-3xl mt-24 sm:mt-32">
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-text-primary mb-4">
            Everything you save, enriched
          </h2>
          <p className="text-text-secondary mb-12 max-w-lg mx-auto">
            Keepmark understands your content and makes it instantly useful.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 text-left">
            {[
              {
                icon: BookOpen,
                title: "Articles & Blogs",
                description: "Auto-extracted key takeaways, core thesis, action items, and reading time. Never lose an insight again.",
              },
              {
                icon: Youtube,
                title: "YouTube Videos",
                description: "Full transcript analysis with structured summaries. Get the value of a 30-minute video in 30 seconds.",
              },
              {
                icon: MapPin,
                title: "Places & Restaurants",
                description: "Save Google Maps links with ratings, insider tips, and AI analysis of the venue's website.",
              },
              {
                icon: Zap,
                title: "Smart Auto-Tags",
                description: "Every link is automatically tagged with topics and concepts. Your collection organizes itself.",
              },
            ].map((feature) => (
              <div key={feature.title} className="p-5 rounded-[--radius-lg] bg-surface border border-border">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center mb-3">
                  <feature.icon size={16} className="text-accent" />
                </div>
                <h3 className="font-heading text-[15px] font-semibold mb-1.5">{feature.title}</h3>
                <p className="text-[13px] text-text-secondary leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Trust signals */}
        <div className="w-full max-w-3xl mt-24 sm:mt-32">
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: Shield, label: "Your data stays yours", sub: "End-to-end privacy" },
              { icon: Zap, label: "Powered by Claude AI", sub: "Anthropic's latest models" },
              { icon: Globe, label: "Works everywhere", sub: "Mobile PWA + desktop" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 p-4 rounded-[--radius-md] bg-surface/50 border border-border-subtle">
                <item.icon size={18} className="text-accent flex-shrink-0" />
                <div>
                  <div className="text-[13px] font-medium font-heading">{item.label}</div>
                  <div className="text-[11px] text-muted">{item.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="w-full max-w-xl mt-24 sm:mt-32 mb-16 sm:mb-24 text-center">
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-text-primary mb-4">
            Start saving smarter today
          </h2>
          <p className="text-text-secondary mb-8 max-w-sm mx-auto">
            Free to use. No credit card required. Save your first link in under a minute.
          </p>
          <Link
            href="/signup"
            className="btn btn-primary btn-lg gap-2"
          >
            Get Started Free
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
