import Anthropic from "@anthropic-ai/sdk";
import { getPredefinedTagNames } from "../db.js";

let client;
function getClient() {
  if (!client) {
    client = new Anthropic();
  }
  return client;
}

const SUMMARY_TOOL = {
  name: "save_summary",
  description: "Save the structured summary of the content",
  input_schema: {
    type: "object",
    required: ["summary", "key_takeaways", "tags"],
    properties: {
      summary: {
        type: "string",
        description: "2-3 paragraph overview of the content",
      },
      key_takeaways: {
        type: "array",
        items: { type: "string" },
        description: "List of key takeaways",
      },
      actionable_advice: {
        type: "array",
        items: { type: "string" },
        description: "Actionable advice or action items from the content",
      },
      frameworks_and_analogies: {
        type: "array",
        items: { type: "string" },
        description: "Frameworks, mental models, or analogies used in the content",
      },
      notable_quotes: {
        type: "array",
        items: {
          type: "object",
          properties: {
            quote: { type: "string" },
            source: { type: "string", description: "Speaker name or timestamp (MM:SS) for YouTube" },
          },
          required: ["quote"],
        },
        description: "Notable quotes from the content",
      },
      tags: {
        type: "object",
        properties: {
          existing: {
            type: "array",
            items: { type: "string" },
            description: "Tags from the predefined list that apply",
          },
          suggested_new: {
            type: "array",
            items: { type: "string" },
            description: "Up to 3 new tag suggestions not in the predefined list",
          },
        },
        required: ["existing"],
      },
    },
  },
};

export async function summarizeContent(type, metadata, content) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not configured. Add it to .env.local");
  }

  const predefinedTags = getPredefinedTagNames();

  const systemPrompt = `You are a content analyst that creates structured summaries.
Your summaries should be insightful, capturing the core ideas, actionable advice, and unique frameworks or analogies.

Available predefined tags for categorization: ${predefinedTags.join(", ")}

Assign 1-3 existing tags from this list. You may also suggest up to 3 new tags if the content doesn't fit existing categories well.

Use the save_summary tool to return your structured analysis.`;

  let userContent;
  if (type === "youtube") {
    userContent = buildYouTubePrompt(metadata, content);
  } else {
    userContent = buildArticlePrompt(metadata, content);
  }

  const anthropic = getClient();

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      tools: [SUMMARY_TOOL],
      tool_choice: { type: "tool", name: "save_summary" },
      messages: [{ role: "user", content: userContent }],
    });

    // Extract tool use result
    const toolUse = response.content.find((c) => c.type === "tool_use");
    if (!toolUse) {
      throw new Error("Claude did not return a structured summary");
    }

    return toolUse.input;
  } catch (err) {
    if (err.status === 529 || err.status >= 500) {
      // Retry once on server errors
      console.warn("Claude API error, retrying once:", err.message);
      await new Promise((r) => setTimeout(r, 2000));
      const response = await getClient().messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: systemPrompt,
        tools: [SUMMARY_TOOL],
        tool_choice: { type: "tool", name: "save_summary" },
        messages: [{ role: "user", content: userContent }],
      });
      const toolUse = response.content.find((c) => c.type === "tool_use");
      if (!toolUse) throw new Error("Claude retry did not return structured summary");
      return toolUse.input;
    }
    throw err;
  }
}

function buildYouTubePrompt(metadata, transcriptText) {
  // Truncate very long transcripts
  let text = transcriptText;
  if (text.length > 50000) {
    const firstPart = text.substring(0, 25000);
    const lastPart = text.substring(text.length - 25000);
    text = `${firstPart}\n\n[... middle portion truncated for length ...]\n\n${lastPart}`;
  }

  return `Analyze this YouTube video and create a structured summary.

**Title:** ${metadata.title}
**Channel:** ${metadata.channel}

**Transcript:**
${text || "[No transcript available — summarize based on title and channel context only]"}`;
}

function buildArticlePrompt(metadata, articleText) {
  let text = articleText;
  if (text.length > 50000) {
    const firstPart = text.substring(0, 25000);
    const lastPart = text.substring(text.length - 25000);
    text = `${firstPart}\n\n[... middle portion truncated for length ...]\n\n${lastPart}`;
  }

  return `Analyze this article and create a structured summary.

**Title:** ${metadata.title}
**Author:** ${metadata.author || "Unknown"}
**Publication:** ${metadata.siteName || "Unknown"}
**Published:** ${metadata.publishedTime || "Unknown"}

**Article Text:**
${text || "[Article text extraction failed — summarize based on metadata only]"}`;
}
