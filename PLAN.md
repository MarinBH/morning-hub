# Morning Hub → Command Center: Implementation Plan

## Vision
Transform Morning Hub from a morning routine app into a **personal AI-powered command center** — a task engine, knowledge brain, calendar hub, and accountability system optimized for mobile-first daily use on Android.

---

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Database** | Supabase (Postgres) | Free tier generous, real-time subscriptions, auth if needed later, easy for non-devs |
| **AI Processing** | Mix: Gemini (cheap bulk), Claude (synthesis/confrontation), OpenAI Whisper (voice) | Cost-optimize per task type |
| **File Storage** | Supabase Storage + Google Drive sync | Local uploads → Supabase, exported corpus → Drive for NotebookLM |
| **Hosting** | Vercel (current Next.js) | Already set up, free tier, edge functions |
| **Push Notifications** | Web Push API (service worker) | Native PWA support on Android |
| **Offline** | Online-only (per user preference) | Simplifies architecture significantly |
| **Auth** | None (personal device) | Single-user, API keys server-side |

### Estimated Monthly Costs (~$20/mo target)
- Supabase Free Tier: $0 (500MB DB, 1GB storage)
- Vercel Free Tier: $0
- Gemini Flash (bulk tagging/summaries): ~$2-5/mo at 30-50 items/week
- Claude Haiku (confrontational prompts, reviews): ~$3-5/mo
- OpenAI Whisper (voice transcription): ~$2-3/mo
- YouTube Data API: Free (10K quota/day)
- **Total: ~$7-13/mo** — well within budget

---

## Phase 0: Foundation (Week 1)
> **Goal:** Refactor the monolith, set up Supabase, establish modular architecture

### 0.1 — Project Restructuring
- Break `page.js` (576 lines) into modular components:
  ```
  app/
  ├── components/
  │   ├── layout/        # Shell, BottomNav, Header
  │   ├── dashboard/     # Main dashboard view
  │   ├── capture/       # Capture modal, voice input
  │   ├── tasks/         # Task list, task cards
  │   ├── calendar/      # Calendar views
  │   ├── practice/      # Habits, breathwork, journal
  │   ├── goals/         # Goal hierarchy, journey map
  │   ├── knowledge/     # PKM views, search
  │   └── common/        # Buttons, cards, modals, icons
  ├── hooks/             # Custom React hooks
  ├── lib/               # Utilities, API clients, AI services
  ├── api/               # API routes (existing + new)
  └── styles/            # CSS modules or styled approach
  ```

### 0.2 — Supabase Setup
- Create Supabase project
- Design initial schema:
  ```sql
  -- Core entities
  goals (id, title, description, status, target_date, parent_goal_id, progress, created_at)
  projects (id, title, goal_id, status, priority, created_at)
  tasks (id, title, project_id, goal_id, status, priority, due_date,
         estimated_minutes, todoist_id, calendar_event_id,
         is_high_leverage, leverage_score, tags[], created_at)

  -- Knowledge / PKM
  captures (id, type, content, source_url, title, summary,
            tags[], processed, metadata jsonb, created_at)
  voice_notes (id, audio_url, transcript, processed_output jsonb,
               duration, created_at)

  -- System
  tags (id, name, category, auto_generated, usage_count)
  reviews (id, type, date, content jsonb, insights jsonb)
  momentum (id, date, score, task_completion_rate,
            goal_alignment_score, details jsonb)

  -- Scheduling
  calendar_events (id, google_event_id, title, start, end,
                   location, travel_minutes, synced_at)
  reminders (id, target_type, target_id, message,
             trigger_time, severity, sent)
  ```

### 0.3 — Environment & Config
- Set up Supabase client library
- Create `.env.local` template with all required keys
- Set up API route structure for new endpoints

---

## Phase 1: Dashboard & UX Shell (Week 2-3)
> **Goal:** Beautiful, mobile-first dashboard that feels like a command center
> **This is the priority — get the UX right first**

### 1.1 — Mobile-First Dashboard Layout
- Scrollable card-based dashboard (replace rigid tabs)
- Collapsible sections with smooth animations
- Quick-action floating button (enhanced capture)
- Pull-to-refresh
- Status bar: momentum score + streak + current quest

### 1.2 — AI Morning Briefing Card
- Top card on dashboard: today's AI-generated briefing
- Includes: top 3 priorities, calendar conflicts, goal nudge, weather (optional)
- Ritual modules below: habits checklist, breathwork, journal (collapsible)
- "Start my day" commitment button

### 1.3 — Navigation & Screens
- Bottom nav: Dashboard | Tasks | Knowledge | Goals
- Swipe gestures between sections
- Quick-capture overlay accessible from any screen
- Command palette (search bar at top): type to search tasks, knowledge, or run commands

### 1.4 — Design System
- Formalize the existing dark theme into reusable tokens
- Component library: Card, Button, Badge, Modal, ProgressBar, Tag
- Consistent spacing, typography, and color scales
- Journey map visual component (for goal progress)

---

## Phase 2: Native Task Engine (Week 3-4)
> **Goal:** Own task system with Todoist sync, goal hierarchy, 80/20 analysis

### 2.1 — Goal Hierarchy
- Create/edit goals (top-level life objectives)
- Projects nest under goals
- Tasks nest under projects
- Visual tree/breadcrumb showing where a task sits in the hierarchy
- Journey map: each goal is a path, projects are waypoints, tasks are steps

### 2.2 — Native Task CRUD
- Create tasks with: title, project, due date, priority, estimated time, tags
- Quick-add from any screen (voice or text)
- Task detail view: linked goal, files, notes, time tracking
- Batch operations: select multiple, reassign, reprioritize

### 2.3 — Todoist Two-Way Sync
- Pull tasks from Todoist → match/create in local DB
- Push local task changes → Todoist
- Conflict resolution: local wins (with Todoist as backup)
- Sync status indicator
- Map Todoist projects → local projects

### 2.4 — 80/20 AI Analysis
- **AI auto-scoring:** Gemini analyzes each task against goal descriptions, assigns leverage score (1-10)
- **Manual override:** User can mark/unmark tasks as high-leverage
- **Weekly retrospective:** Claude generates "time spent vs. goal impact" analysis
- **Dashboard widget:** "Your highest-leverage task right now is: ___"

---

## Phase 3: Capture & PKM System (Week 5-6)
> **Goal:** Capture anything, auto-process it, make it queryable

### 3.1 — Universal Capture
- Enhanced capture modal: detect content type from input
- **URL detection:** Paste a link → auto-classify (YouTube, article, Maps, social, other)
- **File upload:** Images, PDFs, documents → Supabase Storage
- **Voice capture:** Short clips + long memos (modes)
- **Text capture:** Quick notes, ideas, tasks

### 3.2 — Content Processors (per type)
- **YouTube:** Extract video ID → YouTube Data API for metadata (title, description, thumbnail, duration, channel) → Gemini summarize description + auto-generated captions if available
- **Web articles:** Server-side fetch + readability extraction → Gemini summarize + extract key points
- **Google Maps:** Extract place name, coordinates, category from URL → tag as location
- **Social posts:** Extract text content, author, platform → Gemini summarize
- **Images:** Store in Supabase Storage, OCR if text-heavy (future)
- **PDFs:** Extract text → summarize (future, can use Gemini)
- **Voice memos:** Whisper transcription → Gemini extract tasks/ideas/key points into structured output

### 3.3 — AI Auto-Tagging
- On capture processing, Gemini generates tags from content
- Tags compared against existing tag corpus for consistency
- New tags flagged; system learns user's preferred taxonomy over time
- Tags link to goals/projects when relevant content detected
- Tag management UI: merge, rename, delete, set categories

### 3.4 — Knowledge Feed & Search
- Chronological feed of all captures (filterable by type, tag, date)
- Full-text search across all captures + summaries
- Saved searches with scheduling (e.g., "every Monday, run this search and show new items")
- Tag-based browsing and filtering

### 3.5 — NotebookLM / Google Drive Export
- Scheduled export: push processed captures (summaries, transcripts, articles) to Google Drive folder
- Format: structured markdown files organized by tag/topic
- NotebookLM can then ingest the Drive folder as a source
- Manual "export to Drive" button per item or batch

---

## Phase 4: Calendar & Scheduling (Week 7-8)
> **Goal:** Full calendar integration with AI scheduling and conflict detection

### 4.1 — Two-Way Google Calendar Sync
- Read: Pull all events (not just today) — week/month view
- Write: Create events from within the app
- Edit: Modify event times, titles, descriptions
- Delete: Remove events
- Real-time sync via polling (every 5 min) or webhook

### 4.2 — AI Time Blocking
- When a task has an estimated duration + due date:
  - AI scans calendar for open slots
  - Suggests optimal time block (considering energy patterns, existing meetings)
  - One-tap to create calendar event linked to task
- "Plan my day" feature: AI auto-schedules all today's tasks into available slots

### 4.3 — Conflict Detection & Resolution
- **Calendar vs. Tasks:** Alert when task due time overlaps with meeting
- **Overcommitment:** "You have 8 hours of tasks but only 3 hours free today"
- **Priority misalignment:** "You scheduled low-priority work during your best focus hours"
- **Travel time:** Google Maps integration — detect location-based events, estimate travel time, flag tight transitions
- Resolution suggestions: reschedule, delegate, defer, break down

### 4.4 — Location Awareness
- Save Google Maps links as locations with auto-extracted place data
- When calendar events have locations: calculate travel time from previous event/home
- Factor travel time into conflict detection
- Location bookmarking: tagged collection of saved places (restaurants, venues, etc.)

---

## Phase 5: Adaptive Pressure System (Week 9-10)
> **Goal:** Escalating accountability system that actually changes behavior

### 5.1 — Momentum Scoring
- Daily momentum score (0-100) based on:
  - Task completion rate (weighted by leverage score)
  - Goal alignment (% of time on high-leverage tasks)
  - Streak maintenance
  - Review completion
- Weekly and monthly trend tracking
- Journey map updates based on momentum

### 5.2 — Escalation Engine
- **Level 1 — Data:** Dashboard shows alignment metrics passively. "3 of 5 high-leverage tasks completed today."
- **Level 2 — Gentle nudge:** After 1 day of low momentum. "Project X hasn't moved in 2 days. There's a 15-min task that could restart it."
- **Level 3 — Direct confrontation:** After 3+ days. "You said [Goal] matters most, but you haven't touched it since Tuesday. What changed? Be honest."
- **Level 4 — Forced focus:** After 5+ days of avoidance. Dashboard strips to single view: THE one task. "Nothing else until this moves."
- Configurable thresholds and escalation timing

### 5.3 — Confrontational Prompts (Claude-powered)
- Claude generates personalized accountability messages using:
  - User's stated goals and priorities
  - Actual behavior data (what was completed, what was avoided)
  - Historical patterns (does this happen every time with this type of task?)
- Tone: starts supportive-analytical, escalates to blunt-coach
- Always paired with an actionable suggestion (a starter micro-task)

### 5.4 — Push Notifications
- Service worker for web push on Android
- Configurable: which alerts get pushed vs. in-app only
- Morning briefing push: "Your top priority today is ___"
- Conflict alerts: "Meeting in 30 min but you have a task due at the same time"
- Escalation pushes: Level 2+ confrontational prompts

---

## Phase 6: Voice Command System (Week 11)
> **Goal:** Full voice interface for hands-free operation

### 6.1 — Voice Capture Enhancement
- Short mode: <30s clips, instant transcription + filing
- Memo mode: 2-5 min recordings, AI processes into structured notes
  - Extracts: tasks, ideas, decisions, questions
  - Creates linked items: tasks auto-added, ideas captured, questions flagged

### 6.2 — Voice Commands
- "Add task: [description]" → creates task
- "Show my goals" → navigates to goals view
- "What's my top priority?" → AI responds with highest-leverage task
- "Schedule [task] for tomorrow at 2pm" → creates calendar block
- "Capture this link: [URL]" → opens capture flow
- Wake word or button activation (button is more reliable on PWA)

---

## Phase 7: Reviews & Synthesis (Week 12)
> **Goal:** Structured review cycles that close the loop

### 7.1 — Daily Review (Morning Briefing)
- AI-generated: yesterday's stats, today's priorities, conflicts, nudges
- Ritual modules: habits, breathwork, journal (optional, collapsible)
- "Commit to today" interaction

### 7.2 — Weekly Strategic Review
- Triggered Sunday evening or Monday morning
- AI generates: goal progress, what moved, what's stuck, what to reprioritize
- Knowledge digest: new captures this week, emerging themes
- Time allocation analysis: where did time go vs. where should it go?
- Output: adjusted priorities for next week

### 7.3 — Monthly Big-Picture Review
- Goal trajectory: on track, ahead, behind?
- Journey map update: visual progress
- Pattern analysis: recurring blockers, productive patterns
- Goal revalidation: "Are these still the right goals?"
- 80/20 analysis: which 20% of activities drove 80% of progress?

### 7.4 — Saved Searches & Scheduled Queries
- Create saved search: filter by tags, type, date range, keywords
- Schedule: daily, weekly, or monthly execution
- Results delivered as a digest card on dashboard
- Example: "Every Monday, show me all articles tagged 'AI' added this week with summaries"

---

## Phase 8: Polish & Advanced Features (Week 13+)
> **Goal:** Refinement, optimization, and advanced capabilities

### 8.1 — Journey Map Visualization
- Each goal rendered as a path/trail on a visual map
- Projects are waypoints along the path
- Completed tasks fill in the path (progress visualization)
- Active quests highlighted, stalled paths dimmed
- Tap waypoint to drill into project details

### 8.2 — Offline Capture (stretch goal)
- Service worker caches capture form
- Voice recordings saved to IndexedDB
- Sync queue processes when back online

### 8.3 — Performance & Polish
- Optimize bundle size
- Smooth animations and transitions
- Loading states and skeleton screens
- Error boundaries and graceful degradation
- Accessibility improvements

---

## Module Dependency Graph

```
Phase 0: Foundation ──────────────────────────────────┐
    │                                                  │
Phase 1: Dashboard/UX ──── Phase 2: Task Engine ──────┤
    │                          │                       │
    │                     Phase 4: Calendar ────────── │
    │                          │                       │
Phase 3: PKM/Capture          │                       │
    │                          │                       │
    └──────── Phase 5: Pressure System ───────────────┤
                   │                                   │
              Phase 6: Voice Commands                  │
                   │                                   │
              Phase 7: Reviews & Synthesis ────────────┘
                   │
              Phase 8: Polish
```

Phases 1, 2, and 3 can be partially parallelized.
Phase 4 depends on Phase 2 (tasks need to exist for scheduling).
Phase 5 depends on Phases 2 + 4 (needs task + calendar data for pressure).
Phase 6 can start after Phase 3 (capture infrastructure).
Phase 7 ties everything together.

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 18 + CSS Modules (or Tailwind — TBD) |
| Database | Supabase (PostgreSQL) |
| File Storage | Supabase Storage |
| Auth | None (single-user) |
| AI — Bulk Processing | Gemini Flash (tagging, summaries, article extraction) |
| AI — Synthesis | Claude Haiku/Sonnet (confrontational prompts, reviews, 80/20 analysis) |
| AI — Voice | OpenAI Whisper API (transcription) |
| Calendar | Google Calendar API v3 (two-way) |
| Tasks | Native + Todoist sync |
| Push Notifications | Web Push API (service worker) |
| Hosting | Vercel |
| Content Extraction | YouTube Data API, Readability (articles), Google Maps API |
| Knowledge Export | Google Drive API → NotebookLM |

---

## Key Design Principles
1. **Mobile-first always** — every feature designed for thumb-zone Android use
2. **Capture is frictionless** — 1 tap to start capturing anything
3. **AI does the organizing** — you capture, AI tags/sorts/links/summarizes
4. **Pressure is earned** — system only confronts when data shows avoidance
5. **80/20 everywhere** — surface the vital few, hide the trivial many
6. **Modular build** — each phase delivers standalone value
7. **Journey over destination** — progress visualization keeps the big picture alive
