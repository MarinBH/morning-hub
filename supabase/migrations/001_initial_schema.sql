-- Morning Hub Command Center — Initial Schema
-- Run this in your Supabase SQL editor when ready to connect

-- Goals: top-level life objectives
CREATE TABLE goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'archived')),
  target_date DATE,
  parent_goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Projects: nest under goals
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'archived')),
  priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 4),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tags: for organizing everything
CREATE TABLE tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT, -- e.g., 'topic', 'project', 'type'
  auto_generated BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tasks: the core work unit
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 4),
  due_date DATE,
  estimated_minutes INTEGER,
  todoist_id TEXT UNIQUE,
  calendar_event_id TEXT,
  is_high_leverage BOOLEAN DEFAULT false,
  leverage_score REAL DEFAULT 0 CHECK (leverage_score >= 0 AND leverage_score <= 10),
  tags TEXT[] DEFAULT '{}',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Captures: PKM content (links, articles, youtube, maps, etc.)
CREATE TABLE captures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('link', 'youtube', 'article', 'maps', 'social', 'image', 'pdf', 'voice', 'note', 'other')),
  content TEXT,
  source_url TEXT,
  title TEXT,
  summary TEXT,
  tags TEXT[] DEFAULT '{}',
  processed BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Voice notes: audio recordings with transcriptions
CREATE TABLE voice_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  audio_url TEXT,
  transcript TEXT,
  processed_output JSONB DEFAULT '{}', -- extracted tasks, ideas, etc.
  duration INTEGER, -- seconds
  capture_id UUID REFERENCES captures(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Calendar events: cached Google Calendar events
CREATE TABLE calendar_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  google_event_id TEXT UNIQUE,
  title TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location TEXT,
  travel_minutes INTEGER DEFAULT 0,
  synced_at TIMESTAMPTZ DEFAULT now()
);

-- Momentum: daily tracking scores
CREATE TABLE momentum (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  task_completion_rate REAL DEFAULT 0,
  goal_alignment_score REAL DEFAULT 0,
  habits_completed INTEGER DEFAULT 0,
  journal_written BOOLEAN DEFAULT false,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Reviews: structured review records
CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('daily', 'weekly', 'monthly')),
  date DATE NOT NULL,
  content JSONB DEFAULT '{}',
  insights JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Reminders: notification queue
CREATE TABLE reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  target_type TEXT NOT NULL, -- 'task', 'goal', 'review', 'system'
  target_id UUID,
  message TEXT NOT NULL,
  trigger_time TIMESTAMPTZ NOT NULL,
  severity INTEGER DEFAULT 1 CHECK (severity >= 1 AND severity <= 4),
  sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Saved searches: for scheduled knowledge queries
CREATE TABLE saved_searches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  query TEXT NOT NULL,
  filters JSONB DEFAULT '{}',
  schedule TEXT, -- cron-like: 'daily', 'weekly:monday', 'monthly:1'
  last_run TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_todoist_id ON tasks(todoist_id);
CREATE INDEX idx_tasks_goal_id ON tasks(goal_id);
CREATE INDEX idx_captures_type ON captures(type);
CREATE INDEX idx_captures_processed ON captures(processed);
CREATE INDEX idx_captures_created_at ON captures(created_at DESC);
CREATE INDEX idx_momentum_date ON momentum(date DESC);
CREATE INDEX idx_calendar_events_start ON calendar_events(start_time);
CREATE INDEX idx_reminders_trigger ON reminders(trigger_time) WHERE NOT sent;

-- Full-text search on captures
CREATE INDEX idx_captures_fts ON captures USING gin(
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, '') || ' ' || coalesce(summary, ''))
);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER goals_updated_at BEFORE UPDATE ON goals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER captures_updated_at BEFORE UPDATE ON captures FOR EACH ROW EXECUTE FUNCTION update_updated_at();
