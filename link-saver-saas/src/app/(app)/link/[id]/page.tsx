"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, ExternalLink, Bookmark, BookmarkCheck,
  Trash2, MapPin, Clock, Star, Phone, Globe, Loader2,
} from "lucide-react";

interface LinkDetail {
  id: string;
  url: string;
  type: string;
  section: string;
  status: string;
  title: string;
  thumbnail: string | null;
  author: string | null;
  channel: string | null;
  site_name: string | null;
  reading_time: number | null;
  duration: string | null;
  address: string | null;
  rating: number | null;
  price_level: string | null;
  phone: string | null;
  place_type: string | null;
  website_url: string | null;
  summary_preview: string | null;
  ai_summary: Record<string, unknown> | null;
  personal_notes: string | null;
  is_favorite: boolean;
  created_at: string;
  link_tags: Array<{ tags: { name: string; tag_type: string } }>;
  link_goals: Array<{ goal: string; relevance: string }>;
}

export default function LinkDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [link, setLink] = useState<LinkDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [editingNotes, setEditingNotes] = useState(false);

  useEffect(() => {
    async function fetchLink() {
      try {
        const res = await fetch(`/api/links/${id}`);
        if (!res.ok) throw new Error("Not found");
        const data = await res.json();
        setLink(data);
        setNotes(data.personal_notes || "");
      } catch {
        router.push("/knowledge");
      } finally {
        setLoading(false);
      }
    }
    fetchLink();
  }, [id, router]);

  async function toggleFavorite() {
    if (!link) return;
    const newValue = !link.is_favorite;
    setLink({ ...link, is_favorite: newValue });
    await fetch(`/api/links/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_favorite: newValue }),
    });
  }

  async function saveNotes() {
    await fetch(`/api/links/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personal_notes: notes }),
    });
    setEditingNotes(false);
  }

  async function deleteLink() {
    if (!confirm("Delete this link?")) return;
    await fetch(`/api/links/${id}`, { method: "DELETE" });
    router.push(link?.section === "places" ? "/places" : "/knowledge");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-muted" size={24} />
      </div>
    );
  }

  if (!link) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const summary = link.ai_summary as any;
  const tags = link.link_tags?.map(lt => lt.tags).filter(Boolean) || [];
  const topicTags = tags.filter(t => t.tag_type === "topic");
  const conceptTags = tags.filter(t => t.tag_type === "concept");
  const source = link.channel || link.author || link.site_name || "";
  const isPlace = link.section === "places";

  return (
    <div className="max-w-2xl mx-auto pb-8">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 sticky top-0 z-10 bg-bg/80 backdrop-blur-lg">
        <button onClick={() => router.back()} className="p-1 text-muted hover:text-text-primary">
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <button onClick={toggleFavorite} className="p-1.5">
            {link.is_favorite ? (
              <BookmarkCheck size={20} className="text-accent" />
            ) : (
              <Bookmark size={20} className="text-muted" />
            )}
          </button>
          <a href={link.url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-muted hover:text-text-primary">
            <ExternalLink size={20} />
          </a>
          <button onClick={deleteLink} className="p-1.5 text-muted hover:text-error">
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      {/* Thumbnail */}
      {link.thumbnail && (
        <div className="relative">
          <img src={link.thumbnail} alt="" className="w-full h-48 object-cover" />
          {link.type === "youtube" && (
            <>
              <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-[--radius-sm] text-[10px] font-semibold uppercase bg-red-500/85 text-white">Video</span>
              {link.duration && <span className="absolute bottom-2.5 right-2.5 px-1.5 py-0.5 rounded text-[11px] font-semibold font-mono bg-black/75 text-white">{link.duration}</span>}
            </>
          )}
          {isPlace && link.place_type && (
            <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-[--radius-sm] text-[10px] font-semibold uppercase bg-emerald-500/85 text-white">{link.place_type}</span>
          )}
        </div>
      )}

      {/* Title & Meta */}
      <div className="px-4 pt-4">
        <p className="text-[11px] font-medium text-muted uppercase tracking-wider mb-1.5">
          {isPlace ? (
            <>{link.place_type || "Place"} &middot; {link.address?.split(",")[1]?.trim() || ""}</>
          ) : (
            <>{source} &middot; {link.duration || (link.reading_time ? `${link.reading_time} min` : "")} &middot; {new Date(link.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</>
          )}
        </p>
        <h1 className="text-xl font-bold tracking-tight leading-snug mb-3">{link.title}</h1>

        {/* Place-specific: rating, address, phone */}
        {isPlace && (
          <div className="space-y-2 mb-4">
            {link.rating && (
              <div className="flex items-center gap-2">
                <Star size={16} fill="currentColor" className="text-warning" />
                <span className="text-base font-semibold text-warning">{link.rating}</span>
                {link.price_level && <span className="text-sm text-muted">&middot; {link.price_level}</span>}
              </div>
            )}
            {link.address && (
              <div className="flex items-start gap-2 text-sm text-text-secondary">
                <MapPin size={14} className="text-muted mt-0.5 flex-shrink-0" />
                {link.address}
              </div>
            )}
            {link.phone && (
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Phone size={14} className="text-muted" />
                {link.phone}
              </div>
            )}
            {link.website_url && (
              <a href={link.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-accent">
                <Globe size={14} />
                {new URL(link.website_url).hostname}
              </a>
            )}
          </div>
        )}

        {/* Tags */}
        {topicTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {topicTags.map(t => (
              <span key={t.name} className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-accent/10 text-accent">
                {t.name}
              </span>
            ))}
          </div>
        )}

        {/* Author description */}
        {summary?.author_description && (
          <p className="text-[13px] text-muted mb-4 italic">
            {summary.author_description}
          </p>
        )}
      </div>

      {/* Processing state */}
      {link.status === "processing" && (
        <div className="px-4 py-8 text-center">
          <Loader2 className="animate-spin text-accent mx-auto mb-2" size={24} />
          <p className="text-sm text-muted">AI summary is being generated...</p>
        </div>
      )}

      {/* AI Summary sections */}
      {summary && link.status === "complete" && (
        <>
          {/* TLDR */}
          {summary.tldr && (
            <div className="px-4 mb-5">
              <h2 className="text-[12px] font-semibold text-accent uppercase tracking-wider mb-2">TLDR</h2>
              <div className="p-3 rounded-[--radius-md] bg-accent/8 border-l-3 border-accent text-[15px] font-medium leading-relaxed">
                {summary.tldr}
              </div>
            </div>
          )}

          {/* Key Takeaways */}
          {(summary.key_takeaways)?.length ? (
            <div className="px-4 mb-5">
              <h2 className="text-[12px] font-semibold text-accent uppercase tracking-wider mb-2">Key Takeaways</h2>
              <ul className="space-y-0">
                {(summary.key_takeaways).map((t: string, i: number) => (
                  <li key={i} className="py-2 pl-5 relative text-[14px] text-text-secondary leading-relaxed border-b border-border last:border-0">
                    <span className="absolute left-0 top-3.5 w-2 h-2 rounded-full bg-accent/50" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Key Highlights (places) */}
          {(summary.key_highlights)?.length ? (
            <div className="px-4 mb-5">
              <h2 className="text-[12px] font-semibold text-accent uppercase tracking-wider mb-2">Key Highlights</h2>
              <ul className="space-y-0">
                {(summary.key_highlights).map((h: string, i: number) => (
                  <li key={i} className="py-2 pl-5 relative text-[14px] text-text-secondary leading-relaxed border-b border-border last:border-0">
                    <span className="absolute left-0 top-3.5 w-2 h-2 rounded-full bg-accent/50" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Actions */}
          {(summary.actions)?.length ? (
            <div className="px-4 mb-5">
              <h2 className="text-[12px] font-semibold text-accent uppercase tracking-wider mb-2">Actions</h2>
              <div className="space-y-2">
                {(summary.actions).map((a: { action: string; rationale: string }, i: number) => (
                  <div key={i} className="p-3 bg-surface rounded-[--radius-md] border-l-3 border-success">
                    <div className="text-[13px] font-semibold mb-0.5">{a.action}</div>
                    <div className="text-[12px] text-muted leading-snug">{a.rationale}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Insider Tips (places) */}
          {(summary.insider_tips)?.length ? (
            <div className="px-4 mb-5">
              <h2 className="text-[12px] font-semibold text-accent uppercase tracking-wider mb-2">Insider Tips</h2>
              <div className="space-y-2">
                {(summary.insider_tips).map((tip: string, i: number) => (
                  <div key={i} className="p-3 bg-surface rounded-[--radius-md] border-l-3 border-success text-[13px] text-text-secondary">
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Core Thesis */}
          {summary.core_thesis && (
            <div className="px-4 mb-5">
              <h2 className="text-[12px] font-semibold text-accent uppercase tracking-wider mb-2">Core Thesis</h2>
              <p className="text-[14px] text-text-secondary leading-relaxed">{summary.core_thesis}</p>
            </div>
          )}

          {/* Concepts */}
          {conceptTags.length > 0 && (
            <div className="px-4 mb-5">
              <h2 className="text-[12px] font-semibold text-accent uppercase tracking-wider mb-2">Concepts</h2>
              <div className="flex flex-wrap gap-1.5">
                {conceptTags.map(c => (
                  <span key={c.name} className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-surface text-muted border border-border">
                    {c.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Best For (places) */}
          {(summary.best_for)?.length ? (
            <div className="px-4 mb-5">
              <h2 className="text-[12px] font-semibold text-accent uppercase tracking-wider mb-2">Best For</h2>
              <div className="flex flex-wrap gap-1.5">
                {(summary.best_for).map((b: string) => (
                  <span key={b} className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-surface text-muted border border-border">
                    {b}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {/* Goals */}
          {link.link_goals?.length > 0 && (
            <div className="px-4 mb-5">
              <h2 className="text-[12px] font-semibold text-accent uppercase tracking-wider mb-2">Goals</h2>
              <div className="space-y-2">
                {link.link_goals.map((g: { goal: string; relevance: string }, i: number) => (
                  <div key={i} className="p-3 bg-surface rounded-[--radius-md] text-[13px]">
                    <span className="font-medium">{g.goal}</span>
                    <span className="text-muted"> — {g.relevance}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Place action buttons */}
      {isPlace && (
        <div className="px-4 mb-5 flex gap-2">
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[--radius-md] bg-accent text-white text-sm font-medium"
          >
            <MapPin size={16} /> Open in Maps
          </a>
          {link.website_url && (
            <a
              href={link.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[--radius-md] bg-surface border border-border text-text-primary text-sm font-medium"
            >
              <Globe size={16} /> Visit Website
            </a>
          )}
        </div>
      )}

      {/* Personal Notes */}
      <div className="px-4 mb-5">
        <h2 className="text-[12px] font-semibold text-accent uppercase tracking-wider mb-2">Your Notes</h2>
        {editingNotes ? (
          <div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 rounded-[--radius-md] bg-surface border border-border text-text-primary text-[13px] outline-none focus:border-accent resize-y min-h-[80px]"
              placeholder="Add a personal note..."
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <button onClick={saveNotes} className="px-3 py-1.5 rounded-[--radius-sm] bg-accent text-white text-xs font-medium">Save</button>
              <button onClick={() => { setEditingNotes(false); setNotes(link.personal_notes || ""); }} className="px-3 py-1.5 rounded-[--radius-sm] bg-surface text-muted text-xs font-medium border border-border">Cancel</button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setEditingNotes(true)}
            className="w-full p-3 rounded-[--radius-md] bg-surface border border-dashed border-border text-muted text-[13px] text-center hover:border-accent/40 transition-colors"
          >
            {notes || "Tap to add a personal note..."}
          </button>
        )}
      </div>
    </div>
  );
}
