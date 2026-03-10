import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "storage", "linksaver.db");
const STORAGE_ROOT = path.join(process.cwd(), "storage", "saved");
const dir = path.dirname(DB_PATH);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").substring(0, 60).replace(/(^-|-$)/g, "");
}

// Create schema (matches lib/db.js)
db.exec(`
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
`);

// Seed domains and categories
const DOMAINS_AND_CATEGORIES = {
  "Health & Fitness": ["Strength Workouts", "Strength Information", "Mobility Workouts", "Mobility Information", "Endurance Workouts", "Endurance Information", "Nutrition", "Supplements", "Mental Health", "Meditation & Mindfulness", "Sleep"],
  "Career & Work": ["Job Search", "Leadership", "Networking", "Skills Development", "Side Projects", "Freelancing"],
  "Finance & Wealth": ["Investing", "Budgeting", "Real Estate", "Crypto", "Tax & Legal"],
  "Relationships & Social": ["Dating", "Communication", "Family", "Friendships", "Social Skills"],
  "Personal Growth": ["Productivity", "Habits & Routines", "Philosophy", "Journaling", "Learning Techniques", "Books & Reading"],
  "Fun & Recreation": ["Travel", "Cooking & Food", "Music", "Gaming", "Sports", "Hobbies"],
  "Environment & Home": ["Home Organization", "Interior Design", "Sustainability", "Tech & Gadgets"],
  "Tech & Knowledge": ["AI & Machine Learning", "Programming", "Science", "Design", "Data & Analytics"],
};

let order = 0;
for (const [domainName, categories] of Object.entries(DOMAINS_AND_CATEGORIES)) {
  const domainSlug = slugify(domainName);
  db.prepare("INSERT OR IGNORE INTO domains (name, slug, sort_order) VALUES (?, ?, ?)").run(domainName, domainSlug, order++);
  const domain = db.prepare("SELECT id FROM domains WHERE slug = ?").get(domainSlug);
  if (domain) {
    for (const catName of categories) {
      db.prepare("INSERT OR IGNORE INTO categories (domain_id, name, slug, is_predefined) VALUES (?, ?, ?, 1)").run(domain.id, catName, slugify(catName));
    }
  }
}

// Delete existing test data
db.exec("DELETE FROM item_goals");
db.exec("DELETE FROM item_topics");
db.exec("DELETE FROM item_categories");
db.exec("DELETE FROM items");

// Remove existing saved files (except the failed YouTube test)
if (fs.existsSync(STORAGE_ROOT)) {
  fs.rmSync(STORAGE_ROOT, { recursive: true });
  fs.mkdirSync(STORAGE_ROOT, { recursive: true });
}

const testItems = [
  {
    url: "https://www.youtube.com/watch?v=jNQXAC9IVRw",
    type: "youtube",
    title: "The Science of Sleep: How to Optimize Your Rest for Peak Performance",
    author: "Andrew Huberman",
    thumbnail: "https://i.ytimg.com/vi/jNQXAC9IVRw/hqdefault.jpg",
    duration: "2:14:32",
    categories: [
      { domain: "Health & Fitness", category: "Sleep" },
      { domain: "Personal Growth", category: "Habits & Routines" },
    ],
    topics: ["sleep optimization", "circadian rhythm", "melatonin", "light exposure", "sleep architecture", "napping"],
    concepts: ["hormesis", "circadian biology", "dose-response relationship", "homeostatic regulation"],
    goals: [
      { goal: "improve sleep quality", relevance: "Provides evidence-based protocols for falling asleep faster and achieving deeper sleep stages" },
      { goal: "increase daily energy", relevance: "Better sleep directly improves waking alertness and cognitive performance" },
      { goal: "build healthy habits", relevance: "Morning light exposure and evening wind-down routines compound over time" },
    ],
    summary: {
      author_description: "Stanford neuroscientist and tenured professor specializing in neural circuits controlling vision, stress, and sleep-wake cycles",
      tldr: "Strategic light exposure, temperature manipulation, and supplement timing can increase deep sleep by 30-40% within two weeks.",
      core_thesis: "Sleep quality matters more than sleep quantity, and it's primarily controlled by two systems: the circadian clock (driven by light) and the adenosine sleep pressure system. By strategically managing light exposure (bright light within 30 minutes of waking, minimal light after 8pm), body temperature (cool sleeping environment, warm shower 90 minutes before bed), and key supplements (magnesium threonate, apigenin, theanine), you can dramatically improve sleep architecture — specifically increasing Stage 3-4 deep sleep and REM sleep — without pharmaceutical intervention.",
      key_takeaways: [
        "Get bright light exposure (ideally sunlight) within 30 minutes of waking — this sets your cortisol peak and starts the 16-hour countdown to melatonin release",
        "Keep bedroom temperature between 65-68°F (18-20°C) — core body temperature must drop 2-3°F to initiate sleep",
        "The 'warm shower before bed' trick works because the subsequent cooling triggers the body's natural temperature drop",
        "Magnesium threonate (145mg) crosses the blood-brain barrier and enhances GABA activity, promoting deeper sleep",
        "Alcohol may help you fall asleep but fragments sleep architecture — even 2 drinks reduce REM sleep by 25%",
        "Non-sleep deep rest (NSDR) protocols for 10-20 minutes can restore missed sleep benefits and accelerate learning consolidation",
        "Consistent wake time is more important than consistent bedtime — anchor your circadian rhythm from the morning side"
      ],
      difficulty: "intermediate",
      content_format: "explainer",
      actions: [
        { action: "Get 10+ minutes of bright outdoor light within 30 minutes of waking every morning", rationale: "Triggers cortisol pulse that sets your circadian clock and initiates the ~16 hour timer to melatonin onset. Even on cloudy days, outdoor light is 10-50x brighter than indoor light." },
        { action: "Take 145mg magnesium threonate and 50mg apigenin 30-60 minutes before bed", rationale: "Magnesium threonate specifically crosses the blood-brain barrier (unlike other forms) and enhances GABAergic transmission. Apigenin is a chamomile derivative that reduces anxiety without sedation." },
        { action: "Set bedroom temperature to 65-68°F and use breathable bedding", rationale: "Core body temperature must drop 2-3°F for sleep initiation. Cool ambient temperature accelerates this process and increases time spent in deep sleep stages." },
        { action: "Practice a 10-minute NSDR protocol (YouTube: 'Huberman NSDR') after poor sleep nights", rationale: "Non-sleep deep rest accelerates dopamine restoration by 65% and partially compensates for lost deep sleep benefits including memory consolidation." },
      ],
      quotes_and_examples: [
        { text: "The best predictor of your sleep quality tonight is what you did in the first hour after waking this morning. Light is the primary zeitgeber — the time-giver — for every cell in your body.", attribution: "Andrew Huberman (12:34)", source_type: "quote", theme: "preparation", topic: "circadian rhythm" },
        { text: "A single night of poor sleep reduces natural killer cell activity by 70%. This isn't cumulative — it happens after ONE bad night. Your immune system is essentially blind to cancer cells when you're sleep deprived.", attribution: "Andrew Huberman citing Matt Walker's research (45:22)", source_type: "data-point", theme: "consequences", topic: "sleep deprivation" },
        { text: "Think of adenosine like a parking meter. Every hour you're awake, another coin drops in. When the meter fills up, you feel the urge to sleep. Caffeine doesn't remove the coins — it just puts a cover over the meter so you can't see how full it is.", attribution: "Andrew Huberman (28:15)", source_type: "analogy", theme: "mechanism", topic: "caffeine and sleep" },
        { text: "Navy SEALs use NSDR protocols in the field — 10 minutes of guided relaxation that can restore 60-70% of the cognitive benefits lost from a night of missed sleep.", attribution: "Andrew Huberman (1:32:10)", source_type: "example", theme: "resilience", topic: "non-sleep deep rest" },
      ],
      frameworks: [
        { name: "The Two-Process Sleep Model", description: "Sleep is governed by two independent systems: Process C (circadian — your internal clock driven by light) and Process S (sleep pressure — adenosine accumulation from wakefulness). Optimal sleep occurs when both processes align: high adenosine + correct circadian phase." },
        { name: "The Morning Light Protocol", description: "A 3-step morning routine: (1) Get outdoor light within 30 min of waking, (2) Delay caffeine 90-120 minutes, (3) Brief cold exposure (30-60 sec cold shower). This combination sets cortisol, clears residual adenosine naturally, and increases baseline dopamine by 250%." },
      ],
      categories: [
        { domain: "Health & Fitness", category: "Sleep" },
        { domain: "Personal Growth", category: "Habits & Routines" },
      ],
    },
  },
  {
    url: "https://paulgraham.com/greatwork.html",
    type: "article",
    title: "How to Do Great Work",
    author: "Paul Graham",
    siteName: "paulgraham.com",
    publishedTime: "2023-07-01",
    readingTime: 45,
    categories: [
      { domain: "Personal Growth", category: "Productivity" },
      { domain: "Career & Work", category: "Skills Development" },
    ],
    topics: ["creative work", "ambition", "curiosity-driven work", "finding your passion", "deep work", "originality"],
    concepts: ["compound interest", "deliberate practice", "first principles thinking", "intrinsic motivation", "selection effects"],
    goals: [
      { goal: "find meaningful work", relevance: "Provides a framework for identifying work that aligns with natural curiosity and aptitude" },
      { goal: "increase creative output", relevance: "Actionable strategies for generating original ideas and maintaining creative momentum" },
      { goal: "build expertise", relevance: "Explains why depth beats breadth and how to choose what to go deep on" },
    ],
    summary: {
      author_description: "Co-founder of Y Combinator, essayist, and former Lisp programmer who has funded and advised over 3,000 startups including Airbnb, Stripe, and Dropbox",
      tldr: "Great work comes from pursuing genuine curiosity with intensity, not from following prestigious paths or optimizing for external validation.",
      core_thesis: "The recipe for doing great work has four ingredients: choose a field that matches your natural aptitude AND genuine curiosity, develop deep expertise through deliberate practice, develop a sensitivity to promising unexplored territory, and have the courage to pursue unconventional ideas. Most people fail at step one — they choose fields based on prestige rather than genuine interest. The most important signal is excitement: if you find yourself thinking about problems even when you don't have to, you've found your field. Great work is almost always the result of 'working on your own projects' — self-directed exploration that starts with genuine curiosity rather than external assignment.",
      key_takeaways: [
        "The three qualities that matter most are natural ability, deep interest, and the willingness to work hard — but interest is the most important because it sustains the other two",
        "Don't try to plan your career — instead, stay on the leading edge of a field and notice what's missing. Great ideas feel obvious in retrospect.",
        "The most dangerous trap is 'prestige-seeking' — choosing work that looks impressive rather than work that feels genuinely exciting",
        "Writing is thinking: the process of trying to explain your ideas reveals what you actually understand versus what you think you understand",
        "You should be willing to look like an idiot — the best new ideas always seem crazy at first because they conflict with conventional wisdom",
        "Young people's biggest advantage isn't energy but the ability to take social risks — use this before it fades"
      ],
      difficulty: "intermediate",
      content_format: "opinion",
      actions: [
        { action: "Spend one hour per week working on a project that excites you but has no external deadline or requirement", rationale: "Self-directed projects driven by curiosity are statistically the most common origin of breakthrough work. The lack of external pressure allows your mind to explore freely." },
        { action: "Write about what you're learning for 20 minutes daily, even if no one reads it", rationale: "Writing forces you to identify gaps in your understanding. Paul Graham attributes his best ideas to the process of writing essays, not to brainstorming sessions." },
        { action: "Talk to people working at the frontier of your field and ask 'what's broken?'", rationale: "Great work often comes from noticing what's obviously missing — but you can only notice this from inside the field, after achieving enough depth to see the gaps." },
      ],
      quotes_and_examples: [
        { text: "The way to figure out what to work on is not to decide but to notice. Pay attention to what you find yourself drawn to, what you think about in the shower, what you'd work on even if you weren't being paid.", attribution: "Paul Graham", source_type: "quote", theme: "self-awareness", topic: "finding your passion" },
        { text: "Four of the most important fields — math, science, programming, and essay writing — all happened the same way: someone started doing what they enjoyed, got increasingly good at it, and eventually produced work that mattered.", attribution: "Paul Graham", source_type: "example", theme: "emergence", topic: "career development" },
        { text: "The best way to have good ideas is to have a lot of ideas and throw away the bad ones. People who do great work often describe the process as more like discovering something that already existed than inventing something new.", attribution: "Paul Graham", source_type: "quote", theme: "creative process", topic: "idea generation" },
        { text: "Prestige is like a powerful magnet that warps even your beliefs about what you enjoy. One way to counteract it: ask yourself whether you'd still want to do this work if no one would ever know about it.", attribution: "Paul Graham", source_type: "quote", theme: "authenticity", topic: "intrinsic motivation" },
        { text: "Darwin didn't set out to overturn biology — he was a curious naturalist who noticed something odd about finches. Einstein didn't aim to revolutionize physics — he was a patent clerk puzzling over thought experiments.", attribution: "Paul Graham", source_type: "anecdote", theme: "humility", topic: "originality" },
      ],
      frameworks: [
        { name: "The Curiosity-Aptitude Intersection", description: "Plot your genuine curiosities against your natural aptitudes. Great work happens at the intersection — where you're both talented and intrinsically motivated. If you're curious but not talented, you'll be a fan. If you're talented but not curious, you'll burn out." },
        { name: "The Bus Ticket Theory of Genius", description: "Great discoveries come from obsessive interest in things that seem unimportant to others — like a bus ticket collector who knows every route. The key insight: you can't fake this obsession. It must be genuine, which is why following prestige fails." },
      ],
      categories: [
        { domain: "Personal Growth", category: "Productivity" },
        { domain: "Career & Work", category: "Skills Development" },
      ],
    },
  },
  {
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    type: "youtube",
    title: "How to Build Muscle: Evidence-Based Hypertrophy Training",
    author: "Jeff Nippard",
    thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    duration: "45:18",
    categories: [
      { domain: "Health & Fitness", category: "Strength Information" },
      { domain: "Health & Fitness", category: "Nutrition" },
    ],
    topics: ["hypertrophy", "resistance training", "progressive overload", "muscle protein synthesis", "training volume", "rep ranges"],
    concepts: ["progressive overload", "minimum effective dose", "diminishing returns", "stimulus-recovery-adaptation"],
    goals: [
      { goal: "build lean muscle", relevance: "Comprehensive breakdown of optimal sets, reps, and frequency for maximizing muscle growth" },
      { goal: "optimize training efficiency", relevance: "Identifies the minimum effective volume to stimulate growth without overtraining" },
    ],
    summary: {
      author_description: "Natural bodybuilder with a BSc in biochemistry who translates exercise science research into practical training advice",
      tldr: "Optimal hypertrophy requires 10-20 hard sets per muscle group per week, distributed across 2+ sessions, using loads between 60-85% 1RM.",
      core_thesis: "Muscle growth is driven by three primary mechanisms: mechanical tension (the most important), metabolic stress, and muscle damage. Training volume (total hard sets per muscle group per week) is the primary driver of hypertrophy, with 10-20 sets being the optimal range for most people. However, volume must be periodized — you can't simply do more sets forever. The key is finding your 'minimum effective volume' (MEV) to start a training block, progressively increasing to your 'maximum recoverable volume' (MRV), then deloading. Rep range matters less than proximity to failure — sets taken within 1-3 reps of failure stimulate similar growth whether done at 6 reps or 20 reps.",
      key_takeaways: [
        "10-20 hard sets per muscle group per week is the evidence-based sweet spot — below 10 may be insufficient, above 20 rarely provides additional benefit",
        "Training a muscle 2-3x per week is superior to once per week at the same total volume — better muscle protein synthesis elevation",
        "Rep range of 6-30 reps produces similar hypertrophy IF sets are taken within 1-3 reps of failure",
        "Progressive overload means increasing SOMETHING over time: weight, reps, sets, or reducing rest periods. Weight isn't the only lever.",
        "Protein intake of 1.6-2.2g per kg bodyweight per day, distributed across 4+ meals, maximizes muscle protein synthesis",
        "Sleep deprivation (under 6 hours) can reduce anabolic hormones by 15-30% and impair recovery"
      ],
      difficulty: "intermediate",
      content_format: "explainer",
      actions: [
        { action: "Track weekly sets per muscle group in a training log and aim for 10-15 hard sets per muscle", rationale: "Without tracking, most people significantly underestimate or overestimate their actual training volume. Research shows a clear dose-response relationship between volume and growth up to ~20 sets." },
        { action: "Use RPE 7-9 (1-3 reps from failure) on working sets and RPE 10 only on final sets", rationale: "Training to failure on every set increases fatigue disproportionate to stimulus. Keeping 1-3 reps in reserve allows higher total volume while maintaining similar per-set hypertrophic stimulus." },
        { action: "Consume 30-40g protein within 2 hours of training and space meals 3-5 hours apart", rationale: "Muscle protein synthesis peaks ~1-2 hours post-training and each protein feeding elevates MPS for ~3-5 hours. Distributing protein across the day creates multiple MPS peaks." },
      ],
      quotes_and_examples: [
        { text: "Volume is like digging a hole — you need enough shovels of dirt to make progress, but at some point you're just throwing dirt back in. Find your maximum recoverable volume, not your maximum possible volume.", attribution: "Jeff Nippard (8:45)", source_type: "analogy", theme: "balance", topic: "training volume" },
        { text: "A 2019 meta-analysis by Schoenfeld et al. found that higher training volumes (10+ sets per week per muscle group) led to significantly greater muscle growth than lower volumes, with no apparent ceiling below 20 sets.", attribution: "Jeff Nippard citing Schoenfeld (15:32)", source_type: "data-point", theme: "evidence-based training", topic: "hypertrophy" },
      ],
      frameworks: [
        { name: "MEV-MAV-MRV Volume Framework", description: "Three volume landmarks: Minimum Effective Volume (MEV) — least volume that produces growth; Maximum Adaptive Volume (MAV) — the sweet spot; Maximum Recoverable Volume (MRV) — beyond this, recovery is impaired. Start a training block at MEV and progressively increase toward MRV over 4-6 weeks, then deload." },
      ],
      categories: [
        { domain: "Health & Fitness", category: "Strength Information" },
        { domain: "Health & Fitness", category: "Nutrition" },
      ],
    },
  },
  {
    url: "https://hbr.org/2024/01/ai-strategy",
    type: "article",
    title: "How to Build an AI Strategy Without Getting Lost in the Hype",
    author: "Ethan Mollick",
    siteName: "Harvard Business Review",
    publishedTime: "2024-01-15",
    readingTime: 12,
    categories: [
      { domain: "Tech & Knowledge", category: "AI & Machine Learning" },
      { domain: "Career & Work", category: "Leadership" },
    ],
    topics: ["ai strategy", "enterprise ai", "large language models", "ai implementation", "organizational change"],
    concepts: ["adoption curve", "jobs-to-be-done", "build vs buy", "technical debt"],
    goals: [
      { goal: "implement ai at work", relevance: "Provides a practical framework for evaluating where AI adds genuine value vs. where it's just hype" },
      { goal: "stay current with technology", relevance: "Distills the most important AI developments for business leaders without requiring technical depth" },
    ],
    summary: {
      author_description: "Wharton professor studying AI's impact on work and organizations, author of 'Co-Intelligence', and advisor to Fortune 500 companies on AI adoption",
      tldr: "Start AI implementation with tasks, not technology — identify where AI reliably outperforms humans today and build outward from proven wins.",
      core_thesis: "Most organizations approach AI backwards: they start with the technology ('we need to use GPT') rather than the problem ('where do our people spend time on tasks AI can do better?'). The winning strategy is to map your organization's tasks, identify where current AI demonstrably outperforms humans (writing first drafts, data analysis, code generation, customer service triage), pilot those applications with clear metrics, and only then expand. The biggest risk isn't falling behind — it's investing heavily in AI applications that don't yet work reliably, creating technical debt and organizational cynicism.",
      key_takeaways: [
        "Map tasks, not roles — AI replaces tasks within jobs, not entire jobs. The question is 'which 30% of this role can AI handle?'",
        "Current LLMs are 'jagged frontier' technologies — superhuman at some tasks, terrible at others, with no obvious pattern",
        "The most successful AI implementations are 'centaur' models where humans and AI each handle what they do best",
        "Measure AI ROI on time saved × quality maintained, not on headcount reduction",
        "The biggest barrier to AI adoption isn't technology — it's middle management incentives that punish experimentation"
      ],
      difficulty: "intermediate",
      content_format: "research",
      actions: [
        { action: "Have each team member spend 1 hour listing tasks they do weekly, then rate each for 'AI-ability' on a 1-5 scale", rationale: "This bottom-up task mapping reveals opportunities invisible to leadership. Research shows that employees are 3x better at identifying AI-suitable tasks than managers or consultants." },
        { action: "Run 3 small AI pilots with clear success metrics before committing to enterprise-wide tools", rationale: "Pilots with defined metrics create evidence for scaling decisions. Without metrics, AI projects become opinion-based, and the loudest voice wins." },
      ],
      quotes_and_examples: [
        { text: "I call it the Jagged Frontier of AI — it's not a smooth line where AI gradually gets better at everything. It's jagged: AI can write a better marketing email than most humans but can't reliably count the number of words in a sentence.", attribution: "Ethan Mollick", source_type: "analogy", theme: "nuance", topic: "ai capabilities" },
        { text: "BCG consultants using GPT-4 completed 12% more tasks, 25% faster, and with 40% higher quality — but only on tasks within the AI's capability frontier. On tasks outside it, they performed 23% worse than consultants without AI.", attribution: "Ethan Mollick citing BCG study", source_type: "data-point", theme: "evidence", topic: "ai productivity" },
      ],
      frameworks: [
        { name: "The Jagged Frontier Model", description: "AI capabilities aren't a smooth progression — they form a jagged frontier where AI dramatically outperforms humans in some tasks while failing at seemingly simpler ones. Strategy requires mapping which tasks fall on which side of the frontier for YOUR specific context." },
        { name: "Centaur vs. Cyborg Work Models", description: "Centaur: human and AI take turns, each handling what they do best (human strategizes, AI executes). Cyborg: human and AI work simultaneously on the same task (human writes with AI suggestions in real-time). Different tasks suit different models." },
      ],
      categories: [
        { domain: "Tech & Knowledge", category: "AI & Machine Learning" },
        { domain: "Career & Work", category: "Leadership" },
      ],
    },
  },
];

// Insert items and create files
const insertItem = db.prepare(`
  INSERT INTO items (url, type, title, author, thumbnail, duration, publish_date, reading_time, summary_preview, file_path, status)
  VALUES (@url, @type, @title, @author, @thumbnail, @duration, @publish_date, @reading_time, @summary_preview, @file_path, @status)
`);
const linkCat = db.prepare("INSERT OR IGNORE INTO item_categories (item_id, category_id) VALUES (?, ?)");
const insertTopic = db.prepare("INSERT OR IGNORE INTO item_topics (item_id, topic, topic_type) VALUES (?, ?, ?)");
const insertGoal = db.prepare("INSERT OR IGNORE INTO item_goals (item_id, goal, relevance) VALUES (?, ?, ?)");

function findCategoryId(domainName, categoryName) {
  const domainSlug = slugify(domainName);
  const catSlug = slugify(categoryName);
  const row = db.prepare(`
    SELECT c.id FROM categories c JOIN domains d ON c.domain_id = d.id
    WHERE d.slug = ? AND c.slug = ?
  `).get(domainSlug, catSlug);
  return row?.id;
}

for (const item of testItems) {
  const s = item.summary;
  const typeDir = item.type === "youtube" ? "youtube" : "articles";
  const titleSlug = slugify(item.title);
  const primaryCat = item.categories[0];
  const domainSlug = slugify(primaryCat.domain);
  const catSlug = slugify(primaryCat.category);
  const relativePath = `${domainSlug}/${catSlug}/${typeDir}/${titleSlug}`;

  const result = insertItem.run({
    url: item.url,
    type: item.type,
    title: item.title,
    author: item.author,
    thumbnail: item.thumbnail || null,
    duration: item.duration || null,
    publish_date: item.publishedTime || null,
    reading_time: item.readingTime || null,
    summary_preview: s.tldr,
    file_path: relativePath,
    status: "complete",
  });

  const itemId = Number(result.lastInsertRowid);

  // Link categories
  for (const cat of item.categories) {
    const catId = findCategoryId(cat.domain, cat.category);
    if (catId) linkCat.run(itemId, catId);
  }

  // Link topics and concepts
  for (const t of item.topics) insertTopic.run(itemId, t.toLowerCase(), "topic");
  for (const c of item.concepts) insertTopic.run(itemId, c.toLowerCase(), "concept");

  // Link goals
  for (const g of item.goals) insertGoal.run(itemId, g.goal.toLowerCase(), g.relevance);

  // Create files for each category path
  for (const cat of item.categories) {
    const ds = slugify(cat.domain);
    const cs = slugify(cat.category);
    const dir = path.join(STORAGE_ROOT, ds, cs, typeDir, titleSlug);
    fs.mkdirSync(dir, { recursive: true });

    // JSON artifact
    const jsonArtifact = {
      schema_version: 2,
      source: {
        url: item.url, type: item.type, title: item.title,
        platform: item.type === "youtube" ? "YouTube" : (item.siteName || "Web"),
        author: { name: item.author, description: s.author_description },
        published_date: item.publishedTime || null,
        date_saved: new Date().toISOString(),
        ...(item.duration && { duration: item.duration }),
        ...(item.readingTime && { reading_time_min: item.readingTime }),
      },
      summary: {
        tldr: s.tldr, core_thesis: s.core_thesis,
        key_takeaways: s.key_takeaways, difficulty: s.difficulty, content_format: s.content_format,
      },
      actions: s.actions,
      quotes_and_examples: s.quotes_and_examples,
      frameworks: s.frameworks,
      tags: {
        domains: item.categories.reduce((acc, c) => {
          const existing = acc.find(d => d.domain === c.domain);
          if (existing) existing.categories.push(c.category);
          else acc.push({ domain: c.domain, categories: [c.category] });
          return acc;
        }, []),
        topics: item.topics, concepts: item.concepts, goals: item.goals,
      },
    };
    fs.writeFileSync(path.join(dir, "summary.json"), JSON.stringify(jsonArtifact, null, 2));

    // Markdown
    const dateSaved = new Date().toISOString().split("T")[0];
    let md = `---
title: "${item.title}"
url: "${item.url}"
type: ${item.type}
author: "${item.author}"
platform: "${item.type === "youtube" ? "YouTube" : (item.siteName || "Web")}"
date_saved: "${dateSaved}"
date_published: "${item.publishedTime || "Unknown"}"
difficulty: "${s.difficulty}"
content_format: "${s.content_format}"
categories: [${item.categories.map(c => `"${c.category}"`).join(", ")}]
topics: [${item.topics.map(t => `"${t}"`).join(", ")}]
concepts: [${item.concepts.map(c => `"${c}"`).join(", ")}]
---

# ${item.title}

> **TL;DR:** ${s.tldr}

## Source
- **Author:** ${item.author}
- **About:** ${s.author_description}
- **Platform:** ${item.type === "youtube" ? "YouTube" : (item.siteName || "Web")}
- **Level:** ${s.difficulty.charAt(0).toUpperCase() + s.difficulty.slice(1)} · ${s.content_format}

## Core Thesis
${s.core_thesis}

## Key Takeaways
${s.key_takeaways.map(t => `- ${t}`).join("\n")}

## Actions
${s.actions.map(a => `- **${a.action}**\n  _${a.rationale}_`).join("\n")}

## Quotes & Examples
${s.quotes_and_examples.map(q => `\n> "${q.text}" — ${q.attribution || "Unknown"}\n> [${q.source_type}] \`${q.theme}\` · \`${q.topic}\``).join("\n")}

## Frameworks
${s.frameworks.map(f => `- **${f.name}:** ${f.description}`).join("\n")}

---

## Tags
**Topics:** ${item.topics.map(t => `\`${t}\``).join(" · ")}
**Concepts:** ${item.concepts.map(c => `\`${c}\``).join(" · ")}
**Goals:**
${item.goals.map(g => `- ${g.goal} — _${g.relevance}_`).join("\n")}
**Categories:** ${item.categories.map(c => `${c.domain} > ${c.category}`).join(", ")}

---

## Metadata
- **Source:** [${item.title}](${item.url})
${item.type === "youtube" ? `- **Channel:** ${item.author}\n- **Duration:** ${item.duration}` : `- **Publication:** ${item.siteName}\n- **Reading Time:** ~${item.readingTime} min`}
- **Date Saved:** ${dateSaved}
`;
    fs.writeFileSync(path.join(dir, "summary.md"), md);

    // Raw content placeholder
    const rawFile = item.type === "youtube" ? "transcript.txt" : "full-text.txt";
    fs.writeFileSync(path.join(dir, rawFile), `[Test data — ${item.title}]\n\nThis is placeholder content for testing purposes.`);
  }

  console.log(`Seeded: ${item.title} (ID: ${itemId})`);
}

console.log("\nDone! Seeded", testItems.length, "items with files.");
db.close();
