import fs from "fs";
import path from "path";

const STORAGE_ROOT = path.join(process.cwd(), "storage", "saved");
const IS_CLOUD = !!process.env.TURSO_DATABASE_URL;

export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 60)
    .replace(/(^-|-$)/g, "");
}

export function buildFilePath(domainSlug, categorySlug, type, title) {
  const titleSlug = slugify(title) || "untitled";
  const typeDir = type === "youtube" ? "youtube" : "articles";
  return path.join(domainSlug, categorySlug, typeDir, titleSlug);
}

/**
 * Dual-mode save:
 * - Local dev: writes files to storage/saved/ AND returns content for DB
 * - Cloud (Turso): returns content only, no filesystem writes
 *
 * Always returns { relativePath, markdownContent, jsonArtifactStr, rawContent }
 */
export function saveFiles({ categoryPaths, type, metadata, summary, rawContent }) {
  const markdown = buildMarkdown({ type, metadata, summary });
  const jsonArtifact = buildJsonArtifact({ type, metadata, summary });
  const jsonArtifactStr = JSON.stringify(jsonArtifact, null, 2);

  let relativePath = null;

  if (categoryPaths.length > 0) {
    const first = categoryPaths[0];
    relativePath = buildFilePath(first.domainSlug, first.categorySlug, type, metadata.title || "untitled");
  }

  // In cloud mode, skip filesystem writes entirely
  if (IS_CLOUD) {
    return { relativePath, markdownContent: markdown, jsonArtifactStr, rawContent: rawContent || null };
  }

  // Local dev: write files to all category folders
  const rawFileName = type === "youtube" ? "transcript.txt" : "full-text.txt";

  for (const { domainSlug, categorySlug } of categoryPaths) {
    const relPath = buildFilePath(domainSlug, categorySlug, type, metadata.title || "untitled");
    const fullDir = path.join(STORAGE_ROOT, relPath);
    fs.mkdirSync(fullDir, { recursive: true });

    fs.writeFileSync(path.join(fullDir, "summary.md"), markdown, "utf-8");
    fs.writeFileSync(path.join(fullDir, "summary.json"), jsonArtifactStr, "utf-8");

    if (rawContent) {
      fs.writeFileSync(path.join(fullDir, rawFileName), rawContent, "utf-8");
    }
  }

  return { relativePath, markdownContent: markdown, jsonArtifactStr, rawContent: rawContent || null };
}

// ─── JSON Artifact (v2) ────────────────────────────────────────────────

export function buildJsonArtifact({ type, metadata, summary }) {
  const categories = summary.categories || [];

  return {
    schema_version: 2,

    source: {
      url: metadata.url,
      type,
      title: metadata.title || "Untitled",
      platform: type === "youtube" ? "YouTube" : (metadata.siteName || "Web"),
      author: {
        name: metadata.author || metadata.channel || "Unknown",
        description: summary.author_description || null,
      },
      published_date: metadata.publishedTime || metadata.publish_date || null,
      date_saved: new Date().toISOString(),
      ...(metadata.duration && { duration: metadata.duration }),
      ...(metadata.readingTime && { reading_time_min: metadata.readingTime }),
    },

    summary: {
      tldr: summary.tldr || null,
      core_thesis: summary.core_thesis || summary.summary || null,
      key_takeaways: summary.key_takeaways || [],
      difficulty: summary.difficulty || null,
      content_format: summary.content_format || summary.content_type || null,
    },

    actions: (summary.actions || []).map(a => ({
      action: typeof a === "string" ? a : a.action,
      rationale: typeof a === "string" ? null : (a.rationale || null),
    })),

    quotes_and_examples: (summary.quotes_and_examples || []).map(q => ({
      text: q.text || q.quote || "",
      attribution: q.attribution || q.source || null,
      source_type: q.source_type || "quote",
      theme: q.theme || null,
      topic: q.topic || null,
    })),

    frameworks: (summary.frameworks || []).map(f => ({
      name: typeof f === "string" ? f : f.name,
      description: typeof f === "string" ? null : (f.description || null),
    })),

    tags: {
      domains: groupCategoriesByDomain(categories),
      topics: summary.topics || [],
      concepts: summary.concepts || [],
      goals: (summary.goals || []).map(g => ({
        goal: typeof g === "string" ? g : g.goal,
        relevance: typeof g === "string" ? null : (g.relevance || null),
      })),
    },
  };
}

function groupCategoriesByDomain(categories) {
  const map = {};
  for (const cat of categories) {
    const domain = typeof cat === "string" ? "Other" : (cat.domain || "Other");
    const catName = typeof cat === "string" ? cat : cat.category;
    if (!map[domain]) map[domain] = { domain, categories: [] };
    map[domain].categories.push(catName);
  }
  return Object.values(map);
}

// ─── Markdown (context-first ordering) ─────────────────────────────────

export function buildMarkdown({ type, metadata, summary }) {
  const categories = summary.categories || [];
  const dateSaved = new Date().toISOString().split("T")[0];
  const topics = summary.topics || [];
  const concepts = summary.concepts || [];
  const goals = summary.goals || [];

  // YAML frontmatter
  let md = `---
title: "${(metadata.title || "Untitled").replace(/"/g, '\\"')}"
url: "${metadata.url}"
type: ${type}
author: "${(metadata.author || metadata.channel || "Unknown").replace(/"/g, '\\"')}"
platform: "${type === "youtube" ? "YouTube" : (metadata.siteName || "Web")}"
date_saved: "${dateSaved}"
date_published: "${metadata.publishedTime || metadata.publish_date || "Unknown"}"
difficulty: "${summary.difficulty || "unknown"}"
content_format: "${summary.content_format || summary.content_type || "other"}"
categories: [${categories.map(c => `"${typeof c === 'string' ? c : c.category}"`).join(", ")}]
topics: [${topics.map(t => `"${t}"`).join(", ")}]
concepts: [${concepts.map(c => `"${c}"`).join(", ")}]
---

# ${metadata.title || "Untitled"}
`;

  // TL;DR
  if (summary.tldr) {
    md += `\n> **TL;DR:** ${summary.tldr}\n`;
  }

  // Source context
  md += `\n## Source\n`;
  const authorName = metadata.author || metadata.channel || "Unknown";
  md += `- **Author:** ${authorName}\n`;
  if (summary.author_description) {
    md += `- **About:** ${summary.author_description}\n`;
  }
  md += `- **Platform:** ${type === "youtube" ? "YouTube" : (metadata.siteName || "Web")}\n`;
  if (summary.difficulty || summary.content_format) {
    md += `- **Level:** ${capitalize(summary.difficulty || "unknown")} · ${(summary.content_format || summary.content_type || "other").replace(/-/g, " ")}\n`;
  }

  // Core thesis
  if (summary.core_thesis) {
    md += `\n## Core Thesis\n${summary.core_thesis}\n`;
  } else if (summary.summary) {
    md += `\n## Summary\n${summary.summary}\n`;
  }

  // Key takeaways
  if (summary.key_takeaways?.length > 0) {
    md += `\n## Key Takeaways\n${summary.key_takeaways.map(t => `- ${t}`).join("\n")}\n`;
  }

  // Actions with rationale
  const actions = summary.actions || [];
  if (actions.length > 0) {
    md += `\n## Actions\n`;
    for (const a of actions) {
      if (typeof a === "string") {
        md += `- ${a}\n`;
      } else {
        md += `- **${a.action}**\n`;
        if (a.rationale) md += `  _${a.rationale}_\n`;
      }
    }
  }

  // Quotes & Examples
  const quotes = summary.quotes_and_examples || [];
  if (quotes.length > 0) {
    md += `\n## Quotes & Examples\n`;
    for (const q of quotes) {
      const attribution = q.attribution ? ` — ${q.attribution}` : "";
      const typeLabel = q.source_type ? ` [${q.source_type}]` : "";
      md += `\n> "${q.text || q.quote || ""}"${attribution}\n`;
      const tags = [q.theme, q.topic].filter(Boolean).map(t => `\`${t}\``).join(" · ");
      if (tags || typeLabel) {
        md += `> ${typeLabel}${tags ? " " + tags : ""}\n`;
      }
    }
  }

  // Frameworks
  const frameworks = summary.frameworks || [];
  if (frameworks.length > 0) {
    md += `\n## Frameworks\n`;
    for (const f of frameworks) {
      if (typeof f === "string") {
        md += `- ${f}\n`;
      } else {
        md += `- **${f.name}:** ${f.description || ""}\n`;
      }
    }
  }

  // Tags section
  md += `\n---\n\n## Tags\n`;
  if (topics.length > 0) {
    md += `**Topics:** ${topics.map(t => `\`${t}\``).join(" · ")}\n`;
  }
  if (concepts.length > 0) {
    md += `**Concepts:** ${concepts.map(c => `\`${c}\``).join(" · ")}\n`;
  }
  if (goals.length > 0) {
    md += `**Goals:**\n`;
    for (const g of goals) {
      if (typeof g === "string") {
        md += `- ${g}\n`;
      } else {
        md += `- ${g.goal} — _${g.relevance || ""}_\n`;
      }
    }
  }
  if (categories.length > 0) {
    md += `**Categories:** ${categories.map(c => typeof c === "string" ? c : `${c.domain} > ${c.category}`).join(", ")}\n`;
  }

  // Metadata footer
  md += `\n---\n\n## Metadata\n`;
  md += `- **Source:** [${metadata.title || "Link"}](${metadata.url})\n`;
  if (type === "youtube") {
    md += `- **Channel:** ${metadata.channel || "Unknown"}\n`;
    if (metadata.duration) md += `- **Duration:** ${metadata.duration}\n`;
  } else {
    if (metadata.siteName) md += `- **Publication:** ${metadata.siteName}\n`;
    if (metadata.readingTime) md += `- **Reading Time:** ~${metadata.readingTime} min\n`;
  }
  md += `- **Date Saved:** ${dateSaved}\n`;

  return md;
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
}
