"use client";

import Link from "next/link";
import { Bookmark, BookmarkCheck } from "lucide-react";

interface KnowledgeCardProps {
  id: string;
  title: string;
  type: "article" | "youtube";
  summaryPreview: string | null;
  author: string | null;
  channel: string | null;
  siteName: string | null;
  thumbnail: string | null;
  readingTime: number | null;
  duration: string | null;
  isFavorite: boolean;
  tags: Array<{ name: string }>;
  createdAt: string;
  onToggleFavorite?: (id: string) => void;
}

export function KnowledgeCard({
  id,
  title,
  type,
  summaryPreview,
  author,
  channel,
  siteName,
  thumbnail,
  readingTime,
  duration,
  isFavorite,
  tags,
  createdAt,
  onToggleFavorite,
}: KnowledgeCardProps) {
  const source = channel || author || siteName || "Unknown";
  const timeLabel = type === "youtube"
    ? duration || ""
    : readingTime ? `${readingTime} min read` : "";
  const dateLabel = new Date(createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <Link href={`/link/${id}`} className="block">
      <div className="bg-surface rounded-[--radius-lg] border border-border overflow-hidden card-hover">
        {thumbnail && type === "youtube" && (
          <div className="relative">
            <img
              src={thumbnail}
              alt={title}
              className="w-full h-40 object-cover"
              loading="lazy"
            />
            <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-[--radius-xs] text-[10px] font-semibold uppercase tracking-wider bg-red-500/90 text-white font-heading">
              Video
            </span>
            {duration && (
              <span className="absolute bottom-2.5 right-2.5 px-1.5 py-0.5 rounded-[--radius-xs] text-[11px] font-medium font-mono bg-black/70 text-white">
                {duration}
              </span>
            )}
          </div>
        )}
        <div className="p-3.5">
          <div className="flex justify-between items-start mb-1">
            <span className="section-label opacity-70">
              {type === "youtube" ? "Video" : "Article"} &middot; {timeLabel}
            </span>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleFavorite?.(id);
              }}
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              className="p-0.5 transition-colors"
            >
              {isFavorite ? (
                <BookmarkCheck size={15} className="text-accent" />
              ) : (
                <Bookmark size={15} className="text-muted hover:text-text-secondary" />
              )}
            </button>
          </div>
          <h3 className="text-[15px] font-semibold font-heading leading-snug mb-1.5 line-clamp-2">{title}</h3>
          {summaryPreview && (
            <p className="text-[13px] text-text-secondary leading-relaxed mb-2.5 line-clamp-2">
              {summaryPreview}
            </p>
          )}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {tags.slice(0, 3).map((t) => (
                <span key={t.name} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-accent/8 text-accent/80 font-heading">
                  {t.name}
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted">
            <span>{source}</span>
            <span className="opacity-30">&middot;</span>
            <span>{dateLabel}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
