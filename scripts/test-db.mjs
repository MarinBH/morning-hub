// Test: Database initialization + seed tags
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "storage", "linksaver.db");

// Clean slate
if (fs.existsSync(DB_PATH)) {
  fs.unlinkSync(DB_PATH);
  console.log("🗑️  Removed old test database");
}

// Dynamic import to trigger table creation
const db = (await import("../lib/db.js")).default;

// Test 1: Tables exist
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
console.log("\n📋 Tables created:", tables.map(t => t.name).join(", "));
const expected = ["item_tags", "items", "tags"];
const missing = expected.filter(e => !tables.find(t => t.name === e));
if (missing.length) {
  console.log("❌ MISSING tables:", missing.join(", "));
} else {
  console.log("✅ All expected tables exist");
}

// Test 2: Default tags seeded
const { getPredefinedTagNames, getAllTags } = await import("../lib/db.js");
const predefined = getPredefinedTagNames();
console.log(`\n🏷️  Predefined tags (${predefined.length}):`, predefined.join(", "));
if (predefined.length >= 10) {
  console.log("✅ Tags seeded successfully");
} else {
  console.log("❌ Expected at least 10 predefined tags, got", predefined.length);
}

// Test 3: Insert + query cycle
const { insertItem, findItemByUrl, linkItemTags, getItemById, listItems } = await import("../lib/db.js");

const testItem = {
  url: "https://example.com/test-article",
  type: "article",
  title: "Test Article Title",
  author: "Test Author",
  thumbnail: null,
  duration: null,
  publish_date: "2024-01-15",
  reading_time: 5,
  summary_preview: "This is a test summary preview text.",
  file_path: "learning/articles/test-article",
  status: "complete",
  error_message: null,
};

const result = insertItem(testItem);
console.log(`\n📝 Inserted test item, ID: ${result.lastInsertRowid}`);

const found = findItemByUrl("https://example.com/test-article");
console.log("🔍 Found by URL:", found ? `✅ "${found.title}"` : "❌ not found");

linkItemTags(Number(result.lastInsertRowid), ["Learning", "Tech/AI", "New Custom Tag"]);
const withTags = getItemById(Number(result.lastInsertRowid));
console.log("🏷️  Tags linked:", withTags.tags?.map(t => t.name).join(", ") || "none");

const listed = listItems({ type: "article" });
console.log(`📋 List items (type=article): ${listed.items.length} items, ${listed.total} total`);

// Test 4: Tag counts
const allTags = getAllTags();
const tagsWithItems = allTags.filter(t => t.item_count > 0);
console.log(`🏷️  Tags with items: ${tagsWithItems.map(t => `${t.name}(${t.item_count})`).join(", ")}`);

// Test 5: Duplicate detection
const dup = findItemByUrl("https://example.com/test-article");
console.log(`\n🔁 Duplicate detection: ${dup ? "✅ correctly found existing" : "❌ missed duplicate"}`);

const notFound = findItemByUrl("https://example.com/nonexistent");
console.log(`🔁 Non-duplicate: ${!notFound ? "✅ correctly returned null" : "❌ false positive"}`);

console.log("\n✅ Database tests complete!\n");
