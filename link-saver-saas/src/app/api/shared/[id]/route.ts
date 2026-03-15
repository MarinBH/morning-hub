import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch link only if it's marked as public
  const { data: link, error } = await supabase
    .from("links")
    .select(`
      title, type, section, thumbnail, author, channel, site_name,
      reading_time, duration, place_type, rating, address,
      summary_preview, ai_summary, is_public,
      link_tags(tags(name))
    `)
    .eq("id", id)
    .eq("is_public", true)
    .single();

  if (error || !link) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Extract tag names
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tags = (link.link_tags || []).map((lt: any) => lt.tags?.name).filter(Boolean);

  return NextResponse.json({
    title: link.title,
    type: link.type,
    section: link.section,
    thumbnail: link.thumbnail,
    author: link.author,
    channel: link.channel,
    site_name: link.site_name,
    reading_time: link.reading_time,
    duration: link.duration,
    place_type: link.place_type,
    rating: link.rating,
    address: link.address,
    summary_preview: link.summary_preview,
    ai_summary: link.ai_summary,
    tags,
  });
}
