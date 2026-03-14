"use client";

import { useState, useCallback } from "react";
import { Search as SearchIcon } from "lucide-react";
import { KnowledgeCard } from "@/components/knowledge/KnowledgeCard";
import { PlaceCard } from "@/components/places/PlaceCard";
import { KnowledgeSkeleton, PlaceSkeleton } from "@/components/ui/SkeletonCard";
import { EmptyState } from "@/components/ui/EmptyState";

interface SearchResult {
  id: string;
  title: string;
  type: string;
  section: string;
  summary_preview: string | null;
  author: string | null;
  channel: string | null;
  site_name: string | null;
  thumbnail: string | null;
  reading_time: number | null;
  duration: string | null;
  address: string | null;
  rating: number | null;
  price_level: string | null;
  place_type: string | null;
  is_favorite: boolean;
  created_at: string;
  link_tags: Array<{ tags: { name: string; tag_type: string } }>;
}

const SECTION_CHIPS = [
  { label: "All", value: "" },
  { label: "Knowledge", value: "knowledge" },
  { label: "Places", value: "places" },
  { label: "Articles", value: "article" },
  { label: "Videos", value: "youtube" },
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [sectionFilter, setSectionFilter] = useState("");

  const doSearch = useCallback(async (searchQuery: string, section: string) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setSearched(true);

    const params = new URLSearchParams({ search: searchQuery.trim() });
    if (section === "knowledge" || section === "places") {
      params.set("section", section);
    } else if (section === "article" || section === "youtube") {
      params.set("type", section);
    }

    try {
      setError("");
      const res = await fetch(`/api/links?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setResults(data.links || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError((err as Error).message);
      setResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    doSearch(query, sectionFilter);
  }

  function handleFilterChange(value: string) {
    setSectionFilter(value);
    if (query.trim()) {
      doSearch(query, value);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="px-4 pt-4 pb-2">
        <form onSubmit={handleSubmit} className="relative">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" size={16} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="input pl-10"
            placeholder="Search by title, tag, or content..."
          />
        </form>
      </div>

      <div className="flex gap-1.5 px-4 pb-3 overflow-x-auto scrollbar-none">
        {SECTION_CHIPS.map((c) => (
          <button
            key={c.value}
            onClick={() => handleFilterChange(c.value)}
            className={`chip ${sectionFilter === c.value ? "chip-active" : ""}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {searched && (
        <div className="px-4 pb-2 text-[11px] text-muted font-mono">
          {loading ? "Searching..." : `${total} result${total !== 1 ? "s" : ""}`}
        </div>
      )}

      <div className="px-3 pb-4 space-y-2">
        {error ? (
          <div className="text-center py-20">
            <p className="text-error text-sm mb-2">{error}</p>
            <button onClick={() => doSearch(query, sectionFilter)} className="text-accent text-sm hover:text-accent-hover font-medium">
              Try again
            </button>
          </div>
        ) : loading ? (
          <>
            <KnowledgeSkeleton />
            <PlaceSkeleton />
            <KnowledgeSkeleton />
          </>
        ) : searched && results.length === 0 ? (
          <EmptyState
            icon={SearchIcon}
            title={`No results for "${query}"`}
            description="Try a different search term or adjust the filters above."
          />
        ) : (
          results.map((r) =>
            r.section === "places" ? (
              <PlaceCard
                key={r.id}
                id={r.id}
                title={r.title}
                summaryPreview={r.summary_preview}
                address={r.address}
                rating={r.rating}
                priceLevel={r.price_level}
                placeType={r.place_type}
                thumbnail={r.thumbnail}
                tags={r.link_tags?.map(lt => lt.tags).filter(Boolean) || []}
                createdAt={r.created_at}
              />
            ) : (
              <KnowledgeCard
                key={r.id}
                id={r.id}
                title={r.title}
                type={r.type as "article" | "youtube"}
                summaryPreview={r.summary_preview}
                author={r.author}
                channel={r.channel}
                siteName={r.site_name}
                thumbnail={r.thumbnail}
                readingTime={r.reading_time}
                duration={r.duration}
                isFavorite={r.is_favorite}
                tags={r.link_tags?.map(lt => lt.tags).filter(Boolean) || []}
                createdAt={r.created_at}
              />
            )
          )
        )}
      </div>
    </div>
  );
}
