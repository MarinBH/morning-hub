// Full E2E test: multiple URL types through the complete pipeline
import { config } from "dotenv";
config({ path: ".env.local" });

import { detectUrlType, normalizeUrl } from "../lib/extractors/detect.js";
import { extractYouTube, formatTranscriptText } from "../lib/extractors/youtube.js";
import { extractArticle } from "../lib/extractors/article.js";
import { summarizeContent } from "../lib/ai/summarize.js";
import { saveFiles, slugify } from "../lib/storage/files.js";
import { insertItem, linkItemCategories, getItemById, findItemByUrl, getAllDomainsWithCategories } from "../lib/db.js";
import fs from "fs";
import path from "path";

// ─── Test URLs ─────────────────────────────────────────────────────────
const TEST_URLS = [
  {
    label: "YouTube (standard desktop link)",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  },
  {
    label: "YouTube (mobile share link with tracking)",
    url: "https://youtu.be/dQw4w9WgXcQ?si=abc123tracking&feature=shared",
  },
  {
    label: "Article (Wikipedia - reliable, long content)",
    url: "https://en.wikipedia.org/wiki/Artificial_intelligence",
  },
  {
    label: "Article (simple page)",
    url: "https://example.com",
  },
];

const results = [];

async function testUrl(testCase) {
  const { label, url } = testCase;
  const result = { label, url, steps: {}, success: false };

  console.log(`\n${"─".repeat(60)}`);
  console.log(`  TEST: ${label}`);
  console.log(`  URL:  ${url}`);
  console.log(`${"─".repeat(60)}`);

  try {
    // Step 1: Normalize
    const normalized = normalizeUrl(url);
    result.steps.normalize = { ok: true, value: normalized };
    console.log(`  1. Normalize: ${url !== normalized ? `"${normalized}" (cleaned)` : "no change needed"}`);

    // Step 2: Detect type
    const type = detectUrlType(normalized);
    result.steps.detect = { ok: true, value: type };
    console.log(`  2. Detect: ${type}`);

    // Step 3: Duplicate check
    const existing = findItemByUrl(normalized);
    result.steps.duplicate = { ok: true, isDuplicate: !!existing };
    if (existing) {
      console.log(`  3. Duplicate: YES (ID ${existing.id}) — skipping`);
      result.skipped = true;
      result.success = true;
      results.push(result);
      return;
    }
    console.log(`  3. Duplicate: no`);

    // Step 4: Extract
    console.log(`  4. Extracting...`);
    let metadata, rawContent;

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
      result.steps.extract = {
        ok: true,
        title: data.title,
        channel: data.channel,
        hasTranscript: data.hasTranscript,
        transcriptChars: rawContent?.length || 0,
      };
      console.log(`     Title: "${data.title}"`);
      console.log(`     Channel: "${data.channel}"`);
      console.log(`     Transcript: ${data.hasTranscript ? `${rawContent.length} chars` : "NOT AVAILABLE"}`);
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
      result.steps.extract = {
        ok: true,
        title: data.title,
        author: data.author,
        contentChars: rawContent?.length || 0,
        isPartial: data.isPartial,
        readingTime: data.readingTime,
      };
      console.log(`     Title: "${data.title}"`);
      console.log(`     Content: ${rawContent?.length || 0} chars${data.isPartial ? " (PARTIAL)" : ""}`);
    }

    // Step 5: AI Summarize
    console.log(`  5. AI Summarizing...`);
    const aiStart = Date.now();
    let summary;
    try {
      summary = await summarizeContent(type, metadata, rawContent || "");
      const aiMs = Date.now() - aiStart;
      result.steps.ai = {
        ok: true,
        timeMs: aiMs,
        summaryLength: summary.summary?.length || 0,
        takeaways: summary.key_takeaways?.length || 0,
        advice: summary.actionable_advice?.length || 0,
        frameworks: summary.frameworks_and_analogies?.length || 0,
        quotes: summary.notable_quotes?.length || 0,
        categories: summary.categories || [],
      };
      console.log(`     Done in ${(aiMs / 1000).toFixed(1)}s`);
      console.log(`     Summary: ${summary.summary?.length || 0} chars`);
      console.log(`     Takeaways: ${summary.key_takeaways?.length || 0}`);
      console.log(`     Advice: ${summary.actionable_advice?.length || 0}`);
      console.log(`     Frameworks: ${summary.frameworks_and_analogies?.length || 0}`);
      console.log(`     Quotes: ${summary.notable_quotes?.length || 0}`);
      console.log(`     Categories: ${summary.categories?.map(c => `${c.domain} > ${c.category}`).join(", ") || "none"}`);
    } catch (err) {
      result.steps.ai = { ok: false, error: err.message };
      console.log(`     FAILED: ${err.message}`);
      summary = {
        summary: "AI failed.",
        key_takeaways: [],
        categories: [{ domain: "Personal Growth", category: "Learning Techniques" }],
      };
    }

    // Step 6: Save files
    console.log(`  6. Saving files...`);
    const categories = summary.categories || [{ domain: "Personal Growth", category: "Learning Techniques" }];
    const categoryPaths = categories.map(c => ({
      domainSlug: slugify(c.domain),
      categorySlug: slugify(c.category),
    }));

    const fileResult = saveFiles({
      categoryPaths,
      type,
      metadata,
      summary,
      rawContent,
    });

    result.steps.files = {
      ok: !!fileResult,
      primaryPath: fileResult?.relativePath,
      foldersCreated: categoryPaths.length,
    };
    console.log(`     Primary path: ${fileResult.relativePath}`);
    console.log(`     Filed in ${categoryPaths.length} category folder(s)`);

    // Step 7: Save to DB
    const dbResult = insertItem({
      url: normalized,
      type,
      title: metadata.title || null,
      author: metadata.author || metadata.channel || null,
      thumbnail: metadata.thumbnail || null,
      duration: null,
      publish_date: metadata.publishedTime || null,
      reading_time: metadata.readingTime || null,
      summary_preview: (summary.summary || "").substring(0, 200),
      file_path: fileResult.relativePath,
      status: result.steps.ai.ok ? "complete" : "partial",
      error_message: result.steps.ai.ok ? null : "AI failed",
    });

    const itemId = Number(dbResult.lastInsertRowid);
    linkItemCategories(itemId, categories);

    const saved = getItemById(itemId);
    result.steps.db = {
      ok: true,
      id: itemId,
      categoriesLinked: saved.categories?.length || 0,
    };
    console.log(`  7. DB: ID ${itemId}, ${saved.categories?.length || 0} categories linked`);

    result.success = true;
  } catch (err) {
    result.error = err.message;
    console.log(`\n  ❌ FAILED: ${err.message}`);
  }

  results.push(result);
}

// ─── Run ───────────────────────────────────────────────────────────────
console.log("╔══════════════════════════════════════════════════════════╗");
console.log("║     LINK SAVER — FULL END-TO-END TEST SUITE            ║");
console.log("╚══════════════════════════════════════════════════════════╝");
console.log(`\nAPI Key: ${process.env.ANTHROPIC_API_KEY ? "configured" : "MISSING"}`);
console.log(`Time: ${new Date().toISOString()}`);

for (const testCase of TEST_URLS) {
  await testUrl(testCase);
}

// ─── Summary ───────────────────────────────────────────────────────────
console.log(`\n${"═".repeat(60)}`);
console.log("  TEST RESULTS SUMMARY");
console.log(`${"═".repeat(60)}\n`);

for (const r of results) {
  const icon = r.success ? (r.skipped ? "⏭️" : "✅") : "❌";
  console.log(`${icon} ${r.label}`);
  if (r.skipped) {
    console.log(`   Skipped (duplicate of earlier test)`);
  } else if (r.success) {
    if (r.steps.ai?.ok) {
      console.log(`   AI: ${r.steps.ai.timeMs}ms | ${r.steps.ai.takeaways} takeaways | ${r.steps.ai.categories.map(c => c.category).join(", ")}`);
    }
    if (r.steps.files?.ok) {
      console.log(`   Files: ${r.steps.files.foldersCreated} folder(s) | ${r.steps.files.primaryPath}`);
    }
  } else {
    console.log(`   Error: ${r.error || r.steps.ai?.error || "unknown"}`);
  }
}

// Show folder structure
console.log(`\n📁 Storage structure:`);
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

// Show DB domain counts
console.log(`\n🏷️  Domain/Category usage:`);
const domains = getAllDomainsWithCategories();
for (const d of domains) {
  const used = d.categories.filter(c => c.item_count > 0);
  if (used.length > 0) {
    console.log(`  ${d.name}:`);
    for (const c of used) {
      console.log(`    ${c.name}: ${c.item_count} item(s)`);
    }
  }
}

const passed = results.filter(r => r.success).length;
const failed = results.filter(r => !r.success).length;
console.log(`\n${"═".repeat(60)}`);
console.log(`  TOTAL: ${passed} passed, ${failed} failed`);
console.log(`${"═".repeat(60)}\n`);

// Write JSON results for analysis
fs.writeFileSync("storage/test-results.json", JSON.stringify(results, null, 2));
console.log("Detailed results saved to storage/test-results.json\n");
