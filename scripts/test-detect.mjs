// Test: URL type detection + video ID extraction + mobile URL normalization
import { detectUrlType, extractYouTubeVideoId, isValidUrl, normalizeUrl } from "../lib/extractors/detect.js";

const tests = [
  // Desktop YouTube URLs
  { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", expectType: "youtube", expectId: "dQw4w9WgXcQ" },
  { url: "https://youtu.be/dQw4w9WgXcQ", expectType: "youtube", expectId: "dQw4w9WgXcQ" },
  { url: "https://youtube.com/shorts/abc123def45", expectType: "youtube", expectId: "abc123def45" },
  { url: "https://www.youtube.com/embed/dQw4w9WgXcQ", expectType: "youtube", expectId: "dQw4w9WgXcQ" },
  { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=120", expectType: "youtube", expectId: "dQw4w9WgXcQ" },

  // MOBILE YouTube URLs (from phone share)
  { url: "https://m.youtube.com/watch?v=dQw4w9WgXcQ", expectType: "youtube", expectId: "dQw4w9WgXcQ" },
  { url: "https://m.youtube.com/shorts/abc123def45", expectType: "youtube", expectId: "abc123def45" },
  { url: "https://youtu.be/dQw4w9WgXcQ?si=abc123tracking", expectType: "youtube", expectId: "dQw4w9WgXcQ" },

  // Live streams
  { url: "https://www.youtube.com/live/abc123def45", expectType: "youtube", expectId: "abc123def45" },

  // YouTube with tracking params (from share button)
  { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ&si=ENP4k9wz&feature=shared", expectType: "youtube", expectId: "dQw4w9WgXcQ" },

  // Article URLs
  { url: "https://example.com/article", expectType: "article", expectId: null },
  { url: "https://medium.com/@user/some-post-abc123", expectType: "article", expectId: null },
  { url: "https://nytimes.com/2024/01/15/technology/ai.html", expectType: "article", expectId: null },
  { url: "https://arxiv.org/abs/2401.12345", expectType: "article", expectId: null },
];

console.log("🔍 URL Type Detection Tests\n");

let passed = 0;
let failed = 0;

for (const test of tests) {
  const type = detectUrlType(test.url);
  const id = extractYouTubeVideoId(test.url);

  const typeOk = type === test.expectType;
  const idOk = id === test.expectId;

  if (typeOk && idOk) {
    console.log(`  ✅ ${test.url}`);
    console.log(`     type=${type}, id=${id || "n/a"}`);
    passed++;
  } else {
    console.log(`  ❌ ${test.url}`);
    if (!typeOk) console.log(`     type: expected "${test.expectType}", got "${type}"`);
    if (!idOk) console.log(`     id: expected "${test.expectId}", got "${id}"`);
    failed++;
  }
}

// URL normalization tests
console.log("\n🔄 URL Normalization Tests\n");
const normalizeTests = [
  {
    input: "https://m.youtube.com/watch?v=dQw4w9WgXcQ",
    expected: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    desc: "Mobile → desktop",
  },
  {
    input: "https://youtu.be/dQw4w9WgXcQ?si=abc123&feature=shared",
    expected: "https://youtu.be/dQw4w9WgXcQ",
    desc: "Strip tracking params",
  },
  {
    input: "https://example.com/article?utm_source=twitter&utm_medium=social",
    expected: "https://example.com/article",
    desc: "Strip UTM params from article",
  },
  {
    input: "  https://example.com/  ",
    expected: "https://example.com/",
    desc: "Trim whitespace",
  },
];

for (const test of normalizeTests) {
  const result = normalizeUrl(test.input);
  const ok = result === test.expected;
  console.log(`  ${ok ? "✅" : "❌"} ${test.desc}`);
  if (!ok) {
    console.log(`     Input:    ${test.input}`);
    console.log(`     Expected: ${test.expected}`);
    console.log(`     Got:      ${result}`);
  }
  if (ok) passed++; else failed++;
}

// URL validation tests
console.log("\n🔗 URL Validation Tests\n");
const validTests = [
  { url: "https://example.com", expect: true },
  { url: "http://example.com", expect: true },
  { url: "not-a-url", expect: false },
  { url: "ftp://example.com", expect: false },
  { url: "", expect: false },
];

for (const test of validTests) {
  const result = isValidUrl(test.url);
  const ok = result === test.expect;
  console.log(`  ${ok ? "✅" : "❌"} "${test.url || "(empty)"}" → ${result} (expected ${test.expect})`);
  if (ok) passed++; else failed++;
}

console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
