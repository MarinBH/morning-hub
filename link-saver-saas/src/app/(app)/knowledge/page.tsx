"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, Loader2 } from "lucide-react";
import { KnowledgeCard } from "@/components/knowledge/KnowledgeCard";

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
      const res = await fetch(`/api/links?${params}`);
      const data = await res.json();
      setLinks(data.links || []);
    } catch {
      console.error("Failed to fetch links");
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
        <h1 className="text-[22px] font-bold tracking-tight">Knowledge</h1>
        <Link
          href="/save"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[--radius-md] bg-accent text-white text-[13px] font-medium hover:bg-accent-hover transition-colors"
        >
          <Plus size={14} />
          Save
        </Link>
      </div>

      <div className="flex gap-1.5 px-4 pb-3 overflow-x-auto scrollbar-none">
        {FILTER_CHIPS.map((chip) => (
          <button
            key={chip.value}
            onClick={() => setFilter(chip.value)}
            className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap border transition-colors ${
              filter === chip.value
                ? "bg-accent/10 text-accent border-accent"
                : "bg-surface text-muted border-border hover:text-text-secondary"
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <div className="px-3 pb-4 space-y-2.5">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-muted" size={24} />
          </div>
        ) : links.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted mb-2">No links saved yet</p>
            <Link href="/save" className="text-accent text-sm hover:text-accent-hover">
              Save your first link &rarr;
            </Link>
          </div>
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
