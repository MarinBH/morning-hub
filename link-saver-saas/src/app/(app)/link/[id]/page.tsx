"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, ExternalLink, Bookmark, BookmarkCheck,
  Trash2, MapPin, Star, Phone, Globe, Loader2, X, Plus,
} from "lucide-react";
import { DetailSkeleton } from "@/components/ui/SkeletonCard";
import { useToast } from "@/components/ui/Toast";

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
  link_tags: Array<{ tag_id: string; tags: { id: string; name: string; tag_type: string } }>;
  link_goals: Array<{ goal: string; relevance: string }>;
}

export default function LinkDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [link, setLink] = useState<LinkDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState("");
  const [editingNotes, setEditingNotes] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [addingTag, setAddingTag] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const [allTags, setAllTags] = useState<Array<{ id: string; name: string }>>([]);

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
    toast(newValue ? "Added to favorites" : "Removed from favorites");
  }

  async function saveNotes() {
    await fetch(`/api/links/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ personal_notes: notes }),
    });
    setEditingNotes(false);
    toast("Notes saved");
  }

  async function deleteLink() {
    if (!confirm("Delete this link?")) return;
    await fetch(`/api/links/${id}`, { method: "DELETE" });
    toast("Link deleted");
    router.push(link?.section === "places" ? "/places" : "/knowledge");
  }

  async function fetchUserTags() {
    const res = await fetch("/api/tags");
    if (res.ok) {
      const data = await res.json();
      setAllTags(data);
    }
  }

  async function addTag() {
    if (!newTag.trim() || addingTag) return;
    setAddingTag(true);
    try {
      const res = await fetch(`/api/links/${id}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTag.trim() }),
      });
      if (res.ok) {
        const tag = await res.json();
        setLink(prev => prev ? {
          ...prev,
          link_tags: [...prev.link_tags, { tag_id: tag.id, tags: tag }],
        } : prev);
        setNewTag("");
        toast(`Tag "${tag.name}" added`);
      }
    } finally {
      setAddingTag(false);
    }
  }

  async function removeTag(tagId: string, tagName: string) {
    await fetch(`/api/links/${id}/tags?tagId=${tagId}`, { method: "DELETE" });
    setLink(prev => prev ? {
      ...prev,
      link_tags: prev.link_tags.filter(lt => lt.tag_id !== tagId),
    } : prev);
    toast(`Tag "${tagName}" removed`);
  }

  if (loading) {
    return <DetailSkeleton />;
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
      <div className="flex items-center justify-between px-4 py-3 sticky top-0 z-10 bg-bg/80 glass">
        <button onClick={() => router.back()} aria-label="Go back" className="btn btn-ghost p-1.5">
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-1">
          <button onClick={toggleFavorite} aria-label={link.is_favorite ? "Remove from favorites" : "Add to favorites"} className="btn btn-ghost p-1.5">
            {link.is_favorite ? (
              <BookmarkCheck size={18} className="text-accent" />
            ) : (
              <Bookmark size={18} className="text-muted" />
            )}
          </button>
          <a href={link.url} target="_blank" rel="noopener noreferrer" aria-label="Open original link" className="btn btn-ghost p-1.5 text-muted hover:text-text-primary">
            <ExternalLink size={18} />
          </a>
          <button onClick={deleteLink} aria-label="Delete link" className="btn btn-ghost p-1.5 text-muted hover:text-error">
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Thumbnail */}
      {link.thumbnail && (
        <div className="relative">
          <img src={link.thumbnail} alt={link.title} className="w-full h-48 object-cover" />
          {link.type === "youtube" && (
            <>
              <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-[--radius-xs] text-[10px] font-semibold uppercase bg-red-500/90 text-white font-heading">Video</span>
              {link.duration && <span className="absolute bottom-2.5 right-2.5 px-1.5 py-0.5 rounded-[--radius-xs] text-[11px] font-medium font-mono bg-black/70 text-white">{link.duration}</span>}
            </>
          )}
          {isPlace && link.place_type && (
            <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-[--radius-xs] text-[10px] font-semibold uppercase bg-emerald-500/90 text-white font-heading">{link.place_type}</span>
          )}
        </div>
      )}

      {/* Title & Meta */}
      <div className="px-4 pt-4">
        <p className="section-label opacity-70 mb-1.5">
          {isPlace ? (
            <>{link.place_type || "Place"} &middot; {link.address?.split(",")[1]?.trim() || ""}</>
          ) : (
            <>{source} &middot; {link.duration || (link.reading_time ? `${link.reading_time} min` : "")} &middot; {new Date(link.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</>
          )}
        </p>
        <h1 className="font-heading text-xl font-bold tracking-tight leading-snug mb-3">{link.title}</h1>

        {/* Place-specific: rating, address, phone */}
        {isPlace && (
          <div className="space-y-2 mb-4">
            {link.rating && (
              <div className="flex items-center gap-2">
                <Star size={14} fill="currentColor" className="text-warning" />
                <span className="text-sm font-semibold text-warning">{link.rating}</span>
                {link.price_level && <span className="text-xs text-muted">&middot; {link.price_level}</span>}
              </div>
            )}
            {link.address && (
              <div className="flex items-start gap-2 text-sm text-text-secondary">
                <MapPin size={13} className="text-muted mt-0.5 flex-shrink-0" />
                {link.address}
              </div>
            )}
            {link.phone && (
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <Phone size={13} className="text-muted" />
                {link.phone}
              </div>
            )}
            {link.website_url && (
              <a href={link.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-accent hover:text-accent-hover">
                <Globe size={13} />
                {new URL(link.website_url).hostname}
              </a>
            )}
          </div>
        )}

        {/* Tags (editable) */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {tags.map(t => (
            <span key={t.name} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-accent/8 text-accent/80 font-heading group">
              {t.name}
              <button
                onClick={() => {
                  const lt = link.link_tags.find(lt => lt.tags?.name === t.name);
                  if (lt) removeTag(lt.tag_id, t.name);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={`Remove tag ${t.name}`}
              >
                <X size={10} />
              </button>
            </span>
          ))}
          {showTagInput ? (
            <form
              onSubmit={(e) => { e.preventDefault(); addTag(); }}
              className="inline-flex items-center gap-1"
            >
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onFocus={fetchUserTags}
                onBlur={() => { if (!newTag.trim()) setTimeout(() => setShowTagInput(false), 200); }}
                className="w-24 px-2 py-0.5 rounded-full text-[11px] bg-surface border border-border focus:border-accent/40 outline-none font-heading"
                placeholder="Add tag..."
                autoFocus
                list="tag-suggestions"
              />
              <datalist id="tag-suggestions">
                {allTags
                  .filter(t => !tags.some(existing => existing.name === t.name))
                  .map(t => <option key={t.id} value={t.name} />)
                }
              </datalist>
            </form>
          ) : (
            <button
              onClick={() => setShowTagInput(true)}
              className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium border border-dashed border-border text-muted hover:border-accent/30 hover:text-accent/60 font-heading transition-colors"
            >
              <Plus size={10} />
              Add tag
            </button>
          )}
        </div>

        {/* Author description */}
        {summary?.author_description && (
          <p className="text-[13px] text-muted mb-4 italic leading-relaxed">
            {summary.author_description}
          </p>
        )}
      </div>

      {/* Processing state */}
      {link.status === "processing" && (
        <div className="px-4 py-8 text-center">
          <Loader2 className="animate-spin text-accent mx-auto mb-2" size={22} />
          <p className="text-sm text-muted">AI summary is being generated...</p>
        </div>
      )}

      {/* AI Summary sections */}
      {summary && link.status === "complete" && (
        <>
          {/* TLDR */}
          {summary.tldr && (
            <div className="px-4 mb-5">
              <h2 className="section-label mb-2">TLDR</h2>
              <div className="p-3 rounded-[--radius-md] bg-accent/6 border-l-[3px] border-accent text-[14px] font-medium leading-relaxed">
                {summary.tldr}
              </div>
            </div>
          )}

          {/* Key Takeaways */}
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

          {/* Key Highlights (places) */}
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

          {/* Actions */}
          {(summary.actions)?.length ? (
            <div className="px-4 mb-5">
              <h2 className="section-label mb-2">Actions</h2>
              <div className="space-y-1.5">
                {(summary.actions).map((a: { action: string; rationale: string }, i: number) => (
                  <div key={i} className="p-3 bg-surface rounded-[--radius-md] border-l-[3px] border-success">
                    <div className="text-[13px] font-semibold font-heading mb-0.5">{a.action}</div>
                    <div className="text-[12px] text-muted leading-snug">{a.rationale}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Insider Tips (places) */}
          {(summary.insider_tips)?.length ? (
            <div className="px-4 mb-5">
              <h2 className="section-label mb-2">Insider Tips</h2>
              <div className="space-y-1.5">
                {(summary.insider_tips).map((tip: string, i: number) => (
                  <div key={i} className="p-3 bg-surface rounded-[--radius-md] border-l-[3px] border-success text-[13px] text-text-secondary">
                    {tip}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Core Thesis */}
          {summary.core_thesis && (
            <div className="px-4 mb-5">
              <h2 className="section-label mb-2">Core Thesis</h2>
              <p className="text-[13px] text-text-secondary leading-relaxed">{summary.core_thesis}</p>
            </div>
          )}

          {/* Concepts */}
          {conceptTags.length > 0 && (
            <div className="px-4 mb-5">
              <h2 className="section-label mb-2">Concepts</h2>
              <div className="flex flex-wrap gap-1.5">
                {conceptTags.map(c => (
                  <span key={c.name} className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-surface text-muted border border-border font-heading">
                    {c.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Best For (places) */}
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

          {/* Goals */}
          {link.link_goals?.length > 0 && (
            <div className="px-4 mb-5">
              <h2 className="section-label mb-2">Goals</h2>
              <div className="space-y-1.5">
                {link.link_goals.map((g: { goal: string; relevance: string }, i: number) => (
                  <div key={i} className="p-3 bg-surface rounded-[--radius-md] text-[13px]">
                    <span className="font-medium font-heading">{g.goal}</span>
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
            className="btn btn-primary btn-sm flex-1"
          >
            <MapPin size={14} /> Open in Maps
          </a>
          {link.website_url && (
            <a
              href={link.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm flex-1"
            >
              <Globe size={14} /> Visit Website
            </a>
          )}
        </div>
      )}

      {/* Personal Notes */}
      <div className="px-4 mb-5">
        <h2 className="section-label mb-2">Your Notes</h2>
        {editingNotes ? (
          <div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input resize-y min-h-[80px] text-[13px]"
              placeholder="Add a personal note..."
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <button onClick={saveNotes} className="btn btn-primary btn-sm text-xs">Save</button>
              <button onClick={() => { setEditingNotes(false); setNotes(link.personal_notes || ""); }} className="btn btn-secondary btn-sm text-xs">Cancel</button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setEditingNotes(true)}
            className="w-full p-3 rounded-[--radius-md] bg-surface border border-dashed border-border text-muted text-[13px] text-center hover:border-accent/30 transition-colors"
          >
            {notes || "Tap to add a personal note..."}
          </button>
        )}
      </div>
    </div>
  );
}
