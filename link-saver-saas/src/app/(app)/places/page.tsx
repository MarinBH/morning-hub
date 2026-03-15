"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, MapPin, ChevronDown } from "lucide-react";
import { PlaceCard } from "@/components/places/PlaceCard";
import { PlaceSkeleton } from "@/components/ui/SkeletonCard";
import { EmptyState } from "@/components/ui/EmptyState";

interface PlaceData {
  id: string;
  title: string;
  summary_preview: string | null;
  address: string | null;
  rating: number | null;
  price_level: string | null;
  place_type: string | null;
  thumbnail: string | null;
  created_at: string;
  link_tags: Array<{ tags: { name: string } }>;
}

const FILTER_CHIPS = [
  { label: "All", value: "" },
  { label: "Restaurants", value: "restaurant" },
  { label: "Hotels", value: "hotel" },
  { label: "Attractions", value: "attraction" },
];

const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Oldest", value: "oldest" },
  { label: "A-Z", value: "title" },
];

export default function PlacesPage() {
  const [places, setPlaces] = useState<PlaceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchPlaces = useCallback(async (pageNum: number, append = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    const params = new URLSearchParams({ section: "places", page: String(pageNum), limit: "20", sort });
    if (filter) {
      params.set("place_type", filter);
    }

    try {
      setError("");
      const res = await fetch(`/api/links?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load places");
      setPlaces(prev => append ? [...prev, ...(data.links || [])] : (data.links || []));
      setHasMore(data.hasMore || false);
      setPage(pageNum);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filter, sort]);

  useEffect(() => {
    fetchPlaces(1);
  }, [fetchPlaces]);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h1 className="font-heading text-xl font-bold tracking-tight">Places</h1>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("open-save-modal"))}
          className="btn btn-primary btn-sm"
        >
          <Plus size={14} strokeWidth={2.5} />
          Save
        </button>
      </div>

      <div className="flex items-center gap-2 px-4 pb-3">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none flex-1">
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
        <div className="relative flex-shrink-0">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="appearance-none bg-transparent border border-border rounded-full pl-3 pr-7 py-1 text-[12px] font-heading text-muted cursor-pointer focus:outline-none focus:border-accent/40"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
        </div>
      </div>

      <div className="px-3 pb-4 space-y-2">
        {error ? (
          <div className="text-center py-20">
            <p className="text-error text-sm mb-2">{error}</p>
            <button onClick={() => fetchPlaces(1)} className="text-accent text-sm hover:text-accent-hover font-medium">
              Try again
            </button>
          </div>
        ) : loading ? (
          <>
            <PlaceSkeleton />
            <PlaceSkeleton />
            <PlaceSkeleton />
          </>
        ) : places.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="No places saved yet"
            description="Drop a Google Maps link to save restaurants, hotels, and attractions with AI insights."
            ctaLabel="Save a place"
            onCtaClick={() => window.dispatchEvent(new CustomEvent("open-save-modal"))}
          />
        ) : (
          <>
            {places.map((place) => (
              <PlaceCard
                key={place.id}
                id={place.id}
                title={place.title || "Unknown Place"}
                summaryPreview={place.summary_preview}
                address={place.address}
                rating={place.rating}
                priceLevel={place.price_level}
                placeType={place.place_type}
                thumbnail={place.thumbnail}
                tags={place.link_tags?.map(lt => lt.tags).filter(Boolean) || []}
                createdAt={place.created_at}
              />
            ))}
            {hasMore && (
              <button
                onClick={() => fetchPlaces(page + 1, true)}
                disabled={loadingMore}
                className="btn btn-secondary btn-sm w-full mt-2 disabled:opacity-50"
              >
                {loadingMore ? "Loading..." : "Load more"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
