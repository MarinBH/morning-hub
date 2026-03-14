import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch all links with tags and goals
  const { data: links, error: linksError } = await supabase
    .from("links")
    .select("*, link_tags(tags(name, tag_type)), link_goals(goal, relevance)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (linksError) {
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }

  return NextResponse.json({
    exported_at: new Date().toISOString(),
    user_email: user.email,
    total_links: links?.length || 0,
    links: links || [],
  });
}
