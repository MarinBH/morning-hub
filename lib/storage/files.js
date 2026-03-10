import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

const STORAGE_ROOT = path.join(process.cwd(), "storage", "saved");

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
 * Save files to all assigned category folders (duplicated across categories).
 * Returns the primary path (first category) for DB storage.
 */
export function saveFiles({ categoryPaths, type, metadata, summary, rawContent }) {
  const markdown = buildMarkdown({ type, metadata, summary });
  const rawFileName = type === "youtube" ? "transcript.txt" : "full-text.txt";

  let primaryResult = null;

  for (const { domainSlug, categorySlug } of categoryPaths) {
    const relativePath = buildFilePath(domainSlug, categorySlug, type, metadata.title || "untitled");
    const fullDir = path.join(STORAGE_ROOT, relativePath);
    fs.mkdirSync(fullDir, { recursive: true });

    // Write markdown summary
    const mdPath = path.join(fullDir, "summary.md");
    fs.writeFileSync(mdPath, markdown, "utf-8");

    // Write structured JSON artifact (v2)
    const jsonPath = path.join(fullDir, "summary.json");
    const jsonArtifact = buildJsonArtifact({ type, metadata, summary });
    fs.writeFileSync(jsonPath, JSON.stringify(jsonArtifact, null, 2), "utf-8");

    // Write raw content
    if (rawContent) {
      fs.writeFileSync(path.join(fullDir, rawFileName), rawContent, "utf-8");
    }

    // Generate PDF (async, non-blocking)
    const pdfPath = path.join(fullDir, "summary.pdf");
    generatePdf(pdfPath, { type, metadata, summary }).catch((err) => {
      console.warn("PDF generation failed:", err.message);
    });

    if (!primaryResult) {
      primaryResult = { directory: fullDir, markdownPath: mdPath, pdfPath, relativePath };
    }
  }

  return primaryResult;
}

// ─── JSON Artifact (v2) ────────────────────────────────────────────────

function buildJsonArtifact({ type, metadata, summary }) {
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

function buildMarkdown({ type, metadata, summary }) {
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

// ─── PDF ────────────────────────────────────────────────────────────────

async function generatePdf(outputPath, { type, metadata, summary }) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 60, bottom: 60, left: 60, right: 60 },
      });

      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // Title
      doc.fontSize(22).font("Helvetica-Bold").text(metadata.title || "Untitled", { align: "left" });
      doc.moveDown(0.3);

      // TL;DR
      if (summary.tldr) {
        doc.fontSize(11).font("Helvetica-Oblique").fillColor("#444444").text(summary.tldr);
        doc.fillColor("#000000");
        doc.moveDown(0.5);
      }

      // Source context
      const authorName = metadata.author || metadata.channel || "Unknown";
      const authorDesc = summary.author_description || "";
      doc.fontSize(10).font("Helvetica").fillColor("#666666").text(
        `${authorName}${authorDesc ? " — " + authorDesc : ""}  |  ${type === "youtube" ? "YouTube" : (metadata.siteName || "Web")}  |  ${capitalize(summary.difficulty || "")}  |  Saved: ${new Date().toISOString().split("T")[0]}`
      );
      doc.fillColor("#000000");

      // Categories
      const categories = summary.categories || [];
      if (categories.length > 0) {
        doc.moveDown(0.3);
        const catNames = categories.map(c => typeof c === "string" ? c : `${c.domain} > ${c.category}`).join(", ");
        doc.fontSize(10).font("Helvetica").fillColor("#444444").text(catNames);
        doc.fillColor("#000000");
      }

      doc.moveDown(1);

      // Core thesis
      addSection(doc, "Core Thesis", summary.core_thesis || summary.summary || "No summary available.");

      // Key takeaways
      if (summary.key_takeaways?.length > 0) {
        addSection(doc, "Key Takeaways");
        for (const item of summary.key_takeaways) {
          doc.fontSize(11).font("Helvetica").text(`  •  ${item}`, { indent: 10 });
          doc.moveDown(0.3);
        }
      }

      // Actions
      const actions = summary.actions || [];
      if (actions.length > 0) {
        addSection(doc, "Actions");
        for (const a of actions) {
          const action = typeof a === "string" ? a : a.action;
          doc.fontSize(11).font("Helvetica-Bold").text(`  •  ${action}`, { indent: 10 });
          if (typeof a !== "string" && a.rationale) {
            doc.fontSize(10).font("Helvetica-Oblique").fillColor("#555555").text(`     ${a.rationale}`, { indent: 20 });
            doc.fillColor("#000000");
          }
          doc.moveDown(0.4);
        }
      }

      // Quotes & Examples
      const quotes = summary.quotes_and_examples || [];
      if (quotes.length > 0) {
        addSection(doc, "Quotes & Examples");
        for (const q of quotes) {
          const text = q.text || q.quote || "";
          const attribution = q.attribution ? ` — ${q.attribution}` : "";
          doc.fontSize(11).font("Helvetica-Oblique").text(`"${text}"${attribution}`, { indent: 20 });
          const labels = [q.source_type, q.theme, q.topic].filter(Boolean).join(" · ");
          if (labels) {
            doc.fontSize(9).font("Helvetica").fillColor("#888888").text(labels, { indent: 20 });
            doc.fillColor("#000000");
          }
          doc.moveDown(0.5);
        }
      }

      // Frameworks
      const frameworks = summary.frameworks || [];
      if (frameworks.length > 0) {
        addSection(doc, "Frameworks");
        for (const f of frameworks) {
          const name = typeof f === "string" ? f : f.name;
          const desc = typeof f === "string" ? "" : (f.description || "");
          doc.fontSize(11).font("Helvetica-Bold").text(`  •  ${name}`, { indent: 10 });
          if (desc) {
            doc.fontSize(10).font("Helvetica").text(`     ${desc}`, { indent: 20 });
          }
          doc.moveDown(0.3);
        }
      }

      // Tags
      const topics = summary.topics || [];
      const concepts = summary.concepts || [];
      const goals = summary.goals || [];
      if (topics.length > 0 || concepts.length > 0 || goals.length > 0) {
        addSection(doc, "Tags");
        if (topics.length > 0) {
          doc.fontSize(10).font("Helvetica-Bold").text("Topics: ", { continued: true });
          doc.font("Helvetica").text(topics.join(", "));
        }
        if (concepts.length > 0) {
          doc.fontSize(10).font("Helvetica-Bold").text("Concepts: ", { continued: true });
          doc.font("Helvetica").text(concepts.join(", "));
        }
        if (goals.length > 0) {
          doc.fontSize(10).font("Helvetica-Bold").text("Goals: ", { continued: true });
          doc.font("Helvetica").text(goals.map(g => typeof g === "string" ? g : g.goal).join(", "));
        }
      }

      doc.end();
      stream.on("finish", resolve);
      stream.on("error", reject);
    } catch (err) {
      reject(err);
    }
  });
}

function addSection(doc, title, body) {
  doc.moveDown(0.8);
  doc.fontSize(14).font("Helvetica-Bold").text(title);
  doc.moveDown(0.4);
  if (body) {
    doc.fontSize(11).font("Helvetica").text(body, { lineGap: 3 });
  }
}
