"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus } from "lucide-react";
import { BookOpen } from "lucide-react";
import { KnowledgeCard } from "@/components/knowledge/KnowledgeCard";
import { KnowledgeSkeleton } from "@/components/ui/SkeletonCard";
import { EmptyState } from "@/components/ui/EmptyState";

interface LinkData {
  id: string;
  title: string;
  type: "article" | "youtube";
  summary_preview: string | null;
  author: string | null;
  channel: string | null;
  site_name: string | null;
  thumbnail: string | null;
  reading_time: number | null;
  duration: string | null;
  is_favorite: boolean;
  created_at: string;
  link_tags: Array<{ tags: { name: string } }>;
}

const FILTER_CHIPS = [
  { label: "All", value: "" },
  { label: "Articles", value: "article" },
  { label: "Videos", value: "youtube" },
  { label: "Favorites", value: "favorites" },
];

export default function KnowledgePage() {
  const [links, setLinks] = useState<LinkData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ section: "knowledge" });
    if (filter === "favorites") {
      params.set("favorite", "true");
    } else if (filter) {
      params.set("type", filter);
    }

    try {
      setError("");
      const res = await fetch(`/api/links?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load links");
      setLinks(data.links || []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  async function toggleFavorite(id: string) {
    const link = links.find(l => l.id === id);
    if (!link) return;

    const newValue = !link.is_favorite;
    setLinks(prev => prev.map(l => l.id === id ? { ...l, is_favorite: newValue } : l));

    await fetch(`/api/links/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_favorite: newValue }),
    });
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h1 className="font-heading text-xl font-bold tracking-tight">Knowledge</h1>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("open-save-modal"))}
          className="btn btn-primary btn-sm"
        >
          <Plus size={14} strokeWidth={2.5} />
          Save
        </button>
      </div>

      <div className="flex gap-1.5 px-4 pb-3 overflow-x-auto scrollbar-none">
        {FILTER_CHIPS.map((c) => (
          <button
            key={c.value}
            onClick={() => setFilter(c.value)}
            className={`chip ${filter === c.value ? "chip-active" : ""}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="px-3 pb-4 space-y-2">
        {error ? (
          <div className="text-center py-20">
            <p className="text-error text-sm mb-2">{error}</p>
            <button onClick={() => fetchLinks()} className="text-accent text-sm hover:text-accent-hover font-medium">
              Try again
            </button>
          </div>
        ) : loading ? (
          <>
            <KnowledgeSkeleton />
            <KnowledgeSkeleton />
            <KnowledgeSkeleton />
          </>
        ) : links.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Your knowledge base is empty"
            description="Save an article or YouTube video to see AI-powered summaries here."
            ctaLabel="Save your first link"
            onCtaClick={() => window.dispatchEvent(new CustomEvent("open-save-modal"))}
          />
        ) : (
          links.map((link) => (
            <KnowledgeCard
              key={link.id}
              id={link.id}
              title={link.title || "Untitled"}
              type={link.type as "article" | "youtube"}
              summaryPreview={link.summary_preview}
              author={link.author}
              channel={link.channel}
              siteName={link.site_name}
              thumbnail={link.thumbnail}
              readingTime={link.reading_time}
              duration={link.duration}
              isFavorite={link.is_favorite}
              tags={link.link_tags?.map(lt => lt.tags).filter(Boolean) || []}
              createdAt={link.created_at}
              onToggleFavorite={toggleFavorite}
            />
          ))
        )}
      </div>
    </div>
  );
}
