import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "storage", "linksaver.db");

function createDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      url TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT,
      author TEXT,
      thumbnail TEXT,
      duration TEXT,
      publish_date TEXT,
      reading_time INTEGER,
      summary_preview TEXT,
      file_path TEXT,
      status TEXT DEFAULT 'complete',
      error_message TEXT,
      personal_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      is_predefined INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS item_tags (
      item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
      tag_id INTEGER REFERENCES tags(id),
      PRIMARY KEY (item_id, tag_id)
    );

    CREATE INDEX IF NOT EXISTS idx_items_url ON items(url);
    CREATE INDEX IF NOT EXISTS idx_items_type ON items(type);
    CREATE INDEX IF NOT EXISTS idx_items_created ON items(created_at);
  `);

  // Seed default tags
  const defaultTags = [
    "Learning", "Tech/AI", "Career", "Health/Fitness", "Travel",
    "Cooking/Food", "Finance", "Productivity", "Entertainment",
    "Science", "Philosophy", "Business", "Design", "Relationships",
  ];

  const insertTag = db.prepare(
    "INSERT OR IGNORE INTO tags (name, slug, is_predefined) VALUES (?, ?, 1)"
  );

  const seedTags = db.transaction(() => {
    for (const tag of defaultTags) {
      const slug = tag.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      insertTag.run(tag, slug);
    }
  });
  seedTags();

  return db;
}

// Singleton pattern for Next.js hot reload
function getDb() {
  if (process.env.NODE_ENV === "production") {
    return createDb();
  }
  if (!globalThis.__linksaverDb) {
    globalThis.__linksaverDb = createDb();
  }
  return globalThis.__linksaverDb;
}

const db = getDb();

// Helper functions
export function findItemByUrl(url) {
  return db.prepare("SELECT * FROM items WHERE url = ?").get(url);
}

export function insertItem(item) {
  const stmt = db.prepare(`
    INSERT INTO items (url, type, title, author, thumbnail, duration, publish_date, reading_time, summary_preview, file_path, status, error_message)
    VALUES (@url, @type, @title, @author, @thumbnail, @duration, @publish_date, @reading_time, @summary_preview, @file_path, @status, @error_message)
  `);
  return stmt.run(item);
}

export function updateItem(id, fields) {
  const keys = Object.keys(fields);
  const sets = keys.map((k) => `${k} = @${k}`).join(", ");
  const stmt = db.prepare(`UPDATE items SET ${sets} WHERE id = @id`);
  return stmt.run({ id, ...fields });
}

export function getItemById(id) {
  const item = db.prepare("SELECT * FROM items WHERE id = ?").get(id);
  if (item) {
    item.tags = getTagsForItem(id);
  }
  return item;
}

export function listItems({ tag, type, search, page = 1, limit = 20 } = {}) {
  let where = [];
  let params = {};

  if (type) {
    where.push("i.type = @type");
    params.type = type;
  }
  if (search) {
    where.push("(i.title LIKE @search OR i.summary_preview LIKE @search)");
    params.search = `%${search}%`;
  }
  if (tag) {
    where.push("EXISTS (SELECT 1 FROM item_tags it JOIN tags t ON it.tag_id = t.id WHERE it.item_id = i.id AND t.slug = @tag)");
    params.tag = tag;
  }

  const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
  const offset = (page - 1) * limit;

  const items = db.prepare(`
    SELECT i.* FROM items i ${whereClause}
    ORDER BY i.created_at DESC
    LIMIT @limit OFFSET @offset
  `).all({ ...params, limit, offset });

  const total = db.prepare(`SELECT COUNT(*) as count FROM items i ${whereClause}`).get(params).count;

  // Attach tags to each item
  for (const item of items) {
    item.tags = getTagsForItem(item.id);
  }

  return { items, total, page, limit };
}

export function getTagsForItem(itemId) {
  return db.prepare(`
    SELECT t.id, t.name, t.slug FROM tags t
    JOIN item_tags it ON it.tag_id = t.id
    WHERE it.item_id = ?
  `).all(itemId);
}

export function getAllTags() {
  return db.prepare(`
    SELECT t.*, COUNT(it.item_id) as item_count
    FROM tags t
    LEFT JOIN item_tags it ON it.tag_id = t.id
    GROUP BY t.id
    ORDER BY item_count DESC, t.name ASC
  `).all();
}

export function getOrCreateTag(name) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const existing = db.prepare("SELECT * FROM tags WHERE slug = ?").get(slug);
  if (existing) return existing;

  const result = db.prepare("INSERT INTO tags (name, slug, is_predefined) VALUES (?, ?, 0)").run(name, slug);
  return { id: result.lastInsertRowid, name, slug, is_predefined: 0 };
}

export function linkItemTags(itemId, tagNames) {
  const linkTag = db.prepare("INSERT OR IGNORE INTO item_tags (item_id, tag_id) VALUES (?, ?)");
  const transaction = db.transaction((names) => {
    for (const name of names) {
      const tag = getOrCreateTag(name);
      linkTag.run(itemId, tag.id);
    }
  });
  transaction(tagNames);
}

export function getPredefinedTagNames() {
  return db.prepare("SELECT name FROM tags WHERE is_predefined = 1").all().map(t => t.name);
}

export default db;
