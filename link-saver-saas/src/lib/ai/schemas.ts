import type { Tool } from "@anthropic-ai/sdk/resources/messages";

export const KNOWLEDGE_SUMMARY_TOOL: Tool = {
  name: "save_knowledge_summary",
  description: "Save a structured knowledge summary with actions, quotes, and tags",
  input_schema: {
    type: "object" as const,
    required: [
      "author_description", "tldr", "core_thesis", "key_takeaways",
      "actions", "difficulty", "content_format", "topics", "concepts",
    ],
    properties: {
      author_description: {
        type: "string",
        description: "One sentence about the author/creator — who they are and why they're credible on this topic.",
      },
      tldr: {
        type: "string",
        description: "One punchy sentence (max 25 words) — the single core claim or thesis.",
      },
      core_thesis: {
        type: "string",
        description: "1-2 paragraphs: what the content argues or teaches, its central framework and conclusion.",
      },
      key_takeaways: {
        type: "array",
        items: { type: "string" },
        description: "3-7 specific, concrete takeaways that stand alone as useful knowledge.",
      },
      difficulty: {
        type: "string",
        enum: ["beginner", "intermediate", "advanced"],
      },
      content_format: {
        type: "string",
        enum: ["tutorial", "opinion", "research", "interview", "review", "explainer", "news", "case-study", "other"],
      },
      actions: {
        type: "array",
        items: {
          type: "object",
          required: ["action", "rationale"],
          properties: {
            action: { type: "string", description: "A specific, concrete thing to do." },
            rationale: { type: "string", description: "WHY this works — the evidence or mechanism." },
          },
        },
        description: "Actionable advice extracted from the content.",
      },
      quotes_and_examples: {
        type: "array",
        items: {
          type: "object",
          required: ["text", "source_type"],
          properties: {
            text: { type: "string", description: "The full quote, anecdote, or data point." },
            attribution: { type: "string", description: "Speaker name + timestamp if applicable." },
            source_type: { type: "string", enum: ["quote", "anecdote", "analogy", "data-point", "example"] },
          },
        },
      },
      frameworks: {
        type: "array",
        items: {
          type: "object",
          required: ["name", "description"],
          properties: {
            name: { type: "string" },
            description: { type: "string" },
          },
        },
      },
      topics: {
        type: "array",
        items: { type: "string" },
        description: "4-8 subject-specific tags. Lowercase, granular. E.g. 'zone 2 cardio', 'prompt engineering'.",
      },
      concepts: {
        type: "array",
        items: { type: "string" },
        description: "2-5 transferable principles that span domains. E.g. 'progressive overload', 'compound interest'.",
      },
      goals: {
        type: "array",
        items: {
          type: "object",
          required: ["goal", "relevance"],
          properties: {
            goal: { type: "string" },
            relevance: { type: "string" },
          },
        },
        description: "1-3 goals this content helps achieve.",
      },
    },
  },
};

export const PLACE_SUMMARY_TOOL: Tool = {
  name: "save_place_summary",
  description: "Save a structured place/experience summary",
  input_schema: {
    type: "object" as const,
    required: ["tldr", "key_highlights", "topics", "place_type"],
    properties: {
      tldr: {
        type: "string",
        description: "One punchy sentence (max 30 words) about what makes this place notable or worth visiting.",
      },
      place_type: {
        type: "string",
        enum: ["restaurant", "cafe", "bar", "hotel", "attraction", "park", "museum", "shop", "gym", "office", "other"],
        description: "The type of place.",
      },
      key_highlights: {
        type: "array",
        items: { type: "string" },
        description: "3-5 key things to know about this place. Specific details, not generic praise.",
      },
      best_for: {
        type: "array",
        items: { type: "string" },
        description: "2-4 occasions or use cases. E.g. 'date night', 'business lunch', 'solo travel', 'family-friendly'.",
      },
      insider_tips: {
        type: "array",
        items: { type: "string" },
        description: "1-3 practical tips a first-time visitor would find useful.",
      },
      price_level: {
        type: "string",
        enum: ["$", "$$", "$$$", "$$$$"],
        description: "Approximate price level.",
      },
      topics: {
        type: "array",
        items: { type: "string" },
        description: "3-6 tags. E.g. 'sushi', 'beverly hills', 'omakase', 'japanese cuisine'.",
      },
    },
  },
};
