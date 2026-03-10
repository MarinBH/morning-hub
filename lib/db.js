import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "storage", "linksaver.db");

// ─── Wheel of Life Domains → Granular Categories ──────────────────────
// Domains are the top-level Wheel of Life dimensions.
// Categories are granular, editable sub-categories within each domain.
// Users can add/remove categories at any time.

export const DOMAINS_AND_CATEGORIES = {
  "Health & Fitness": [
    "Strength Workouts",
    "Strength Information",
    "Mobility Workouts",
    "Mobility Information",
    "Endurance Workouts",
    "Endurance Information",
    "Nutrition",
    "Supplements",
    "Mental Health",
    "Meditation & Mindfulness",
    "Sleep",
  ],
  "Career & Work": [
    "Job Search",
    "Leadership",
    "Networking",
    "Skills Development",
    "Side Projects",
    "Freelancing",
  ],
  "Finance & Wealth": [
    "Investing",
    "Budgeting",
    "Real Estate",
    "Crypto",
    "Tax & Legal",
  ],
  "Relationships & Social": [
    "Dating",
    "Communication",
    "Family",
    "Friendships",
    "Social Skills",
  ],
  "Personal Growth": [
    "Productivity",
    "Habits & Routines",
    "Philosophy",
    "Journaling",
    "Learning Techniques",
    "Books & Reading",
  ],
  "Fun & Recreation": [
    "Travel",
    "Cooking & Food",
    "Music",
    "Gaming",
    "Sports",
    "Hobbies",
  ],
  "Environment & Home": [
    "Home Organization",
    "Interior Design",
    "Sustainability",
    "Tech & Gadgets",
  ],
  "Tech & Knowledge": [
    "AI & Machine Learning",
    "Programming",
    "Science",
    "Design",
    "Data & Analytics",
  ],
};

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
    CREATE INDEX IF NOT EXISTS idx_categories_domain ON categories(domain_id);
    CREATE INDEX IF NOT EXISTS idx_item_topics_item ON item_topics(item_id);
    CREATE INDEX IF NOT EXISTS idx_item_topics_topic ON item_topics(topic);
    CREATE INDEX IF NOT EXISTS idx_item_topics_type ON item_topics(topic_type);
    CREATE INDEX IF NOT EXISTS idx_item_goals_item ON item_goals(item_id);
    CREATE INDEX IF NOT EXISTS idx_item_goals_goal ON item_goals(goal);
  `);

  // Seed domains and categories
  seedDomainsAndCategories(db);

  return db;
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function seedDomainsAndCategories(db) {
  const insertDomain = db.prepare(
    "INSERT OR IGNORE INTO domains (name, slug, sort_order) VALUES (?, ?, ?)"
  );
  const insertCategory = db.prepare(
    "INSERT OR IGNORE INTO categories (domain_id, name, slug, is_predefined) VALUES (?, ?, ?, 1)"
  );
  const getDomain = db.prepare("SELECT id FROM domains WHERE slug = ?");

  const seed = db.transaction(() => {
    let order = 0;
    for (const [domainName, categories] of Object.entries(DOMAINS_AND_CATEGORIES)) {
      const domainSlug = slugify(domainName);
      insertDomain.run(domainName, domainSlug, order++);
      const domain = getDomain.get(domainSlug);
      if (domain) {
        for (const catName of categories) {
          insertCategory.run(domain.id, catName, slugify(catName));
        }
      }
    }
  });
  seed();
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

// ─── Item helpers ──────────────────────────────────────────────────────

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
    item.categories = getCategoriesForItem(id);
    item.topics = getTopicsForItem(id);
    item.goals = getGoalsForItem(id);
  }
  return item;
}

export function listItems({ category, domain, type, search, topic, concept, goal, page = 1, limit = 20 } = {}) {
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
  if (category) {
    where.push("EXISTS (SELECT 1 FROM item_categories ic JOIN categories c ON ic.category_id = c.id WHERE ic.item_id = i.id AND c.slug = @category)");
    params.category = category;
  }
  if (domain) {
    where.push("EXISTS (SELECT 1 FROM item_categories ic JOIN categories c ON ic.category_id = c.id JOIN domains d ON c.domain_id = d.id WHERE ic.item_id = i.id AND d.slug = @domain)");
    params.domain = domain;
  }
  if (topic) {
    where.push("EXISTS (SELECT 1 FROM item_topics it WHERE it.item_id = i.id AND it.topic = @topic AND it.topic_type = 'topic')");
    params.topic = topic;
  }
  if (concept) {
    where.push("EXISTS (SELECT 1 FROM item_topics it WHERE it.item_id = i.id AND it.topic = @concept AND it.topic_type = 'concept')");
    params.concept = concept;
  }
  if (goal) {
    where.push("EXISTS (SELECT 1 FROM item_goals ig WHERE ig.item_id = i.id AND ig.goal = @goal)");
    params.goal = goal;
  }

  const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";
  const offset = (page - 1) * limit;

  const items = db.prepare(`
    SELECT i.* FROM items i ${whereClause}
    ORDER BY i.created_at DESC
    LIMIT @limit OFFSET @offset
  `).all({ ...params, limit, offset });

  const total = db.prepare(`SELECT COUNT(*) as count FROM items i ${whereClause}`).get(params).count;

  for (const item of items) {
    item.categories = getCategoriesForItem(item.id);
    item.topics_list = getTopicsForItem(item.id);
    item.goals_list = getGoalsForItem(item.id);
  }

  return { items, total, page, limit };
}

// ─── Category helpers ──────────────────────────────────────────────────

export function getCategoriesForItem(itemId) {
  return db.prepare(`
    SELECT c.id, c.name, c.slug, d.name as domain_name, d.slug as domain_slug
    FROM categories c
    JOIN item_categories ic ON ic.category_id = c.id
    JOIN domains d ON c.domain_id = d.id
    WHERE ic.item_id = ?
    ORDER BY d.sort_order, c.name
  `).all(itemId);
}

export function getAllDomainsWithCategories() {
  const domains = db.prepare("SELECT * FROM domains ORDER BY sort_order").all();
  for (const domain of domains) {
    domain.categories = db.prepare(`
      SELECT c.*, COUNT(ic.item_id) as item_count
      FROM categories c
      LEFT JOIN item_categories ic ON ic.category_id = c.id
      WHERE c.domain_id = ?
      GROUP BY c.id
      ORDER BY c.name
    `).all(domain.id);
  }
  return domains;
}

export function getAllCategoriesFlat() {
  return db.prepare(`
    SELECT c.*, d.name as domain_name, d.slug as domain_slug, COUNT(ic.item_id) as item_count
    FROM categories c
    JOIN domains d ON c.domain_id = d.id
    LEFT JOIN item_categories ic ON ic.category_id = c.id
    GROUP BY c.id
    ORDER BY d.sort_order, c.name
  `).all();
}

export function getOrCreateCategory(name, domainSlug) {
  const catSlug = slugify(name);

  // If domain specified, look in that domain
  if (domainSlug) {
    const existing = db.prepare(`
      SELECT c.* FROM categories c JOIN domains d ON c.domain_id = d.id
      WHERE c.slug = ? AND d.slug = ?
    `).get(catSlug, domainSlug);
    if (existing) return existing;

    const domain = db.prepare("SELECT id FROM domains WHERE slug = ?").get(domainSlug);
    if (domain) {
      const result = db.prepare("INSERT OR IGNORE INTO categories (domain_id, name, slug, is_predefined) VALUES (?, ?, ?, 0)").run(domain.id, name, catSlug);
      if (result.changes > 0) {
        return { id: result.lastInsertRowid, name, slug: catSlug, domain_id: domain.id };
      }
      // If INSERT OR IGNORE didn't insert (already exists), fetch it
      return db.prepare("SELECT * FROM categories WHERE domain_id = ? AND slug = ?").get(domain.id, catSlug);
    }
  }

  // Try to find in any domain
  const existing = db.prepare("SELECT * FROM categories WHERE slug = ?").get(catSlug);
  if (existing) return existing;

  // Put in first matching domain or "Personal Growth" as fallback
  const fallbackDomain = db.prepare("SELECT id FROM domains WHERE slug = ?").get("personal-growth");
  const domainId = fallbackDomain?.id || 1;
  const result = db.prepare("INSERT OR IGNORE INTO categories (domain_id, name, slug, is_predefined) VALUES (?, ?, ?, 0)").run(domainId, name, catSlug);
  return { id: result.lastInsertRowid || db.prepare("SELECT id FROM categories WHERE slug = ?").get(catSlug).id, name, slug: catSlug };
}

export function linkItemCategories(itemId, categoryAssignments) {
  // categoryAssignments: array of { category: "Strength Workouts", domain: "health-fitness" }
  // or just strings: ["Strength Workouts", "Nutrition"]
  const linkCat = db.prepare("INSERT OR IGNORE INTO item_categories (item_id, category_id) VALUES (?, ?)");
  const transaction = db.transaction((assignments) => {
    for (const assignment of assignments) {
      let cat;
      if (typeof assignment === "string") {
        cat = getOrCreateCategory(assignment, null);
      } else {
        cat = getOrCreateCategory(assignment.category, assignment.domain);
      }
      if (cat?.id) {
        linkCat.run(itemId, cat.id);
      }
    }
  });
  transaction(categoryAssignments);
}

export function addCategory(domainSlug, name) {
  const domain = db.prepare("SELECT id FROM domains WHERE slug = ?").get(domainSlug);
  if (!domain) throw new Error(`Domain "${domainSlug}" not found`);

  const catSlug = slugify(name);
  const result = db.prepare("INSERT OR IGNORE INTO categories (domain_id, name, slug, is_predefined) VALUES (?, ?, ?, 0)").run(domain.id, name, catSlug);
  if (result.changes === 0) {
    return db.prepare("SELECT * FROM categories WHERE domain_id = ? AND slug = ?").get(domain.id, catSlug);
  }
  return { id: result.lastInsertRowid, domain_id: domain.id, name, slug: catSlug };
}

export function removeCategory(categoryId) {
  db.prepare("DELETE FROM item_categories WHERE category_id = ?").run(categoryId);
  db.prepare("DELETE FROM categories WHERE id = ? AND is_predefined = 0").run(categoryId);
}

export function getPredefinedCategoryNames() {
  return db.prepare(`
    SELECT c.name, d.name as domain_name
    FROM categories c JOIN domains d ON c.domain_id = d.id
    WHERE c.is_predefined = 1
    ORDER BY d.sort_order, c.name
  `).all();
}

// ─── Topic helpers ───────────────────────────────────────────────────

export function linkItemTopics(itemId, topics, concepts) {
  const insertTopic = db.prepare(
    "INSERT OR IGNORE INTO item_topics (item_id, topic, topic_type) VALUES (?, ?, ?)"
  );
  const transaction = db.transaction(() => {
    for (const t of (topics || [])) {
      insertTopic.run(itemId, t.toLowerCase(), "topic");
    }
    for (const c of (concepts || [])) {
      insertTopic.run(itemId, c.toLowerCase(), "concept");
    }
  });
  transaction();
}

export function getTopicsForItem(itemId) {
  return db.prepare(
    "SELECT topic, topic_type FROM item_topics WHERE item_id = ? ORDER BY topic_type, topic"
  ).all(itemId);
}

export function getAllTopics() {
  return db.prepare(`
    SELECT topic, topic_type, COUNT(DISTINCT item_id) as item_count
    FROM item_topics
    GROUP BY topic, topic_type
    ORDER BY item_count DESC, topic
  `).all();
}

// ─── Goal helpers ────────────────────────────────────────────────────

export function linkItemGoals(itemId, goals) {
  const insertGoal = db.prepare(
    "INSERT OR IGNORE INTO item_goals (item_id, goal, relevance) VALUES (?, ?, ?)"
  );
  const transaction = db.transaction(() => {
    for (const g of (goals || [])) {
      const goal = typeof g === "string" ? g : g.goal;
      const relevance = typeof g === "string" ? null : (g.relevance || null);
      insertGoal.run(itemId, goal.toLowerCase(), relevance);
    }
  });
  transaction();
}

export function getGoalsForItem(itemId) {
  return db.prepare(
    "SELECT goal, relevance FROM item_goals WHERE item_id = ? ORDER BY goal"
  ).all(itemId);
}

export function getAllGoals() {
  return db.prepare(`
    SELECT goal, COUNT(DISTINCT item_id) as item_count
    FROM item_goals
    GROUP BY goal
    ORDER BY item_count DESC, goal
  `).all();
}

export default db;
