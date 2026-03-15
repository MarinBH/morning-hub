"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Youtube, MapPin, Bookmark, Plus, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Stats {
  total: number;
  articles: number;
  videos: number;
  places: number;
  favorites: number;
  recent: Array<{
    id: string;
    title: string;
    type: string;
    section: string;
    thumbnail: string | null;
    summary_preview: string | null;
    created_at: string;
  }>;
}

const STAT_ITEMS = [
  { key: "articles", label: "Articles", icon: BookOpen, color: "text-accent" },
  { key: "videos", label: "Videos", icon: Youtube, color: "text-red-400" },
  { key: "places", label: "Places", icon: MapPin, color: "text-emerald-400" },
  { key: "favorites", label: "Favorites", icon: Bookmark, color: "text-warning" },
] as const;

export default function HomePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Load user name
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.full_name) {
        setUserName(user.user_metadata.full_name.split(" ")[0]);
      }

      // Load stats
      try {
        const res = await fetch("/api/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const greeting = getGreeting();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight mb-1">
          {greeting}{userName ? `, ${userName}` : ""}
        </h1>
        <p className="text-sm text-muted">
          {stats?.total
            ? `You have ${stats.total} saved link${stats.total !== 1 ? "s" : ""}`
            : "Welcome to Keepmark"}
        </p>
      </div>

      {/* Quick save */}
      <button
        onClick={() => window.dispatchEvent(new CustomEvent("open-save-modal"))}
        className="w-full p-3.5 rounded-[--radius-lg] bg-surface border border-dashed border-border hover:border-accent/30 transition-colors flex items-center gap-3 mb-6 group"
      >
        <div className="w-9 h-9 rounded-[--radius-md] bg-accent/10 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/15 transition-colors">
          <Plus size={18} className="text-accent" />
        </div>
        <span className="text-sm text-muted group-hover:text-text-secondary transition-colors">Save a new link...</span>
      </button>

      {/* Stats grid */}
      {!loading && stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-8">
          {STAT_ITEMS.map((item) => (
            <div
              key={item.key}
              className="p-3.5 rounded-[--radius-lg] bg-surface border border-border"
            >
              <item.icon size={16} className={`${item.color} mb-2`} />
              <div className="font-display text-xl font-bold tracking-tight">
                {stats[item.key]}
              </div>
              <div className="text-[11px] text-muted font-heading">{item.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Recent saves */}
      {!loading && stats && stats.recent.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading text-sm font-semibold">Recent saves</h2>
            <Link href="/knowledge" className="text-[12px] text-accent hover:text-accent-hover font-medium flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-1.5">
            {stats.recent.map((item) => (
              <Link
                key={item.id}
                href={`/link/${item.id}`}
                className="flex items-center gap-3 p-2.5 rounded-[--radius-md] hover:bg-surface transition-colors"
              >
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt=""
                    className="w-10 h-10 rounded-[--radius-sm] object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-[--radius-sm] bg-surface flex items-center justify-center flex-shrink-0">
                    {item.section === "places" ? (
                      <MapPin size={16} className="text-emerald-400" />
                    ) : item.type === "youtube" ? (
                      <Youtube size={16} className="text-red-400" />
                    ) : (
                      <BookOpen size={16} className="text-accent" />
                    )}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium font-heading truncate">{item.title || "Untitled"}</div>
                  <div className="text-[11px] text-muted truncate">
                    {item.summary_preview || new Date(item.created_at).toLocaleDateString()}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty state for new users */}
      {!loading && stats && stats.total === 0 && (
        <div className="text-center py-12">
          <p className="text-muted text-sm mb-4">Save your first link to see your dashboard come to life.</p>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("open-save-modal"))}
            className="btn btn-primary btn-sm"
          >
            <Plus size={14} />
            Save your first link
          </button>
        </div>
      )}
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
