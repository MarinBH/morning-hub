-- ═══════════════════════════════════════════════════════
-- Link Saver SaaS — Initial Schema
-- ═══════════════════════════════════════════════════════

-- User profiles (extends Supabase Auth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  tier TEXT DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'lifetime')),
  ai_credits_used INTEGER DEFAULT 0,
  ai_credits_reset_at TIMESTAMPTZ DEFAULT NOW(),
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ═══════════════════════════════════════════════════════
-- Saved links (unified table for Knowledge + Places)
-- ═══════════════════════════════════════════════════════
CREATE TABLE links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('article', 'youtube', 'place')),
  section TEXT NOT NULL CHECK (section IN ('knowledge', 'places')),
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'complete', 'error')),

  -- Common metadata
  title TEXT,
  thumbnail TEXT,

  -- Knowledge-specific (article + youtube)
  author TEXT,
  site_name TEXT,
  publish_date TEXT,
  reading_time INTEGER,
  duration TEXT,
  channel TEXT,

  -- Place-specific
  address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  rating NUMERIC(2,1),
  price_level TEXT,
  phone TEXT,
  hours JSONB,
  place_type TEXT,
  website_url TEXT,

  -- AI-generated content
  summary_preview TEXT,
  ai_summary JSONB,

  -- User content
  personal_notes TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,

  -- Error tracking
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, url)
);

-- ═══════════════════════════════════════════════════════
-- Tags
-- ═══════════════════════════════════════════════════════
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tag_type TEXT DEFAULT 'topic' CHECK (tag_type IN ('topic', 'concept', 'auto', 'user')),
  UNIQUE(user_id, name, tag_type)
);

CREATE TABLE link_tags (
  link_id UUID REFERENCES links(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (link_id, tag_id)
);

-- ═══════════════════════════════════════════════════════
-- Goals (from AI extraction)
-- ═══════════════════════════════════════════════════════
CREATE TABLE link_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id UUID REFERENCES links(id) ON DELETE CASCADE,
  goal TEXT NOT NULL,
  relevance TEXT,
  UNIQUE(link_id, goal)
);

-- ═══════════════════════════════════════════════════════
-- Wheel of Life taxonomy (optional power feature)
-- ═══════════════════════════════════════════════════════
CREATE TABLE domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  UNIQUE(domain_id, slug)
);

CREATE TABLE link_categories (
  link_id UUID REFERENCES links(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (link_id, category_id)
);

-- ═══════════════════════════════════════════════════════
-- Indexes
-- ═══════════════════════════════════════════════════════
CREATE INDEX idx_links_user ON links(user_id);
CREATE INDEX idx_links_user_section ON links(user_id, section);
CREATE INDEX idx_links_user_type ON links(user_id, type);
CREATE INDEX idx_links_user_created ON links(user_id, created_at DESC);
CREATE INDEX idx_links_user_status ON links(user_id, status);
CREATE INDEX idx_tags_user ON tags(user_id);
CREATE INDEX idx_link_tags_link ON link_tags(link_id);
CREATE INDEX idx_link_tags_tag ON link_tags(tag_id);
CREATE INDEX idx_link_goals_link ON link_goals(link_id);

-- Full-text search index
ALTER TABLE links ADD COLUMN fts tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(summary_preview, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(author, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(channel, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(address, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(personal_notes, '')), 'C')
  ) STORED;
CREATE INDEX idx_links_fts ON links USING gin(fts);

-- ═══════════════════════════════════════════════════════
-- Row Level Security
-- ═══════════════════════════════════════════════════════
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE links ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Links
CREATE POLICY "Users can read own links"
  ON links FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own links"
  ON links FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own links"
  ON links FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own links"
  ON links FOR DELETE USING (auth.uid() = user_id);

-- Tags
CREATE POLICY "Users can manage own tags"
  ON tags FOR ALL USING (auth.uid() = user_id);

-- Link tags
CREATE POLICY "Users can manage own link_tags"
  ON link_tags FOR ALL USING (
    EXISTS (SELECT 1 FROM links WHERE links.id = link_tags.link_id AND links.user_id = auth.uid())
  );

-- Link goals
CREATE POLICY "Users can manage own link_goals"
  ON link_goals FOR ALL USING (
    EXISTS (SELECT 1 FROM links WHERE links.id = link_goals.link_id AND links.user_id = auth.uid())
  );

-- Link categories
CREATE POLICY "Users can manage own link_categories"
  ON link_categories FOR ALL USING (
    EXISTS (SELECT 1 FROM links WHERE links.id = link_categories.link_id AND links.user_id = auth.uid())
  );

-- Domains and categories are public read
CREATE POLICY "Anyone can read domains"
  ON domains FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can read categories"
  ON categories FOR SELECT TO authenticated USING (true);

-- ═══════════════════════════════════════════════════════
-- Seed Wheel of Life domains
-- ═══════════════════════════════════════════════════════
INSERT INTO domains (name, slug, sort_order) VALUES
  ('Health & Fitness', 'health-fitness', 1),
  ('Career & Business', 'career-business', 2),
  ('Finance & Wealth', 'finance-wealth', 3),
  ('Relationships', 'relationships', 4),
  ('Personal Growth', 'personal-growth', 5),
  ('Fun & Recreation', 'fun-recreation', 6),
  ('Physical Environment', 'physical-environment', 7),
  ('Spirituality & Purpose', 'spirituality-purpose', 8);
