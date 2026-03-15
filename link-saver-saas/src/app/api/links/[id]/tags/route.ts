import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id: linkId } = await params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify link ownership
  const { data: link } = await supabase
    .from("links")
    .select("id")
    .eq("id", linkId)
    .eq("user_id", user.id)
    .single();

  if (!link) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: { name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const tagName = body.name?.trim().toLowerCase();
  if (!tagName || tagName.length > 50) {
    return NextResponse.json({ error: "Tag name required (max 50 chars)" }, { status: 400 });
  }

  // Upsert tag
  const { data: tag, error: tagError } = await supabase
    .from("tags")
    .upsert(
      { user_id: user.id, name: tagName, tag_type: "user" },
      { onConflict: "user_id,name,tag_type" }
    )
    .select("id, name, tag_type")
    .single();

  if (tagError || !tag) {
    return NextResponse.json({ error: tagError?.message || "Failed to create tag" }, { status: 500 });
  }

  // Link tag to link (ignore duplicate)
  await supabase
    .from("link_tags")
    .upsert({ link_id: linkId, tag_id: tag.id }, { onConflict: "link_id,tag_id" });

  return NextResponse.json(tag, { status: 201 });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id: linkId } = await params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tagId = searchParams.get("tagId");

  if (!tagId) {
    return NextResponse.json({ error: "tagId required" }, { status: 400 });
  }

  // Verify ownership
  const { data: link } = await supabase
    .from("links")
    .select("id")
    .eq("id", linkId)
    .eq("user_id", user.id)
    .single();

  if (!link) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await supabase
    .from("link_tags")
    .delete()
    .eq("link_id", linkId)
    .eq("tag_id", tagId);

  return NextResponse.json({ success: true });
}
