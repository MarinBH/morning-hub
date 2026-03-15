import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("links")
    .select("*, link_tags(tag_id, tags(id, name, tag_type)), link_goals(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};

  if ("is_favorite" in body) {
    if (typeof body.is_favorite !== "boolean") {
      return NextResponse.json({ error: "is_favorite must be a boolean" }, { status: 400 });
    }
    updates.is_favorite = body.is_favorite;
  }
  if ("personal_notes" in body) {
    if (typeof body.personal_notes !== "string" || body.personal_notes.length > 10000) {
      return NextResponse.json({ error: "personal_notes must be a string (max 10000 chars)" }, { status: 400 });
    }
    updates.personal_notes = body.personal_notes;
  }
  if ("title" in body) {
    if (typeof body.title !== "string" || body.title.length > 500) {
      return NextResponse.json({ error: "title must be a string (max 500 chars)" }, { status: 400 });
    }
    updates.title = body.title;
  }
  if ("is_public" in body) {
    if (typeof body.is_public !== "boolean") {
      return NextResponse.json({ error: "is_public must be a boolean" }, { status: 400 });
    }
    updates.is_public = body.is_public;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("links")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("links")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
