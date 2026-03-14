"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, Loader2 } from "lucide-react";
import { PlaceCard } from "@/components/places/PlaceCard";

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

export default function PlacesPage() {
  const [places, setPlaces] = useState<PlaceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");

  const fetchPlaces = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ section: "places" });

    try {
      setError("");
      const res = await fetch(`/api/links?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load places");
      let items = data.links || [];

      if (filter) {
        items = items.filter((p: PlaceData) =>
          p.place_type?.toLowerCase() === filter
        );
      }

      setPlaces(items);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchPlaces();
  }, [fetchPlaces]);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h1 className="font-heading text-xl font-bold tracking-tight">Places</h1>
        <Link href="/save" className="btn btn-primary btn-sm">
          <Plus size={14} strokeWidth={2.5} />
          Save
        </Link>
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
            <button onClick={() => fetchPlaces()} className="text-accent text-sm hover:text-accent-hover font-medium">
              Try again
            </button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-muted" size={22} />
          </div>
        ) : places.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted mb-2 text-sm">No places saved yet</p>
            <Link href="/save" className="text-accent text-sm hover:text-accent-hover font-medium">
              Save a Google Maps link &rarr;
            </Link>
          </div>
        ) : (
          places.map((place) => (
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
          ))
        )}
      </div>
    </div>
  );
}
