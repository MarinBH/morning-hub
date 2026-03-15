"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BookOpen, Youtube, MapPin, Star, ExternalLink } from "lucide-react";

interface SharedLink {
  title: string;
  type: string;
  section: string;
  thumbnail: string | null;
  author: string | null;
  channel: string | null;
  site_name: string | null;
  reading_time: number | null;
  duration: string | null;
  place_type: string | null;
  rating: number | null;
  address: string | null;
  summary_preview: string | null;
  ai_summary: Record<string, unknown> | null;
  tags: string[];
}

export default function SharedLinkPage() {
  const { id } = useParams();
  const [link, setLink] = useState<SharedLink | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/shared/${id}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setLink(data);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-dvh bg-bg flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  if (error || !link) {
    return (
      <div className="min-h-dvh bg-bg flex flex-col items-center justify-center px-4 text-center">
        <h1 className="font-display text-xl font-bold mb-2">Link not found</h1>
        <p className="text-sm text-muted mb-6">This link may have been removed or is not publicly shared.</p>
        <a href="/" className="btn btn-primary btn-sm">Try Keepmark</a>
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const summary = link.ai_summary as any;
  const source = link.channel || link.author || link.site_name || "";
  const isPlace = link.section === "places";

  return (
    <div className="min-h-dvh bg-bg">
      {/* Top bar */}
      <div className="border-b border-border-subtle px-4 py-3 flex items-center justify-between">
        <span className="font-display text-[15px] font-bold tracking-tight text-text-primary">Keepmark</span>
        <a href="/" className="btn btn-primary btn-sm text-xs">
          Save your own links
        </a>
      </div>

      <div className="max-w-2xl mx-auto pb-12">
        {/* Thumbnail */}
        {link.thumbnail && (
          <img src={link.thumbnail} alt={link.title} className="w-full h-48 object-cover" />
        )}

        {/* Title & Meta */}
        <div className="px-4 pt-5">
          <div className="flex items-center gap-2 mb-2">
            {isPlace ? (
              <MapPin size={14} className="text-emerald-400" />
            ) : link.type === "youtube" ? (
              <Youtube size={14} className="text-red-400" />
            ) : (
              <BookOpen size={14} className="text-accent" />
            )}
            <span className="text-[11px] text-muted font-heading uppercase tracking-wide">
              {isPlace ? link.place_type || "Place" : link.type === "youtube" ? "Video" : "Article"}
              {source ? ` · ${source}` : ""}
            </span>
          </div>

          <h1 className="font-heading text-xl font-bold tracking-tight leading-snug mb-3">{link.title}</h1>

          {/* Place meta */}
          {isPlace && link.rating && (
            <div className="flex items-center gap-2 mb-3">
              <Star size={14} fill="currentColor" className="text-warning" />
              <span className="text-sm font-semibold text-warning">{link.rating}</span>
              {link.address && <span className="text-xs text-muted">· {link.address}</span>}
            </div>
          )}

          {/* Tags */}
          {link.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {link.tags.map(t => (
                <span key={t} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-accent/8 text-accent/80 font-heading">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* AI Summary */}
        {summary && (
          <>
            {summary.tldr && (
              <div className="px-4 mb-5">
                <h2 className="section-label mb-2">TLDR</h2>
                <div className="p-3 rounded-[--radius-md] bg-accent/6 border-l-[3px] border-accent text-[14px] font-medium leading-relaxed">
                  {summary.tldr}
                </div>
              </div>
            )}

            {(summary.key_takeaways)?.length ? (
              <div className="px-4 mb-5">
                <h2 className="section-label mb-2">Key Takeaways</h2>
                <ul className="space-y-0">
                  {(summary.key_takeaways).map((t: string, i: number) => (
                    <li key={i} className="py-2 pl-4 relative text-[13px] text-text-secondary leading-relaxed border-b border-border-subtle last:border-0">
                      <span className="absolute left-0 top-3.5 w-1.5 h-1.5 rounded-full bg-accent/40" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {(summary.key_highlights)?.length ? (
              <div className="px-4 mb-5">
                <h2 className="section-label mb-2">Key Highlights</h2>
                <ul className="space-y-0">
                  {(summary.key_highlights).map((h: string, i: number) => (
                    <li key={i} className="py-2 pl-4 relative text-[13px] text-text-secondary leading-relaxed border-b border-border-subtle last:border-0">
                      <span className="absolute left-0 top-3.5 w-1.5 h-1.5 rounded-full bg-accent/40" />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {(summary.best_for)?.length ? (
              <div className="px-4 mb-5">
                <h2 className="section-label mb-2">Best For</h2>
                <div className="flex flex-wrap gap-1.5">
                  {(summary.best_for).map((b: string) => (
                    <span key={b} className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-surface text-muted border border-border font-heading">
                      {b}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        )}

        {/* CTA */}
        <div className="px-4 mt-8">
          <div className="p-5 rounded-[--radius-lg] bg-surface border border-border text-center">
            <p className="font-heading text-sm font-semibold mb-1">AI-powered summaries for every link you save</p>
            <p className="text-[12px] text-muted mb-4">Keepmark saves articles, videos, and places with smart summaries.</p>
            <a href="/" className="btn btn-primary btn-sm">
              Get started free
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
