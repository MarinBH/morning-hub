"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Youtube, MapPin, ArrowRight, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const EXAMPLE_TYPES = [
  {
    icon: BookOpen,
    label: "Articles & Blogs",
    example: "https://example.com/article",
    color: "text-accent",
  },
  {
    icon: Youtube,
    label: "YouTube Videos",
    example: "https://youtube.com/watch?v=...",
    color: "text-red-400",
  },
  {
    icon: MapPin,
    label: "Google Maps Places",
    example: "https://maps.google.com/...",
    color: "text-emerald-400",
  },
];

export default function WelcomePage() {
  const [userName, setUserName] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.user_metadata?.full_name) {
        setUserName(user.user_metadata.full_name.split(" ")[0]);
      }
    }
    loadUser();
  }, []);

  function handleSaveFirst() {
    window.dispatchEvent(new CustomEvent("open-save-modal"));
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12 text-center">
      {/* Welcome header */}
      <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-5">
        <Sparkles size={24} className="text-accent" />
      </div>
      <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight mb-2">
        Welcome{userName ? `, ${userName}` : ""}!
      </h1>
      <p className="text-text-secondary text-base mb-10 max-w-sm mx-auto leading-relaxed">
        Keepmark turns any link into organized, AI-powered knowledge. Here&apos;s what you can save:
      </p>

      {/* Example types */}
      <div className="space-y-3 mb-10 text-left">
        {EXAMPLE_TYPES.map((type) => (
          <div
            key={type.label}
            className="flex items-center gap-3.5 p-4 rounded-[--radius-lg] bg-surface border border-border"
          >
            <div className="w-10 h-10 rounded-[--radius-md] bg-surface-hover flex items-center justify-center flex-shrink-0">
              <type.icon size={20} className={type.color} />
            </div>
            <div className="min-w-0">
              <div className="font-heading text-sm font-semibold">{type.label}</div>
              <div className="text-[12px] text-muted font-mono truncate">{type.example}</div>
            </div>
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div className="space-y-3">
        <button
          onClick={handleSaveFirst}
          className="btn btn-primary btn-lg w-full gap-2"
        >
          Save your first link
          <ArrowRight size={16} />
        </button>
        <button
          onClick={() => router.push("/knowledge")}
          className="btn btn-ghost btn-md w-full text-muted"
        >
          Skip to library
        </button>
      </div>
    </div>
  );
}
