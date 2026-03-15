import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Run count queries in parallel
  const [totalRes, articlesRes, videosRes, placesRes, favoritesRes] = await Promise.all([
    supabase.from("links").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("links").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("type", "article"),
    supabase.from("links").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("type", "youtube"),
    supabase.from("links").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("section", "places"),
    supabase.from("links").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("is_favorite", true),
  ]);

  // Get recent links
  const { data: recent } = await supabase
    .from("links")
    .select("id, title, type, section, thumbnail, summary_preview, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  return NextResponse.json({
    total: totalRes.count || 0,
    articles: articlesRes.count || 0,
    videos: videosRes.count || 0,
    places: placesRes.count || 0,
    favorites: favoritesRes.count || 0,
    recent: recent || [],
  });
}
