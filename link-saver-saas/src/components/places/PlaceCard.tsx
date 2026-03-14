"use client";

import Link from "next/link";
import { MapPin, Clock, Star } from "lucide-react";

interface PlaceCardProps {
  id: string;
  title: string;
  summaryPreview: string | null;
  address: string | null;
  rating: number | null;
  priceLevel: string | null;
  placeType: string | null;
  thumbnail: string | null;
  tags: Array<{ name: string }>;
  createdAt: string;
}

export function PlaceCard({
  id,
  title,
  summaryPreview,
  address,
  rating,
  priceLevel,
  placeType,
  thumbnail,
  tags,
  createdAt,
}: PlaceCardProps) {
  const dateLabel = new Date(createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <Link href={`/link/${id}`} className="block">
      <div className="bg-surface rounded-[--radius-lg] border border-border overflow-hidden hover:border-accent/40 hover:shadow-lg hover:shadow-black/20 transition-all">
        {thumbnail && (
          <div className="relative">
            <img
              src={thumbnail}
              alt=""
              className="w-full h-36 object-cover"
              loading="lazy"
            />
            {placeType && (
              <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-[--radius-sm] text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/85 text-white">
                {placeType}
              </span>
            )}
          </div>
        )}
        <div className="p-3.5">
          {!thumbnail && placeType && (
            <span className="inline-block mb-1.5 text-[11px] font-medium text-muted uppercase tracking-wider">
              {placeType}
            </span>
          )}
          <h3 className="text-[15px] font-semibold leading-snug mb-2">{title}</h3>

          <div className="flex items-center gap-2 mb-2">
            {rating && (
              <span className="flex items-center gap-1 text-[13px] font-semibold text-warning">
                <Star size={13} fill="currentColor" />
                {rating}
              </span>
            )}
            {priceLevel && (
              <span className="text-[12px] text-muted">&middot; {priceLevel}</span>
            )}
          </div>

          {address && (
            <div className="flex items-start gap-1.5 mb-2 text-[13px] text-text-secondary">
              <MapPin size={14} className="text-muted flex-shrink-0 mt-0.5" />
              <span className="line-clamp-1">{address}</span>
            </div>
          )}

          {summaryPreview && (
            <p className="text-[13px] text-text-secondary leading-relaxed mb-2.5 line-clamp-2">
              {summaryPreview}
            </p>
          )}

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.slice(0, 3).map((t) => (
                <span key={t.name} className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-accent/10 text-accent">
                  {t.name}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 text-[11px] font-mono text-muted">
            <Clock size={10} />
            <span>{dateLabel}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
