import Anthropic from "@anthropic-ai/sdk";
import { KNOWLEDGE_SUMMARY_TOOL, PLACE_SUMMARY_TOOL } from "./schemas";

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic();
  }
  return client;
}

// Model selection for unit economics:
// - Sonnet: deep analysis for knowledge content (articles, videos) — higher quality matters
// - Haiku: place summaries — simpler structured extraction, much cheaper
const MODEL_KNOWLEDGE = "claude-sonnet-4-20250514";
const MODEL_PLACES = "claude-haiku-4-5-20251001";

const KNOWLEDGE_SYSTEM_PROMPT = `You are a knowledge analyst creating structured summaries. Each piece of content becomes a knowledge node designed for future querying.

## Instructions
- **author_description**: One sentence. Who they are + why they're credible ON THIS TOPIC.
- **tldr**: Max 25 words. The actual thesis, not a topic description.
- **core_thesis**: 1-2 paragraphs. What the content ARGUES, not just covers.
- **key_takeaways**: 3-7 specific, standalone facts or insights.
- **actions**: Specific + rationale pairs. Be concrete, not vague.
- **topics**: 4-8 subject-specific lowercase tags.
- **concepts**: 2-5 transferable principles that span domains.

Use the save_knowledge_summary tool to return your analysis.`;

const PLACE_SYSTEM_PROMPT = `You are a travel & lifestyle analyst creating structured place summaries. Analyze the place information and any website content to create a useful, practical summary.

## Instructions
- **tldr**: Max 30 words. What makes this place notable or worth visiting.
- **key_highlights**: 3-5 specific things to know. Not generic praise — practical details.
- **best_for**: 2-4 occasions (date night, business lunch, solo travel, etc.)
- **insider_tips**: 1-3 practical tips for first-time visitors.
- **topics**: 3-6 lowercase tags.

Use the save_place_summary tool to return your analysis.`;

export interface KnowledgeSummary {
  author_description: string;
  tldr: string;
  core_thesis: string;
  key_takeaways: string[];
  difficulty: string;
  content_format: string;
  actions: Array<{ action: string; rationale: string }>;
  quotes_and_examples?: Array<{ text: string; attribution?: string; source_type: string }>;
  frameworks?: Array<{ name: string; description: string }>;
  topics: string[];
  concepts: string[];
  goals?: Array<{ goal: string; relevance: string }>;
}

export interface PlaceSummary {
  tldr: string;
  place_type: string;
  key_highlights: string[];
  best_for?: string[];
  insider_tips?: string[];
  price_level?: string;
  topics: string[];
}

export async function summarizeKnowledge(
  type: "article" | "youtube",
  metadata: Record<string, string | null | undefined>,
  content: string
): Promise<KnowledgeSummary> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  let text = content;
  if (text.length > 50000) {
    text = text.substring(0, 25000) + "\n\n[... truncated ...]\n\n" + text.substring(text.length - 25000);
  }

  let userContent: string;
  if (type === "youtube") {
    userContent = `Analyze this YouTube video:\n\n**Title:** ${metadata.title}\n**Channel:** ${metadata.channel}\n\n**Transcript:**\n${text || "[No transcript available]"}`;
  } else {
    userContent = `Analyze this article:\n\n**Title:** ${metadata.title}\n**Author:** ${metadata.author || "Unknown"}\n**Publication:** ${metadata.siteName || "Unknown"}\n\n**Article Text:**\n${text || "[Text extraction failed]"}`;
  }

  const response = await getClient().messages.create({
    model: MODEL_KNOWLEDGE,
    max_tokens: 4096,
    system: KNOWLEDGE_SYSTEM_PROMPT,
    tools: [KNOWLEDGE_SUMMARY_TOOL],
    tool_choice: { type: "tool", name: "save_knowledge_summary" },
    messages: [{ role: "user", content: userContent }],
  });

  const toolUse = response.content.find((c) => c.type === "tool_use");
  if (!toolUse) throw new Error("Claude did not return a structured summary");

  return toolUse.input as unknown as KnowledgeSummary;
}

export async function summarizePlace(
  metadata: Record<string, string | null | undefined>,
  websiteContent: string | null
): Promise<PlaceSummary> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  let userContent = `Analyze this place:\n\n**Name:** ${metadata.name}\n**Address:** ${metadata.address || "Unknown"}`;

  if (metadata.rating) userContent += `\n**Rating:** ${metadata.rating}`;
  if (metadata.priceLevel) userContent += `\n**Price Level:** ${metadata.priceLevel}`;
  if (metadata.phone) userContent += `\n**Phone:** ${metadata.phone}`;

  if (websiteContent) {
    const truncated = websiteContent.substring(0, 10000);
    userContent += `\n\n**Website Content:**\n${truncated}`;
  }

  const response = await getClient().messages.create({
    model: MODEL_PLACES,
    max_tokens: 2048,
    system: PLACE_SYSTEM_PROMPT,
    tools: [PLACE_SUMMARY_TOOL],
    tool_choice: { type: "tool", name: "save_place_summary" },
    messages: [{ role: "user", content: userContent }],
  });

  const toolUse = response.content.find((c) => c.type === "tool_use");
  if (!toolUse) throw new Error("Claude did not return a place summary");

  return toolUse.input as unknown as PlaceSummary;
}
