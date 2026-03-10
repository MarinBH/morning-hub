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
  description: "Save the structured knowledge summary, actions, quotes, and multi-dimensional tags",
  input_schema: {
    type: "object",
    required: [
      "author_description", "tldr", "core_thesis", "key_takeaways",
      "actions", "quotes_and_examples", "frameworks",
      "difficulty", "content_format",
      "topics", "concepts", "goals", "categories",
    ],
    properties: {
      // ─── Source context ────────────────────────────────────
      author_description: {
        type: "string",
        description: "One sentence about the author/creator — who they are and why they're credible on this topic. E.g. 'Stanford neuroscientist specializing in brain optimization and sleep research'",
      },

      // ─── Summary ──────────────────────────────────────────
      tldr: {
        type: "string",
        description: "One punchy sentence (max 25 words) — the single core claim or thesis someone should remember.",
      },
      core_thesis: {
        type: "string",
        description: "1-2 paragraphs: what the content fundamentally argues or teaches, its central framework, key supporting evidence, and conclusion. This is the intellectual meat — not a summary of topics covered, but what the content CLAIMS and how it supports that claim.",
      },
      key_takeaways: {
        type: "array",
        items: { type: "string" },
        description: "3-7 specific, concrete takeaways. Not vague ('exercise is good') but specific ('3 sets of 8-12 reps at RPE 8 is optimal for hypertrophy'). Each should stand alone as a useful piece of knowledge.",
      },
      difficulty: {
        type: "string",
        enum: ["beginner", "intermediate", "advanced"],
        description: "Depth level: beginner (introductory, no prerequisites), intermediate (assumes foundational knowledge), advanced (deep/technical, expert audience)",
      },
      content_format: {
        type: "string",
        enum: ["tutorial", "opinion", "research", "interview", "review", "explainer", "motivational", "news", "case-study", "other"],
        description: "The format/genre of the content",
      },

      // ─── Actions ──────────────────────────────────────────
      actions: {
        type: "array",
        items: {
          type: "object",
          required: ["action", "rationale"],
          properties: {
            action: { type: "string", description: "A specific, concrete thing to do. Not vague advice." },
            rationale: { type: "string", description: "1-2 sentences: WHY this works — the evidence, reasoning, or mechanism. What happens if you follow this advice." },
          },
        },
        description: "Actionable advice extracted from the content. Each item pairs WHAT to do with WHY it matters. Only include genuinely actionable items, not platitudes.",
      },

      // ─── Quotes & Examples ────────────────────────────────
      quotes_and_examples: {
        type: "array",
        items: {
          type: "object",
          required: ["text", "source_type", "theme", "topic"],
          properties: {
            text: { type: "string", description: "The full quote, anecdote, analogy, or data point — verbatim when possible. Include enough context to be useful standalone." },
            attribution: { type: "string", description: "Speaker name + timestamp (MM:SS) for YouTube, or author name for articles. Omit if obvious from source." },
            source_type: {
              type: "string",
              enum: ["quote", "anecdote", "analogy", "data-point", "example"],
              description: "What kind of evidence/illustration this is",
            },
            theme: { type: "string", description: "The universal theme this illustrates (e.g. 'discipline', 'delayed gratification', 'compounding', 'risk-taking', 'resilience'). Lowercase." },
            topic: { type: "string", description: "The specific subject this relates to (e.g. 'cold exposure benefits', 'morning routine design'). Lowercase." },
          },
        },
        description: "Notable quotes, anecdotes, analogies, data points, and examples. These should be useful for writing — include full context, proper attribution, and classify by type/theme/topic for future retrieval.",
      },

      // ─── Frameworks ───────────────────────────────────────
      frameworks: {
        type: "array",
        items: {
          type: "object",
          required: ["name", "description"],
          properties: {
            name: { type: "string", description: "Name of the framework or mental model (e.g. 'The 80/20 Rule for Fitness')" },
            description: { type: "string", description: "Brief explanation of the framework as presented in this content" },
          },
        },
        description: "Mental models, frameworks, or structured thinking tools presented in the content. Only include if the content actually introduces or explains a framework.",
      },

      // ─── Tags (4 dimensions) ──────────────────────────────
      topics: {
        type: "array",
        items: { type: "string" },
        description: "4-8 subject-specific tags. Lowercase, granular, reusable. These are WHAT the content is about. E.g. 'zone 2 cardio', 'protein timing', 'prompt engineering', 'cold exposure'. Should be specific enough to connect related items but general enough to be reusable.",
      },
      concepts: {
        type: "array",
        items: { type: "string" },
        description: "2-5 transferable principles or mental models that appear in this content. These are ideas that SPAN domains — e.g. 'progressive overload' applies to fitness AND learning, 'compound interest' applies to finance AND habits. Lowercase.",
      },
      goals: {
        type: "array",
        items: {
          type: "object",
          required: ["goal", "relevance"],
          properties: {
            goal: { type: "string", description: "An objective this content helps achieve (e.g. 'build lean muscle', 'improve sleep quality', 'launch a side project'). Lowercase." },
            relevance: { type: "string", description: "1 sentence: how this content specifically helps with this goal." },
          },
        },
        description: "1-3 inferred goals or objectives this content serves. Think: 'If someone is trying to [goal], this content is useful because [relevance].'",
      },
      categories: {
        type: "array",
        items: {
          type: "object",
          required: ["domain", "category"],
          properties: {
            domain: { type: "string", description: "The Wheel of Life domain name" },
            category: { type: "string", description: "The specific sub-category name" },
          },
        },
        description: "1-4 domain/category assignments from the Wheel of Life taxonomy.",
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

  const systemPrompt = `You are a knowledge analyst building a personal knowledge corpus. Each piece of content becomes a structured knowledge node — designed for future querying, writing reference, and goal tracking.

## Priority: Context First

Lead with WHO created this and WHY they're credible. The reader wants to evaluate the source before absorbing the ideas.

## Field Instructions

### Source Context
- **author_description**: One sentence. Who they are + why they're credible ON THIS TOPIC. Not a generic bio. E.g. "Former Navy SEAL and ultramarathon runner who completed Hell Week three times" (not "author and motivational speaker").

### Summary Block
- **tldr**: Max 25 words. The single thesis or core claim. Not a topic description ("this video is about X") but the actual argument ("X causes Y because Z").
- **core_thesis**: 1-2 paragraphs. What the content ARGUES, not just what it covers. Include the central framework, key evidence, and conclusion. This should read like an executive briefing — someone reading only this paragraph should understand the intellectual contribution.
- **key_takeaways**: 3-7 specific, standalone facts or insights. Each should be useful even without the rest of the summary.
- **difficulty**: Based on prerequisites needed to understand the content, not topic complexity.
- **content_format**: The delivery format, not the topic.

### Actions
- Each action is a pair: **what to do** + **why it works**.
- Be specific: "Take 3-5g creatine monohydrate daily" not "consider taking supplements".
- Rationale should cite the mechanism or evidence: "because it increases phosphocreatine stores, improving high-intensity performance by 10-15%".
- Only include genuinely actionable items. Skip vague platitudes.

### Quotes & Examples
- **CRITICAL**: Include the FULL text — enough to be useful standalone for writing.
- For YouTube: Include timestamps (MM:SS) in attribution when possible.
- **source_type**: quote (direct words), anecdote (story/narrative), analogy (comparison), data-point (statistic/study), example (illustrative case).
- **theme**: Universal human theme this illustrates — discipline, risk-taking, compounding, resilience, simplicity, delayed gratification, etc.
- **topic**: The specific subject it relates to — lowercase, matches the topics tag format.

### Frameworks
- Only include if the content presents a named or structured framework/model.
- Give it a clear name and explain how it works as presented.

### Tags (4 Dimensions)

**topics** — WHAT the content is about. Subject-specific. E.g. "zone 2 cardio", "cold exposure", "prompt engineering".
**concepts** — Transferable PRINCIPLES that span domains. E.g. "progressive overload" (fitness → learning → business), "compound interest" (finance → habits → knowledge), "minimum effective dose" (medicine → training → productivity).
**goals** — OBJECTIVES this content helps achieve. Infer what someone watching/reading this is trying to accomplish, and explain how this content helps.

The distinction matters: "cold exposure" is a topic (subject-specific). "Hormesis" is a concept (the principle that small stressors trigger adaptation — applies to cold, exercise, fasting, etc).

### Categories (Wheel of Life)
${categoryRef}

Rules:
- Assign 1-4 categories (be generous — file under all that genuinely apply)
- Use existing category names exactly when they match
- You may suggest new sub-categories if nothing fits
- Workouts → specific type (Strength, Mobility, Endurance)
- Information about a topic → use "Information" variant when available

Use the save_summary tool to return your analysis.`;

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
      max_tokens: 8192,
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
        max_tokens: 8192,
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

  return `Analyze this YouTube video and create a structured knowledge summary.

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

  return `Analyze this article and create a structured knowledge summary.

**Title:** ${metadata.title}
**Author:** ${metadata.author || "Unknown"}
**Publication:** ${metadata.siteName || "Unknown"}
**Published:** ${metadata.publishedTime || "Unknown"}

**Article Text:**
${text || "[Article text extraction failed — summarize based on metadata only]"}`;
}
