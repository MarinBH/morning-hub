// End-to-end test: Full pipeline from URL → extraction → AI summary → file storage
import "dotenv/config";
import { detectUrlType, normalizeUrl } from "../lib/extractors/detect.js";
import { extractYouTube, formatTranscriptText } from "../lib/extractors/youtube.js";
import { extractArticle } from "../lib/extractors/article.js";
import { summarizeContent } from "../lib/ai/summarize.js";
import { buildFilePath, saveFiles } from "../lib/storage/files.js";
import { insertItem, linkItemTags, getItemById, findItemByUrl } from "../lib/db.js";
import fs from "fs";
import path from "path";

// Load env manually since we're not in Next.js
import { config } from "dotenv";
config({ path: ".env.local" });

const TEST_URLS = {
  youtube: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  article: "https://en.wikipedia.org/wiki/Artificial_intelligence",
};

async function testFullPipeline(label, url) {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  ${label}: ${url}`);
  console.log(`${"═".repeat(60)}\n`);

  // Step 1: Normalize + detect
  const normalized = normalizeUrl(url);
  const type = detectUrlType(normalized);
  console.log(`  1. Type detected: ${type}`);

  // Step 2: Check duplicates
  const existing = findItemByUrl(normalized);
  if (existing) {
    console.log(`  ⚠️  Already saved (ID: ${existing.id}) — testing anyway\n`);
  }

  // Step 3: Extract content
  console.log(`  2. Extracting content...`);
  let metadata, rawContent;

  try {
    if (type === "youtube") {
      const data = await extractYouTube(normalized);
      metadata = {
        title: data.title,
        channel: data.channel,
        author: data.channel,
        thumbnail: data.thumbnail,
        url: normalized,
        hasTranscript: data.hasTranscript,
      };
      rawContent = data.hasTranscript ? formatTranscriptText(data.transcript) : null;
      console.log(`     Title: "${metadata.title}"`);
      console.log(`     Channel: "${metadata.channel}"`);
      console.log(`     Transcript: ${metadata.hasTranscript ? `${rawContent.length} chars` : "not available"}`);
    } else {
      const data = await extractArticle(normalized);
      metadata = {
        title: data.title,
        author: data.author,
        siteName: data.siteName,
        publishedTime: data.publishedTime,
        readingTime: data.readingTime,
        url: normalized,
        isPartial: data.isPartial,
      };
      rawContent = data.textContent;
      console.log(`     Title: "${metadata.title}"`);
      console.log(`     Author: "${metadata.author || "unknown"}"`);
      console.log(`     Content: ${rawContent?.length || 0} chars, ~${metadata.readingTime || "?"} min read`);
      if (metadata.isPartial) console.log(`     ⚠️  Partial extraction (fallback mode)`);
    }
  } catch (err) {
    console.log(`     ❌ Extraction failed: ${err.message}`);
    console.log(`     Skipping rest of pipeline for this URL.\n`);
    return false;
  }

  // Step 4: AI Summarization
  console.log(`\n  3. AI Summarizing with Claude...`);
  const aiStart = Date.now();
  let summary;

  try {
    summary = await summarizeContent(type, metadata, rawContent || "");
    const aiTime = ((Date.now() - aiStart) / 1000).toFixed(1);
    console.log(`     ✅ Done in ${aiTime}s`);
    console.log(`     Summary: "${(summary.summary || "").substring(0, 120)}..."`);
    console.log(`     Key takeaways: ${summary.key_takeaways?.length || 0}`);
    console.log(`     Actionable advice: ${summary.actionable_advice?.length || 0}`);
    console.log(`     Frameworks: ${summary.frameworks_and_analogies?.length || 0}`);
    console.log(`     Quotes: ${summary.notable_quotes?.length || 0}`);
    console.log(`     Tags (existing): ${summary.tags?.existing?.join(", ") || "none"}`);
    console.log(`     Tags (new): ${summary.tags?.suggested_new?.join(", ") || "none"}`);
  } catch (err) {
    console.log(`     ❌ AI failed: ${err.message}`);
    summary = {
      summary: "AI summarization failed.",
      key_takeaways: [],
      tags: { existing: ["Learning"], suggested_new: [] },
    };
  }

  // Step 5: Save files
  console.log(`\n  4. Saving files...`);
  const primaryTag = summary.tags?.existing?.[0] || "Learning";
  const allTags = [...(summary.tags?.existing || []), ...(summary.tags?.suggested_new || [])];
  const relativePath = buildFilePath(primaryTag, type, metadata.title || "untitled");

  const { directory, markdownPath, pdfPath } = saveFiles({
    relativePath,
    type,
    metadata,
    summary,
    rawContent,
  });

  console.log(`     Directory: ${directory}`);
  console.log(`     ✅ summary.md: ${fs.existsSync(markdownPath) ? `${fs.statSync(markdownPath).size} bytes` : "MISSING"}`);

  // Wait for PDF
  await new Promise(r => setTimeout(r, 2000));
  console.log(`     ${fs.existsSync(pdfPath) ? "✅" : "⚠️"} summary.pdf: ${fs.existsSync(pdfPath) ? `${fs.statSync(pdfPath).size} bytes` : "still generating..."}`);

  const rawFile = type === "youtube" ? "transcript.txt" : "full-text.txt";
  const rawPath = path.join(directory, rawFile);
  console.log(`     ${fs.existsSync(rawPath) ? "✅" : "⚠️"} ${rawFile}: ${fs.existsSync(rawPath) ? `${fs.statSync(rawPath).size} bytes` : "not saved (no content)"}`);

  // Step 6: Save to database
  console.log(`\n  5. Saving to database...`);
  const result = insertItem({
    url: normalized,
    type,
    title: metadata.title || null,
    author: metadata.author || metadata.channel || null,
    thumbnail: metadata.thumbnail || null,
    duration: null,
    publish_date: metadata.publishedTime || null,
    reading_time: metadata.readingTime || null,
    summary_preview: (summary.summary || "").substring(0, 200),
    file_path: relativePath,
    status: "complete",
    error_message: null,
  });

  const itemId = Number(result.lastInsertRowid);
  linkItemTags(itemId, allTags);

  const saved = getItemById(itemId);
  console.log(`     ✅ ID: ${saved.id}`);
  console.log(`     ✅ Tags: ${saved.tags.map(t => t.name).join(", ")}`);

  console.log(`\n  ✅ PIPELINE COMPLETE for "${metadata.title}"\n`);
  return true;
}

// Run tests
console.log("\n🚀 LINK SAVER — END-TO-END TEST\n");
console.log(`API Key: ${process.env.ANTHROPIC_API_KEY ? "✅ configured" : "❌ MISSING"}`);

if (!process.env.ANTHROPIC_API_KEY) {
  console.log("\n❌ Cannot run E2E test without ANTHROPIC_API_KEY in .env.local\n");
  process.exit(1);
}

let passed = 0;
let failed = 0;

for (const [label, url] of Object.entries(TEST_URLS)) {
  try {
    const ok = await testFullPipeline(label.toUpperCase(), url);
    if (ok) passed++; else failed++;
  } catch (err) {
    console.log(`  ❌ UNEXPECTED ERROR: ${err.message}\n`);
    failed++;
  }
}

console.log(`\n${"═".repeat(60)}`);
console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
console.log(`${"═".repeat(60)}\n`);

// Show final folder structure
console.log("📁 Final storage structure:");
function showTree(dir, prefix = "") {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
  entries.forEach((entry, i) => {
    const isLast = i === entries.length - 1;
    const connector = isLast ? "└── " : "├── ";
    const size = entry.isFile() ? ` (${(fs.statSync(path.join(dir, entry.name)).size / 1024).toFixed(1)}KB)` : "";
    console.log(`${prefix}${connector}${entry.name}${size}`);
    if (entry.isDirectory()) {
      showTree(path.join(dir, entry.name), prefix + (isLast ? "    " : "│   "));
    }
  });
}
showTree(path.join(process.cwd(), "storage", "saved"));
