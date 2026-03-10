/**
 * Dual-mode database layer.
 * - Local dev: better-sqlite3 (SQLite file on disk)
 * - Production (Vercel): @libsql/client (Turso cloud)
 *
 * All exported functions are async regardless of backend.
 */

import path from "path";
import fs from "fs";

// ─── Wheel of Life Domains → Granular Categories ──────────────────────

export const DOMAINS_AND_CATEGORIES = {
  "Health & Fitness": [
    "Strength Workouts", "Strength Information", "Mobility Workouts",
    "Mobility Information", "Endurance Workouts", "Endurance Information",
    "Nutrition", "Supplements", "Mental Health", "Meditation & Mindfulness", "Sleep",
  ],
  "Career & Work": [
    "Job Search", "Leadership", "Networking",
    "Skills Development", "Side Projects", "Freelancing",
  ],
  "Finance & Wealth": [
    "Investing", "Budgeting", "Real Estate", "Crypto", "Tax & Legal",
  ],
  "Relationships & Social": [
    "Dating", "Communication", "Family", "Friendships", "Social Skills",
  ],
  "Personal Growth": [
    "Productivity", "Habits & Routines", "Philosophy",
    "Journaling", "Learning Techniques", "Books & Reading",
  ],
  "Fun & Recreation": [
    "Travel", "Cooking & Food", "Music", "Gaming", "Sports", "Hobbies",
  ],
  "Environment & Home": [
    "Home Organization", "Interior Design", "Sustainability", "Tech & Gadgets",
  ],
  "Tech & Knowledge": [
    "AI & Machine Learning", "Programming", "Science", "Design", "Data & Analytics",
  ],
};

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// ─── Schema ───────────────────────────────────────────────────────────

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    title TEXT,
    author TEXT,
    thumbnail TEXT,
    duration TEXT,
    publish_date TEXT,
    reading_time INTEGER,
    summary_preview TEXT,
    file_path TEXT,
    markdown_content TEXT,
    json_artifact TEXT,
    raw_content TEXT,
    status TEXT DEFAULT 'complete',
    error_message TEXT,
    personal_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS domains (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    domain_id INTEGER REFERENCES domains(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    is_predefined INTEGER DEFAULT 0,
    UNIQUE(domain_id, slug)
  );

  CREATE TABLE IF NOT EXISTS item_categories (
    item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (item_id, category_id)
  );

  CREATE TABLE IF NOT EXISTS item_topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    topic_type TEXT NOT NULL DEFAULT 'topic',
    UNIQUE(item_id, topic, topic_type)
  );

  CREATE TABLE IF NOT EXISTS item_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
    goal TEXT NOT NULL,
    relevance TEXT,
    UNIQUE(item_id, goal)
  );

  CREATE INDEX IF NOT EXISTS idx_items_url ON items(url);
  CREATE INDEX IF NOT EXISTS idx_items_type ON items(type);
  CREATE INDEX IF NOT EXISTS idx_items_created ON items(created_at);
  CREATE INDEX IF NOT EXISTS idx_items_type_created ON items(type, created_at);
  CREATE INDEX IF NOT EXISTS idx_categories_domain ON categories(domain_id);
  CREATE INDEX IF NOT EXISTS idx_item_topics_item ON item_topics(item_id);
  CREATE INDEX IF NOT EXISTS idx_item_topics_topic ON item_topics(topic);
  CREATE INDEX IF NOT EXISTS idx_item_topics_type ON item_topics(topic_type);
  CREATE INDEX IF NOT EXISTS idx_item_goals_item ON item_goals(item_id);
  CREATE INDEX IF NOT EXISTS idx_item_goals_goal ON item_goals(goal);
`;

// ─── Database Adapter Interface ───────────────────────────────────────
// Both adapters implement: execute(sql, args), batch(statements), close()
// execute returns: { rows: [...], rowsAffected, lastInsertRowid }

const USE_TURSO = !!process.env.TURSO_DATABASE_URL;

let _adapter = null;

async function getAdapter() {
  if (_adapter) return _adapter;

  if (USE_TURSO) {
    const { createClient } = await import("@libsql/client");
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    _adapter = {
      async execute(sql, args = []) {
        const result = await client.execute({ sql, args });
        return {
          rows: result.rows,
          rowsAffected: result.rowsAffected,
          lastInsertRowid: result.lastInsertRowid,
        };
      },
      async batch(statements) {
        const results = await client.batch(
          statements.map((s) => (typeof s === "string" ? s : { sql: s.sql, args: s.args || [] })),
          "write"
        );
        return results.map((r) => ({
          rows: r.rows,
          rowsAffected: r.rowsAffected,
          lastInsertRowid: r.lastInsertRowid,
        }));
      },
    };
  } else {
    // Local dev: better-sqlite3
    const Database = (await import("better-sqlite3")).default;
    const DB_PATH = path.join(process.cwd(), "storage", "linksaver.db");
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    let db;
    if (process.env.NODE_ENV === "production") {
      db = new Database(DB_PATH);
    } else {
      if (!globalThis.__linksaverDb) {
        globalThis.__linksaverDb = new Database(DB_PATH);
      }
      db = globalThis.__linksaverDb;
    }
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");

    _adapter = {
      async execute(sql, args = []) {
        const stmt = db.prepare(sql);
        if (sql.trim().toUpperCase().startsWith("SELECT") || sql.trim().toUpperCase().startsWith("WITH")) {
          const rows = stmt.all(...args);
          return { rows, rowsAffected: 0, lastInsertRowid: 0 };
        }
        const result = stmt.run(...args);
        return {
          rows: [],
          rowsAffected: result.changes,
          lastInsertRowid: Number(result.lastInsertRowid),
        };
      },
      async batch(statements) {
        const txn = db.transaction(() => {
          const results = [];
          for (const s of statements) {
            const sql = typeof s === "string" ? s : s.sql;
            const args = typeof s === "string" ? [] : (s.args || []);
            const stmt = db.prepare(sql);
            if (sql.trim().toUpperCase().startsWith("SELECT") || sql.trim().toUpperCase().startsWith("WITH")) {
              results.push({ rows: stmt.all(...args), rowsAffected: 0, lastInsertRowid: 0 });
            } else {
              const r = stmt.run(...args);
              results.push({ rows: [], rowsAffected: r.changes, lastInsertRowid: Number(r.lastInsertRowid) });
            }
          }
          return results;
        });
        return txn();
      },
    };
  }

  return _adapter;
}

// ─── Initialize schema + seed ─────────────────────────────────────────

let _initialized = false;

async function ensureInitialized() {
  if (_initialized) return;
  const adapter = await getAdapter();

  // Run schema as individual statements (batch for atomicity)
  const schemaStatements = SCHEMA_SQL
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => s + ";");

  // Execute schema statements one by one (CREATE IF NOT EXISTS is safe)
  for (const stmt of schemaStatements) {
    await adapter.execute(stmt);
  }

  // Seed domains and categories
  await seedDomainsAndCategories(adapter);
  _initialized = true;
}

async function seedDomainsAndCategories(adapter) {
  let order = 0;
  for (const [domainName, categories] of Object.entries(DOMAINS_AND_CATEGORIES)) {
    const domainSlug = slugify(domainName);
    await adapter.execute(
      "INSERT OR IGNORE INTO domains (name, slug, sort_order) VALUES (?, ?, ?)",
      [domainName, domainSlug, order++]
    );
    const { rows } = await adapter.execute("SELECT id FROM domains WHERE slug = ?", [domainSlug]);
    const domain = rows[0];
    if (domain) {
      for (const catName of categories) {
        await adapter.execute(
          "INSERT OR IGNORE INTO categories (domain_id, name, slug, is_predefined) VALUES (?, ?, ?, 1)",
          [domain.id, catName, slugify(catName)]
        );
      }
    }
  }
}

// ─── Helper: get adapter with init ────────────────────────────────────

async function db() {
  await ensureInitialized();
  return getAdapter();
}

// ─── Item helpers ─────────────────────────────────────────────────────

export async function findItemByUrl(url) {
  const adapter = await db();
  const { rows } = await adapter.execute("SELECT * FROM items WHERE url = ?", [url]);
  return rows[0] || null;
}

export async function insertItem(item) {
  const adapter = await db();
  const result = await adapter.execute(
    `INSERT INTO items (url, type, title, author, thumbnail, duration, publish_date, reading_time,
     summary_preview, file_path, markdown_content, json_artifact, raw_content, status, error_message)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      item.url, item.type, item.title, item.author, item.thumbnail,
      item.duration, item.publish_date, item.reading_time, item.summary_preview,
      item.file_path || null, item.markdown_content || null, item.json_artifact || null,
      item.raw_content || null, item.status, item.error_message,
    ]
  );
  return result;
}

const ALLOWED_UPDATE_COLUMNS = new Set([
  "personal_notes", "title", "author", "summary_preview", "status", "error_message",
  "markdown_content", "json_artifact", "raw_content",
]);

export async function updateItem(id, fields) {
  const adapter = await db();
  const keys = Object.keys(fields).filter((k) => ALLOWED_UPDATE_COLUMNS.has(k));
  if (keys.length === 0) return { rowsAffected: 0 };
  const sets = keys.map((k, i) => `${k} = ?`).join(", ");
  const values = keys.map((k) => fields[k]);
  return adapter.execute(`UPDATE items SET ${sets} WHERE id = ?`, [...values, id]);
}

export async function getItemById(id) {
  const adapter = await db();
  const { rows } = await adapter.execute("SELECT * FROM items WHERE id = ?", [id]);
  const item = rows[0] || null;
  if (item) {
    item.categories = await getCategoriesForItem(id);
    item.topics = await getTopicsForItem(id);
    item.goals = await getGoalsForItem(id);
  }
  return item;
}

export async function listItems({ category, domain, type, search, topic, concept, goal, page = 1, limit = 20 } = {}) {
  const adapter = await db();
  let where = [];
  let args = [];

  if (type) {
    where.push("i.type = ?");
    args.push(type);
  }
  if (search) {
    where.push("(i.title LIKE ? OR i.summary_preview LIKE ?)");
    const escaped = `%${search.replace(/%/g, "\\%").replace(/_/g, "\\_")}%`;
    args.push(escaped, escaped);
  }
  if (category) {
    where.push("EXISTS (SELECT 1 FROM item_categories ic JOIN categories c ON ic.category_id = c.id WHERE ic.item_id = i.id AND c.slug = ?)");
    args.push(category);
  }
  if (domain) {
    where.push("EXISTS (SELECT 1 FROM item_categories ic JOIN categories c ON ic.category_id = c.id JOIN domains d ON c.domain_id = d.id WHERE ic.item_id = i.id AND d.slug = ?)");
    args.push(domain);
  }
  if (topic) {
    where.push("EXISTS (SELECT 1 FROM item_topics it WHERE it.item_id = i.id AND it.topic = ? AND it.topic_type = 'topic')");
    args.push(topic);
  }
  if (concept) {
    where.push("EXISTS (SELECT 1 FROM item_topics it WHERE it.item_id = i.id AND it.topic = ? AND it.topic_type = 'concept')");
    args.push(concept);
  }
  if (goal) {
    where.push("EXISTS (SELECT 1 FROM item_goals ig WHERE ig.item_id = i.id AND ig.goal = ?)");
    args.push(goal);
  }

  const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
  const clampedLimit = Math.min(Math.max(1, limit), 100);
  const clampedPage = Math.max(1, page);
  const offset = (clampedPage - 1) * clampedLimit;

  const { rows: items } = await adapter.execute(
    `SELECT i.id, i.url, i.type, i.title, i.author, i.thumbnail, i.duration,
     i.publish_date, i.reading_time, i.summary_preview, i.file_path, i.status,
     i.error_message, i.personal_notes, i.created_at
     FROM items i ${whereClause}
     ORDER BY i.created_at DESC
     LIMIT ? OFFSET ?`,
    [...args, clampedLimit, offset]
  );

  const { rows: countRows } = await adapter.execute(
    `SELECT COUNT(*) as count FROM items i ${whereClause}`,
    args
  );
  const total = countRows[0]?.count || 0;

  // Batch-load relations for all items
  if (items.length > 0) {
    const ids = items.map((i) => i.id);
    const placeholders = ids.map(() => "?").join(",");

    const { rows: allCats } = await adapter.execute(
      `SELECT ic.item_id, c.id, c.name, c.slug, d.name as domain_name, d.slug as domain_slug
       FROM item_categories ic
       JOIN categories c ON ic.category_id = c.id
       JOIN domains d ON c.domain_id = d.id
       WHERE ic.item_id IN (${placeholders})
       ORDER BY d.sort_order, c.name`,
      ids
    );

    const { rows: allTopics } = await adapter.execute(
      `SELECT item_id, topic, topic_type FROM item_topics
       WHERE item_id IN (${placeholders})
       ORDER BY topic_type, topic`,
      ids
    );

    const { rows: allGoals } = await adapter.execute(
      `SELECT item_id, goal, relevance FROM item_goals
       WHERE item_id IN (${placeholders})
       ORDER BY goal`,
      ids
    );

    for (const item of items) {
      item.categories = allCats.filter((c) => c.item_id === item.id);
      item.topics_list = allTopics.filter((t) => t.item_id === item.id);
      item.goals_list = allGoals.filter((g) => g.item_id === item.id);
    }
  }

  return { items, total, page: clampedPage, limit: clampedLimit };
}

// ─── Category helpers ─────────────────────────────────────────────────

export async function getCategoriesForItem(itemId) {
  const adapter = await db();
  const { rows } = await adapter.execute(
    `SELECT c.id, c.name, c.slug, d.name as domain_name, d.slug as domain_slug
     FROM categories c
     JOIN item_categories ic ON ic.category_id = c.id
     JOIN domains d ON c.domain_id = d.id
     WHERE ic.item_id = ?
     ORDER BY d.sort_order, c.name`,
    [itemId]
  );
  return rows;
}

export async function getAllDomainsWithCategories() {
  const adapter = await db();
  const { rows } = await adapter.execute(
    `SELECT d.id as domain_id, d.name as domain_name, d.slug as domain_slug, d.sort_order,
     c.id as cat_id, c.name as cat_name, c.slug as cat_slug, c.is_predefined,
     COUNT(ic.item_id) as item_count
     FROM domains d
     LEFT JOIN categories c ON c.domain_id = d.id
     LEFT JOIN item_categories ic ON ic.category_id = c.id
     GROUP BY d.id, c.id
     ORDER BY d.sort_order, c.name`
  );

  // Group into domain objects
  const domainMap = new Map();
  for (const row of rows) {
    if (!domainMap.has(row.domain_id)) {
      domainMap.set(row.domain_id, {
        id: row.domain_id,
        name: row.domain_name,
        slug: row.domain_slug,
        sort_order: row.sort_order,
        categories: [],
      });
    }
    if (row.cat_id) {
      domainMap.get(row.domain_id).categories.push({
        id: row.cat_id,
        domain_id: row.domain_id,
        name: row.cat_name,
        slug: row.cat_slug,
        is_predefined: row.is_predefined,
        item_count: row.item_count,
      });
    }
  }
  return Array.from(domainMap.values());
}

export async function getOrCreateCategory(name, domainSlug) {
  const adapter = await db();
  const catSlug = slugify(name);

  if (domainSlug) {
    const { rows: existing } = await adapter.execute(
      `SELECT c.* FROM categories c JOIN domains d ON c.domain_id = d.id WHERE c.slug = ? AND d.slug = ?`,
      [catSlug, domainSlug]
    );
    if (existing[0]) return existing[0];

    const { rows: domainRows } = await adapter.execute("SELECT id FROM domains WHERE slug = ?", [domainSlug]);
    const domain = domainRows[0];
    if (domain) {
      await adapter.execute(
        "INSERT OR IGNORE INTO categories (domain_id, name, slug, is_predefined) VALUES (?, ?, ?, 0)",
        [domain.id, name, catSlug]
      );
      const { rows: newCat } = await adapter.execute(
        "SELECT * FROM categories WHERE domain_id = ? AND slug = ?",
        [domain.id, catSlug]
      );
      return newCat[0];
    }
  }

  const { rows: existing } = await adapter.execute("SELECT * FROM categories WHERE slug = ?", [catSlug]);
  if (existing[0]) return existing[0];

  const { rows: fallback } = await adapter.execute("SELECT id FROM domains WHERE slug = ?", ["personal-growth"]);
  const domainId = fallback[0]?.id || 1;
  await adapter.execute(
    "INSERT OR IGNORE INTO categories (domain_id, name, slug, is_predefined) VALUES (?, ?, ?, 0)",
    [domainId, name, catSlug]
  );
  const { rows: newCat } = await adapter.execute("SELECT * FROM categories WHERE slug = ?", [catSlug]);
  return newCat[0];
}

export async function linkItemCategories(itemId, categoryAssignments) {
  const adapter = await db();
  for (const assignment of categoryAssignments) {
    let cat;
    if (typeof assignment === "string") {
      cat = await getOrCreateCategory(assignment, null);
    } else {
      cat = await getOrCreateCategory(assignment.category, assignment.domain);
    }
    if (cat?.id) {
      await adapter.execute(
        "INSERT OR IGNORE INTO item_categories (item_id, category_id) VALUES (?, ?)",
        [itemId, cat.id]
      );
    }
  }
}

export async function addCategory(domainSlug, name) {
  const adapter = await db();
  const { rows: domainRows } = await adapter.execute("SELECT id FROM domains WHERE slug = ?", [domainSlug]);
  const domain = domainRows[0];
  if (!domain) throw new Error(`Domain "${domainSlug}" not found`);

  const catSlug = slugify(name);
  const result = await adapter.execute(
    "INSERT OR IGNORE INTO categories (domain_id, name, slug, is_predefined) VALUES (?, ?, ?, 0)",
    [domain.id, name, catSlug]
  );
  if (result.rowsAffected === 0) {
    const { rows } = await adapter.execute("SELECT * FROM categories WHERE domain_id = ? AND slug = ?", [domain.id, catSlug]);
    return rows[0];
  }
  return { id: result.lastInsertRowid, domain_id: domain.id, name, slug: catSlug };
}

export async function removeCategory(categoryId) {
  const adapter = await db();
  await adapter.execute("DELETE FROM item_categories WHERE category_id = ?", [categoryId]);
  await adapter.execute("DELETE FROM categories WHERE id = ? AND is_predefined = 0", [categoryId]);
}

export async function getPredefinedCategoryNames() {
  const adapter = await db();
  const { rows } = await adapter.execute(
    `SELECT c.name, d.name as domain_name
     FROM categories c JOIN domains d ON c.domain_id = d.id
     WHERE c.is_predefined = 1
     ORDER BY d.sort_order, c.name`
  );
  return rows;
}

// ─── Topic helpers ────────────────────────────────────────────────────

export async function linkItemTopics(itemId, topics, concepts) {
  const adapter = await db();
  for (const t of (topics || [])) {
    await adapter.execute(
      "INSERT OR IGNORE INTO item_topics (item_id, topic, topic_type) VALUES (?, ?, ?)",
      [itemId, t.toLowerCase(), "topic"]
    );
  }
  for (const c of (concepts || [])) {
    await adapter.execute(
      "INSERT OR IGNORE INTO item_topics (item_id, topic, topic_type) VALUES (?, ?, ?)",
      [itemId, c.toLowerCase(), "concept"]
    );
  }
}

export async function getTopicsForItem(itemId) {
  const adapter = await db();
  const { rows } = await adapter.execute(
    "SELECT topic, topic_type FROM item_topics WHERE item_id = ? ORDER BY topic_type, topic",
    [itemId]
  );
  return rows;
}

export async function getAllTopics() {
  const adapter = await db();
  const { rows } = await adapter.execute(
    `SELECT topic, topic_type, COUNT(DISTINCT item_id) as item_count
     FROM item_topics GROUP BY topic, topic_type
     ORDER BY item_count DESC, topic`
  );
  return rows;
}

// ─── Goal helpers ─────────────────────────────────────────────────────

export async function linkItemGoals(itemId, goals) {
  const adapter = await db();
  for (const g of (goals || [])) {
    const goal = typeof g === "string" ? g : g.goal;
    const relevance = typeof g === "string" ? null : (g.relevance || null);
    await adapter.execute(
      "INSERT OR IGNORE INTO item_goals (item_id, goal, relevance) VALUES (?, ?, ?)",
      [itemId, goal.toLowerCase(), relevance]
    );
  }
}

export async function getGoalsForItem(itemId) {
  const adapter = await db();
  const { rows } = await adapter.execute(
    "SELECT goal, relevance FROM item_goals WHERE item_id = ? ORDER BY goal",
    [itemId]
  );
  return rows;
}

export async function getAllGoals() {
  const adapter = await db();
  const { rows } = await adapter.execute(
    `SELECT goal, COUNT(DISTINCT item_id) as item_count
     FROM item_goals GROUP BY goal
     ORDER BY item_count DESC, goal`
  );
  return rows;
}
