import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const section = searchParams.get("section") || undefined;
  const type = searchParams.get("type") || undefined;
  const search = searchParams.get("search") || undefined;
  const tag = searchParams.get("tag") || undefined;
  const favorite = searchParams.get("favorite") || undefined;
  const sort = searchParams.get("sort") || "newest";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const offset = (page - 1) * limit;

  let query = supabase
    .from("links")
    .select("*, link_tags(tag_id, tags(id, name, tag_type))", { count: "exact" })
    .eq("user_id", user.id);

  if (section) query = query.eq("section", section);
  if (type) query = query.eq("type", type);
  if (favorite === "true") query = query.eq("is_favorite", true);

  if (search) {
    query = query.textSearch("fts", search, { type: "websearch" });
  }

  if (tag) {
    // Filter by tag name via join
    query = query.filter("link_tags.tags.name", "eq", tag);
  }

  // Sorting
  switch (sort) {
    case "oldest":
      query = query.order("created_at", { ascending: true });
      break;
    case "title":
      query = query.order("title", { ascending: true });
      break;
    default: // newest
      query = query.order("created_at", { ascending: false });
  }

  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    links: data || [],
    total: count || 0,
    page,
    limit,
    hasMore: (count || 0) > offset + limit,
  });
}
