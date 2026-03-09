// Test: YouTube + Article extractors with real URLs
import { extractYouTube, formatTranscriptText, formatTimestamp } from "../lib/extractors/youtube.js";
import { extractArticle } from "../lib/extractors/article.js";

async function testYouTube() {
  console.log("🎬 Testing YouTube Extractor\n");

  // Use a well-known video with captions
  const testUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

  try {
    console.log(`  Fetching: ${testUrl}`);
    const result = await extractYouTube(testUrl);

    console.log(`  ✅ Title: "${result.title}"`);
    console.log(`  ✅ Channel: "${result.channel}"`);
    console.log(`  ✅ Thumbnail: ${result.thumbnail ? "present" : "missing"}`);
    console.log(`  ✅ Video ID: ${result.videoId}`);
    console.log(`  ✅ Has Transcript: ${result.hasTranscript}`);

    if (result.hasTranscript && result.transcript.length > 0) {
      const fullText = formatTranscriptText(result.transcript);
      console.log(`  ✅ Transcript entries: ${result.transcript.length}`);
      console.log(`  ✅ Transcript length: ${fullText.length} chars`);
      console.log(`  ✅ First line: "${result.transcript[0].text}" at ${formatTimestamp(result.transcript[0].start)}`);
    } else {
      console.log(`  ⚠️  No transcript available (this is OK for some videos)`);
    }
  } catch (err) {
    console.log(`  ❌ YouTube extraction failed: ${err.message}`);
  }
}

async function testArticle() {
  console.log("\n📰 Testing Article Extractor\n");

  // Test with a simple, reliable article
  const testUrl = "https://example.com";

  try {
    console.log(`  Fetching: ${testUrl}`);
    const result = await extractArticle(testUrl);

    console.log(`  ${result.isPartial ? "⚠️" : "✅"} Title: "${result.title}"`);
    console.log(`  ✅ Site: "${result.siteName}"`);
    console.log(`  ✅ Author: "${result.author || "none"}"`);
    console.log(`  ✅ Reading time: ${result.readingTime || "n/a"} min`);
    console.log(`  ✅ Content length: ${result.textContent?.length || 0} chars`);
    console.log(`  ✅ Is partial: ${result.isPartial}`);

    if (result.excerpt) {
      console.log(`  ✅ Excerpt: "${result.excerpt.substring(0, 100)}..."`);
    }
  } catch (err) {
    console.log(`  ❌ Article extraction failed: ${err.message}`);
  }

  // Test with a more realistic article (Wikipedia is reliable)
  const wikiUrl = "https://en.wikipedia.org/wiki/Readability";
  try {
    console.log(`\n  Fetching: ${wikiUrl}`);
    const result = await extractArticle(wikiUrl);

    console.log(`  ${result.isPartial ? "⚠️" : "✅"} Title: "${result.title}"`);
    console.log(`  ✅ Content length: ${result.textContent?.length || 0} chars`);
    console.log(`  ✅ Reading time: ${result.readingTime || "n/a"} min`);
    console.log(`  ✅ Is partial: ${result.isPartial}`);
  } catch (err) {
    console.log(`  ❌ Wikipedia extraction failed: ${err.message}`);
  }
}

async function testEdgeCases() {
  console.log("\n🧪 Testing Edge Cases\n");

  // Invalid URL
  try {
    await extractArticle("not-a-real-url");
    console.log("  ❌ Should have thrown for invalid URL");
  } catch (err) {
    console.log(`  ✅ Invalid URL correctly throws: "${err.message.substring(0, 60)}..."`);
  }
}

console.log("═══════════════════════════════════════");
console.log("  EXTRACTOR TESTS");
console.log("═══════════════════════════════════════\n");

await testYouTube();
await testArticle();
await testEdgeCases();

console.log("\n✅ Extractor tests complete!\n");
