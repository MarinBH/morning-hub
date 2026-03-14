import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { detectUrlType, getSectionForType, normalizeUrl, isValidUrl } from "@/lib/extractors/detect";
import { extractYouTube, formatTranscriptText } from "@/lib/extractors/youtube";
import { extractArticle } from "@/lib/extractors/article";
import { extractPlace } from "@/lib/extractors/places";
import { summarizeKnowledge, summarizePlace } from "@/lib/ai/summarize";

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const rawUrl = body.url?.trim();

  if (!rawUrl || !isValidUrl(rawUrl)) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const url = normalizeUrl(rawUrl);
  const type = detectUrlType(url);
  const section = getSectionForType(type);

  // Check for duplicate
  const { data: existing } = await supabase
    .from("links")
    .select("id")
    .eq("user_id", user.id)
    .eq("url", url)
    .single();

  if (existing) {
    return NextResponse.json({ error: "Link already saved", id: existing.id }, { status: 409 });
  }

  // Create initial record in processing state
  const { data: link, error: insertError } = await supabase
    .from("links")
    .insert({
      user_id: user.id,
      url,
      type,
      section,
      status: "processing",
      title: "Processing...",
    })
    .select("id")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Process in background (non-blocking response)
  processLink(supabase, link.id, user.id, url, type).catch((err) => {
    console.error("Link processing failed:", err);
  });

  return NextResponse.json({ id: link.id, type, section, status: "processing" });
}

async function processLink(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  linkId: string,
  userId: string,
  url: string,
  type: string
) {
  try {
    if (type === "youtube") {
      await processYouTube(supabase, linkId, userId, url);
    } else if (type === "place") {
      await processPlace(supabase, linkId, userId, url);
    } else {
      await processArticle(supabase, linkId, userId, url);
    }
  } catch (err) {
    await supabase
      .from("links")
      .update({ status: "error", error_message: (err as Error).message })
      .eq("id", linkId);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function processYouTube(supabase: any, linkId: string, userId: string, url: string) {
  const metadata = await extractYouTube(url);
  const transcriptText = formatTranscriptText(metadata.transcript);

  const summary = await summarizeKnowledge("youtube", {
    title: metadata.title,
    channel: metadata.channel,
  }, transcriptText);

  await supabase
    .from("links")
    .update({
      status: "complete",
      title: metadata.title,
      channel: metadata.channel,
      thumbnail: metadata.thumbnail,
      summary_preview: summary.tldr,
      ai_summary: summary,
    })
    .eq("id", linkId);

  await saveTags(supabase, linkId, userId, summary.topics, "topic");
  await saveTags(supabase, linkId, userId, summary.concepts, "concept");
  await saveGoals(supabase, linkId, summary.goals);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function processArticle(supabase: any, linkId: string, userId: string, url: string) {
  const metadata = await extractArticle(url);

  const summary = await summarizeKnowledge("article", {
    title: metadata.title,
    author: metadata.author,
    siteName: metadata.siteName,
  }, metadata.textContent);

  await supabase
    .from("links")
    .update({
      status: "complete",
      title: metadata.title,
      author: metadata.author,
      site_name: metadata.siteName,
      publish_date: metadata.publishedTime,
      reading_time: metadata.readingTime,
      thumbnail: metadata.thumbnail,
      summary_preview: summary.tldr,
      ai_summary: summary,
    })
    .eq("id", linkId);

  await saveTags(supabase, linkId, userId, summary.topics, "topic");
  await saveTags(supabase, linkId, userId, summary.concepts, "concept");
  await saveGoals(supabase, linkId, summary.goals);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function processPlace(supabase: any, linkId: string, userId: string, url: string) {
  const metadata = await extractPlace(url);

  const summary = await summarizePlace({
    name: metadata.name,
    address: metadata.address,
    rating: metadata.rating?.toString(),
    priceLevel: metadata.priceLevel,
    phone: metadata.phone,
  }, metadata.websiteContent);

  await supabase
    .from("links")
    .update({
      status: "complete",
      title: metadata.name,
      address: metadata.address,
      latitude: metadata.latitude,
      longitude: metadata.longitude,
      rating: metadata.rating,
      price_level: summary.price_level || metadata.priceLevel,
      phone: metadata.phone,
      place_type: summary.place_type,
      website_url: metadata.websiteUrl,
      thumbnail: metadata.thumbnail,
      summary_preview: summary.tldr,
      ai_summary: summary,
    })
    .eq("id", linkId);

  await saveTags(supabase, linkId, userId, summary.topics, "topic");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function saveTags(supabase: any, linkId: string, userId: string, tags: string[] | undefined, tagType: string) {
  if (!tags?.length) return;

  for (const tagName of tags) {
    const name = tagName.toLowerCase().trim();
    if (!name) continue;

    // Upsert tag
    const { data: tag } = await supabase
      .from("tags")
      .upsert({ user_id: userId, name, tag_type: tagType }, { onConflict: "user_id,name,tag_type" })
      .select("id")
      .single();

    if (tag) {
      await supabase
        .from("link_tags")
        .upsert({ link_id: linkId, tag_id: tag.id }, { onConflict: "link_id,tag_id" });
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function saveGoals(supabase: any, linkId: string, goals: Array<{ goal: string; relevance: string }> | undefined) {
  if (!goals?.length) return;

  for (const { goal, relevance } of goals) {
    await supabase
      .from("link_goals")
      .upsert({ link_id: linkId, goal: goal.toLowerCase(), relevance }, { onConflict: "link_id,goal" });
  }
}
