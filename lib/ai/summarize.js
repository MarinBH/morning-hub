import Anthropic from "@anthropic-ai/sdk";
import { DOMAINS_AND_CATEGORIES, getPredefinedCategoryNames } from "../db.js";

let client;
function getClient() {
  if (!client) {
    client = new Anthropic();
  }
  return client;
}

// Build a readable category reference for the AI prompt
function buildCategoryReference() {
  const lines = [];
  for (const [domain, categories] of Object.entries(DOMAINS_AND_CATEGORIES)) {
    lines.push(`  ${domain}: ${categories.join(", ")}`);
  }
  return lines.join("\n");
}

const SUMMARY_TOOL = {
  name: "save_summary",
  description: "Save the structured summary and categorization of the content",
  input_schema: {
    type: "object",
    required: ["summary", "key_takeaways", "categories"],
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
      categories: {
        type: "array",
        items: {
          type: "object",
          properties: {
            domain: { type: "string", description: "The Wheel of Life domain name (e.g. 'Health & Fitness', 'Tech & Knowledge')" },
            category: { type: "string", description: "The specific sub-category name (e.g. 'Strength Workouts', 'AI & Machine Learning')" },
          },
          required: ["domain", "category"],
        },
        description: "1-4 category assignments. Content can belong to MULTIPLE categories across different domains. Use existing categories when possible, but suggest new ones if needed.",
      },
    },
  },
};

export async function summarizeContent(type, metadata, content) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not configured. Add it to .env.local");
  }

  const categoryRef = buildCategoryReference();

  const systemPrompt = `You are a content analyst that creates structured summaries for a personal knowledge management system.

Your summaries should be insightful, capturing the core ideas, actionable advice, and unique frameworks or analogies.

## Category System (Wheel of Life Domains → Sub-categories)

Content is organized into domains and granular sub-categories. A single piece of content can (and often should) belong to MULTIPLE categories when relevant. For example, a video about "morning routine for productivity and fitness" should be categorized under BOTH "Health & Fitness > Strength Workouts" AND "Personal Growth > Habits & Routines".

Available domains and categories:
${categoryRef}

Rules for categorization:
- Assign 1-4 categories (be generous — file under all that genuinely apply)
- Use existing category names exactly when they match
- You may suggest new sub-categories within existing domains if nothing fits well
- Content about workouts/exercises → use the specific workout type (Strength, Mobility, Endurance)
- Content about learning/information about a topic → use the "Information" variant when available

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

    const toolUse = response.content.find((c) => c.type === "tool_use");
    if (!toolUse) {
      throw new Error("Claude did not return a structured summary");
    }

    return toolUse.input;
  } catch (err) {
    if (err.status === 529 || err.status >= 500) {
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
