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
 *
 * @param {Object} params
 * @param {Array} params.categoryPaths - Array of { domainSlug, categorySlug } for each assigned category
 * @param {string} params.type - 'youtube' | 'article'
 * @param {Object} params.metadata
 * @param {Object} params.summary
 * @param {string|null} params.rawContent
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

    // Write structured JSON artifact
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

function buildJsonArtifact({ type, metadata, summary }) {
  return {
    version: 1,
    type,
    metadata: {
      title: metadata.title || "Untitled",
      url: metadata.url,
      author: metadata.author || metadata.channel || "Unknown",
      ...(type === "youtube" ? { channel: metadata.channel } : { siteName: metadata.siteName }),
      ...(metadata.duration && { duration: metadata.duration }),
      ...(metadata.readingTime && { reading_time: metadata.readingTime }),
      date_published: metadata.publishedTime || metadata.publish_date || null,
      date_saved: new Date().toISOString(),
    },
    ai_summary: {
      tldr: summary.tldr || null,
      summary: summary.summary || null,
      key_takeaways: summary.key_takeaways || [],
      actionable_advice: summary.actionable_advice || [],
      frameworks_and_analogies: summary.frameworks_and_analogies || [],
      notable_quotes: summary.notable_quotes || [],
      difficulty: summary.difficulty || null,
      content_type: summary.content_type || null,
      topics: summary.topics || [],
    },
    categories: (summary.categories || []).map(c => ({
      domain: typeof c === "string" ? "Unknown" : c.domain,
      category: typeof c === "string" ? c : c.category,
    })),
  };
}

function buildMarkdown({ type, metadata, summary }) {
  const categories = summary.categories || [];
  const dateSaved = new Date().toISOString().split("T")[0];

  const topics = summary.topics || [];

  let md = `---
title: "${(metadata.title || "Untitled").replace(/"/g, '\\"')}"
url: "${metadata.url}"
type: ${type}
categories: [${categories.map(c => `"${typeof c === 'string' ? c : c.category}"`).join(", ")}]
author: "${(metadata.author || metadata.channel || "Unknown").replace(/"/g, '\\"')}"
date_saved: "${dateSaved}"
date_published: "${metadata.publishedTime || metadata.publish_date || "Unknown"}"
difficulty: "${summary.difficulty || "unknown"}"
content_type: "${summary.content_type || "other"}"
topics: [${topics.map(t => `"${t}"`).join(", ")}]
---

# ${metadata.title || "Untitled"}
${summary.tldr ? `\n> **TL;DR:** ${summary.tldr}\n` : ""}
${summary.difficulty || summary.content_type ? `**${(summary.difficulty || "").charAt(0).toUpperCase() + (summary.difficulty || "").slice(1)}** · ${(summary.content_type || "other").replace(/-/g, " ")}\n` : ""}
## Summary
${summary.summary || "No summary available."}

## Key Takeaways
${(summary.key_takeaways || []).map((t) => `- ${t}`).join("\n")}
`;

  if (summary.actionable_advice?.length > 0) {
    md += `
## ${type === "youtube" ? "Actionable Advice" : "Action Items"}
${summary.actionable_advice.map((a) => `- ${a}`).join("\n")}
`;
  }

  if (summary.frameworks_and_analogies?.length > 0) {
    md += `
## Frameworks & Analogies
${summary.frameworks_and_analogies.map((f) => `- ${f}`).join("\n")}
`;
  }

  if (summary.notable_quotes?.length > 0) {
    md += `
## Notable Quotes
${summary.notable_quotes
  .map((q) => {
    const source = q.source ? ` — ${q.source}` : "";
    return `> "${q.quote}"${source}`;
  })
  .join("\n\n")}
`;
  }

  if (topics.length > 0) {
    md += `
## Topics
${topics.map(t => `\`${t}\``).join(" · ")}
`;
  }

  // Metadata footer
  md += `
---

## Metadata
- **Source:** [${metadata.title || "Link"}](${metadata.url})
`;

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
      doc.fontSize(22).font("Helvetica-Bold").text(metadata.title || "Untitled", {
        align: "left",
      });
      doc.moveDown(0.3);

      // Meta line
      const metaLine = [
        type === "youtube" ? `Channel: ${metadata.channel || "Unknown"}` : `Author: ${metadata.author || "Unknown"}`,
        `Saved: ${new Date().toISOString().split("T")[0]}`,
      ].join("  |  ");
      doc.fontSize(10).font("Helvetica").fillColor("#666666").text(metaLine);
      doc.fillColor("#000000");

      // Categories
      const categories = summary.categories || [];
      if (categories.length > 0) {
        doc.moveDown(0.3);
        const catNames = categories.map(c => typeof c === "string" ? c : c.category).join(", ");
        doc.fontSize(10).font("Helvetica").fillColor("#444444").text(`Categories: ${catNames}`);
        doc.fillColor("#000000");
      }

      doc.moveDown(1);

      addSection(doc, "Summary", summary.summary || "No summary available.");

      if (summary.key_takeaways?.length > 0) {
        addSection(doc, "Key Takeaways");
        for (const item of summary.key_takeaways) {
          doc.fontSize(11).font("Helvetica").text(`  •  ${item}`, { indent: 10 });
          doc.moveDown(0.3);
        }
      }

      if (summary.actionable_advice?.length > 0) {
        addSection(doc, type === "youtube" ? "Actionable Advice" : "Action Items");
        for (const item of summary.actionable_advice) {
          doc.fontSize(11).font("Helvetica").text(`  •  ${item}`, { indent: 10 });
          doc.moveDown(0.3);
        }
      }

      if (summary.frameworks_and_analogies?.length > 0) {
        addSection(doc, "Frameworks & Analogies");
        for (const item of summary.frameworks_and_analogies) {
          doc.fontSize(11).font("Helvetica").text(`  •  ${item}`, { indent: 10 });
          doc.moveDown(0.3);
        }
      }

      if (summary.notable_quotes?.length > 0) {
        addSection(doc, "Notable Quotes");
        for (const q of summary.notable_quotes) {
          const source = q.source ? ` — ${q.source}` : "";
          doc.fontSize(11).font("Helvetica-Oblique").text(`"${q.quote}"${source}`, { indent: 20 });
          doc.moveDown(0.5);
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
