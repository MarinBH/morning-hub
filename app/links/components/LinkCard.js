"use client";

import { memo } from "react";
import { formatDate } from "./constants";

function LinkCard({ item, onClick, index, isHero }) {
  const isYoutube = item.type === "youtube";
  const categories = item.categories || [];
  const topics = (item.topics_list || []).filter(t => t.topic_type === "topic").slice(0, 3);
  const goals = (item.goals_list || []).slice(0, 2);
  const allTags = [...categories.slice(0, 2), ...topics, ...goals];
  const visibleTags = allTags.slice(0, 3);
  const overflowCount = allTags.length - visibleTags.length;

  return (
    <button
      onClick={onClick}
      className="w-full text-left group"
      style={{ animation: `scaleIn 0.35s ease ${Math.min(index, 10) * 0.06}s both` }}
    >
      <div className={`bg-bg-card hover:bg-bg-card-hover rounded-2xl overflow-hidden border border-border hover:border-border-focus transition-all duration-300 hover:translate-y-[-1px] ${
        isHero ? "ring-1 ring-accent/8" : ""
      }`}
      style={{ transitionProperty: "background-color, border-color, transform, box-shadow" }}
      >
        {isYoutube && item.thumbnail && (
          <div className="relative aspect-video overflow-hidden">
            <img src={item.thumbnail} alt={item.title || "Video thumbnail"} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
            <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/60 to-transparent" />
            <span className="absolute bottom-2 left-3 text-[10px] bg-youtube/90 text-white px-1.5 py-0.5 rounded-md font-semibold uppercase tracking-wide">YT</span>
          </div>
        )}

        <div className={`p-4 ${isHero ? "sm:p-5" : ""}`}>
          {!isYoutube ? (
            <div className="border-l-2 border-accent/25 pl-3">
              <h3 className={`font-semibold text-text leading-snug line-clamp-2 group-hover:text-accent transition-colors duration-300 ${isHero ? "text-base" : "text-sm"}`}>
                {item.title || "Untitled"}
              </h3>
            </div>
          ) : (
            <h3 className={`font-semibold text-text leading-snug line-clamp-2 group-hover:text-accent transition-colors duration-300 ${isHero ? "text-base" : "text-sm"}`}>
              {item.title || "Untitled"}
            </h3>
          )}

          <div className="text-xs text-text-muted mt-1.5 flex items-center gap-1.5">
            {!isYoutube && <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent/40 flex-shrink-0" />}
            {item.author && <span className="truncate max-w-[160px]">{item.author}</span>}
            {item.author && item.created_at && <span className="text-text-dim">·</span>}
            {item.created_at && <span className="text-text-dim font-mono text-[11px]">{formatDate(item.created_at)}</span>}
          </div>

          {item.summary_preview && (
            <p className="text-xs text-text-secondary mt-2 line-clamp-2 leading-relaxed">{item.summary_preview}</p>
          )}

          {visibleTags.length > 0 && (
            <div className="flex gap-1.5 mt-3 flex-wrap">
              {categories.slice(0, 2).map((cat, i) => (
                <span key={`c${i}`} className="text-[10px] bg-bg-elevated px-2 py-0.5 rounded-md text-text-dim border border-border-subtle">
                  {cat.name || cat.category}
                </span>
              ))}
              {topics.slice(0, visibleTags.length - categories.slice(0, 2).length).map((t, i) => (
                <span key={`t${i}`} className="text-[10px] bg-bg-elevated px-1.5 py-0.5 rounded-md text-accent/60 font-mono border border-border-subtle">
                  {t.topic}
                </span>
              ))}
              {goals.slice(0, Math.max(0, 3 - categories.slice(0, 2).length - topics.length)).map((g, i) => (
                <span key={`g${i}`} className="text-[10px] bg-success/5 px-1.5 py-0.5 rounded-md text-success/60 border border-success/10">
                  {g.goal}
                </span>
              ))}
              {overflowCount > 0 && (
                <span className="text-[10px] text-text-dim font-mono">+{overflowCount}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

export default memo(LinkCard);
