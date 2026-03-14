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
      <div className="bg-surface rounded-[--radius-lg] border border-border overflow-hidden hover:border-accent/40 hover:shadow-lg hover:shadow-black/20 transition-all">
        {thumbnail && type === "youtube" && (
          <div className="relative">
            <img
              src={thumbnail}
              alt=""
              className="w-full h-40 object-cover"
              loading="lazy"
            />
            <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-[--radius-sm] text-[10px] font-semibold uppercase tracking-wider bg-red-500/85 text-white">
              Video
            </span>
            {duration && (
              <span className="absolute bottom-2.5 right-2.5 px-1.5 py-0.5 rounded text-[11px] font-semibold font-mono bg-black/75 text-white">
                {duration}
              </span>
            )}
          </div>
        )}
        <div className="p-3.5">
          <div className="flex justify-between items-start mb-1">
            <span className="text-[11px] font-medium text-muted uppercase tracking-wider">
              {type === "youtube" ? "Video" : "Article"} &middot; {timeLabel}
            </span>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleFavorite?.(id);
              }}
              className="p-0.5"
            >
              {isFavorite ? (
                <BookmarkCheck size={16} className="text-accent" />
              ) : (
                <Bookmark size={16} className="text-muted hover:text-text-secondary" />
              )}
            </button>
          </div>
          <h3 className="text-[15px] font-semibold leading-snug mb-1.5 line-clamp-2">{title}</h3>
          {summaryPreview && (
            <p className="text-[13px] text-text-secondary leading-relaxed mb-2.5 line-clamp-2">
              {summaryPreview}
            </p>
          )}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {tags.slice(0, 3).map((t) => (
                <span key={t.name} className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-accent/10 text-accent">
                  {t.name}
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2 text-[11px] font-mono text-muted">
            <span>{source}</span>
            <span className="opacity-40">&middot;</span>
            <span>{dateLabel}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
