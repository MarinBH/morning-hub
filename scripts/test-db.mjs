// Test: Database initialization + seed categories (Wheel of Life schema)
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "storage", "linksaver.db");
const WAL_PATH = DB_PATH + "-wal";
const SHM_PATH = DB_PATH + "-shm";

// Clean slate — remove old DB files so we test fresh schema creation
for (const f of [DB_PATH, WAL_PATH, SHM_PATH]) {
  if (fs.existsSync(f)) fs.unlinkSync(f);
}
console.log("🗑️  Cleared old test database");

// Dynamic import to trigger table creation + seed
const db = (await import("../lib/db.js")).default;
const {
  getPredefinedCategoryNames,
  getAllDomainsWithCategories,
  insertItem,
  findItemByUrl,
  linkItemCategories,
  getItemById,
  listItems,
} = await import("../lib/db.js");

// --- Test 1: Tables exist ---
const tables = db
  .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
  .all()
  .map((t) => t.name);
console.log("\n📋 Tables created:", tables.join(", "));
const expected = ["categories", "domains", "item_categories", "items"];
const missing = expected.filter((e) => !tables.includes(e));
if (missing.length) {
  console.log("❌ MISSING tables:", missing.join(", "));
} else {
  console.log("✅ All expected tables exist");
}

// --- Test 2: Domains + categories seeded ---
const domains = getAllDomainsWithCategories();
console.log(`\n🌐 Domains seeded (${domains.length}):`);
for (const d of domains) {
  console.log(`   ${d.name}: ${d.categories.length} categories`);
}
if (domains.length >= 8) {
  console.log("✅ Domain seed looks healthy");
} else {
  console.log("❌ Expected 8+ domains, got", domains.length);
}

const predefined = getPredefinedCategoryNames();
console.log(`\n🏷️  Total predefined categories: ${predefined.length}`);
if (predefined.length >= 20) {
  console.log("✅ Categories seeded successfully");
} else {
  console.log("❌ Expected 20+ predefined categories, got", predefined.length);
}

// --- Test 3: Insert + query cycle ---
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
  file_path: "tech-knowledge/ai-machine-learning/articles/test-article",
  status: "complete",
  error_message: null,
};

const result = insertItem(testItem);
const itemId = Number(result.lastInsertRowid);
console.log(`\n📝 Inserted test item, ID: ${itemId}`);

const found = findItemByUrl("https://example.com/test-article");
console.log("🔍 Found by URL:", found ? `✅ "${found.title}"` : "❌ not found");

// --- Test 4: Category linking ---
const categoryAssignments = [
  { domain: "Tech & Knowledge", category: "AI & Machine Learning" },
  { domain: "Personal Growth", category: "Learning Techniques" },
];
linkItemCategories(itemId, categoryAssignments);

const withCategories = getItemById(itemId);
const cats = withCategories?.categories?.map((c) => c.name) || [];
console.log("🏷️  Categories linked:", cats.length > 0 ? `✅ ${cats.join(", ")}` : "❌ none");

// --- Test 5: List + filter ---
const listed = listItems({ type: "article" });
console.log(`📋 listItems(type=article): ${listed.items.length} items, ${listed.total} total`);
if (listed.total >= 1) {
  console.log("✅ List query working");
} else {
  console.log("❌ Expected at least 1 item");
}

// --- Test 6: Duplicate detection ---
const dup = findItemByUrl("https://example.com/test-article");
console.log(`\n🔁 Duplicate detection: ${dup ? "✅ correctly found existing" : "❌ missed duplicate"}`);

const notFound = findItemByUrl("https://example.com/nonexistent");
console.log(`🔁 Non-duplicate: ${!notFound ? "✅ correctly returned null" : "❌ false positive"}`);

console.log("\n✅ Database tests complete!\n");
