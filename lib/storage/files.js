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

export function buildFilePath(primaryTag, type, title) {
  const tagSlug = slugify(primaryTag);
  const titleSlug = slugify(title) || "untitled";
  const typeDir = type === "youtube" ? "youtube" : "articles";
  return path.join(tagSlug, typeDir, titleSlug);
}

export function saveFiles({ relativePath, type, metadata, summary, rawContent }) {
  const fullDir = path.join(STORAGE_ROOT, relativePath);
  fs.mkdirSync(fullDir, { recursive: true });

  // Build markdown content
  const markdown = buildMarkdown({ type, metadata, summary });
  const mdPath = path.join(fullDir, "summary.md");
  fs.writeFileSync(mdPath, markdown, "utf-8");

  // Save raw content
  if (rawContent) {
    const rawFileName = type === "youtube" ? "transcript.txt" : "full-text.txt";
    fs.writeFileSync(path.join(fullDir, rawFileName), rawContent, "utf-8");
  }

  // Generate PDF (async, non-blocking)
  const pdfPath = path.join(fullDir, "summary.pdf");
  generatePdf(pdfPath, { type, metadata, summary }).catch((err) => {
    console.warn("PDF generation failed:", err.message);
  });

  return { directory: fullDir, markdownPath: mdPath, pdfPath };
}

function buildMarkdown({ type, metadata, summary }) {
  const tags = [
    ...(summary.tags?.existing || []),
    ...(summary.tags?.suggested_new || []),
  ];

  const dateSaved = new Date().toISOString().split("T")[0];

  let md = `---
title: "${(metadata.title || "Untitled").replace(/"/g, '\\"')}"
url: "${metadata.url}"
type: ${type}
tags: [${tags.map(t => `"${t}"`).join(", ")}]
author: "${(metadata.author || metadata.channel || "Unknown").replace(/"/g, '\\"')}"
date_saved: "${dateSaved}"
date_published: "${metadata.publishedTime || metadata.publish_date || "Unknown"}"
---

# ${metadata.title || "Untitled"}

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

      // Tags
      const tags = [...(summary.tags?.existing || []), ...(summary.tags?.suggested_new || [])];
      if (tags.length > 0) {
        doc.moveDown(0.3);
        doc.fontSize(10).font("Helvetica").fillColor("#444444").text(`Tags: ${tags.join(", ")}`);
        doc.fillColor("#000000");
      }

      doc.moveDown(1);

      // Summary
      addSection(doc, "Summary", summary.summary || "No summary available.");

      // Key Takeaways
      if (summary.key_takeaways?.length > 0) {
        addSection(doc, "Key Takeaways");
        for (const item of summary.key_takeaways) {
          doc.fontSize(11).font("Helvetica").text(`  •  ${item}`, { indent: 10 });
          doc.moveDown(0.3);
        }
      }

      // Actionable Advice
      if (summary.actionable_advice?.length > 0) {
        addSection(doc, type === "youtube" ? "Actionable Advice" : "Action Items");
        for (const item of summary.actionable_advice) {
          doc.fontSize(11).font("Helvetica").text(`  •  ${item}`, { indent: 10 });
          doc.moveDown(0.3);
        }
      }

      // Frameworks
      if (summary.frameworks_and_analogies?.length > 0) {
        addSection(doc, "Frameworks & Analogies");
        for (const item of summary.frameworks_and_analogies) {
          doc.fontSize(11).font("Helvetica").text(`  •  ${item}`, { indent: 10 });
          doc.moveDown(0.3);
        }
      }

      // Quotes
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
