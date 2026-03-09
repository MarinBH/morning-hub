# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (Next.js 16)
npm run build        # Production build — run after every sprint to verify
npm start            # Serve production build
```

No test runner or linter is configured.

## Architecture

Mobile-first PWA ("Morning Hub") built with Next.js 16 + React 18. Single-user personal command center for Android. Dark theme, max-width 480px container.

### Entry Point & Tabs

`app/page.js` — Root client component. Renders 4 tabs: **dashboard**, **tasks**, **practice**, **goals**. All tabs mount simultaneously (`display: none` for inactive) to preserve state. Wraps content in three context providers: `TasksProvider` > `CalendarProvider` > `WheelOfLifeProvider` > `ErrorBoundary`.

### State Management

**Contexts** (`app/contexts/`):
- `TasksContext` — Todoist tasks + projects, fetched from `/api/todoist`. Exposes `allTasks`, `addTask`, `removeTask`, `refetch`.
- `CalendarContext` — Google Calendar events from `/api/calendar`. Returns mock data when unconfigured.
- `WheelOfLifeContext` — Wheel of Life scores/goals. Shared across Dashboard and Goals tab.

**Hooks** (`app/hooks/`):
- `useTodayState(totalHabitsOverride?)` — Daily habits, journal, captures, breathwork. Persisted per-day in localStorage (`hub-${YYYY-MM-DD}`). Computes `momentumScore` (habits 50%, journal 25%, breathwork 25%) and `streakDays`.
- `useHabitConfig()` — Pack selection and custom habits. localStorage key `hub-habit-config`. Exposes `selectPack`, `customizePack`, `addHabit`, `removeHabit`, `updateHabit`.
- `useKnowledge()` — Persistent knowledge items. localStorage key `hub-knowledge`. Not tied to daily state.
- `usePullToRefresh(callback)` — Touch gesture handler for pull-to-refresh.
- `useWheelOfLife()` — Life area scoring. localStorage key `hub-wheel-of-life`.

### Styling

Inline styles with design tokens from `app/lib/theme.js`. No CSS modules or Tailwind. Always use token imports:
```js
import { colors, radius, spacing, typography } from '../../lib/theme';
```
Dark theme: `#121110` background, `#F0EDE6` text. Brand colors: primary `#6C9BFF`, secondary `#8B6CFF`. All interactive elements must have `minHeight: 44` for touch targets.

### API Routes (`app/api/`)

- `/api/todoist` — GET/POST proxy. Server-side `TODOIST_API_TOKEN`. GET fetches tasks/projects. POST completes or adds tasks.
- `/api/calendar` — Google Calendar proxy via service account. Falls back to mock data.
- `/api/ai-summary` — Claude Haiku API for knowledge item summarization. Returns structured JSON (title, keyPoints, category, tags, actionItems, contentType).

### Key Component Groups

- `practice/` — Morning ritual: `MorningFlow` (4-step swipeable carousel), `HabitsStep`, `BreathStep`, `JournalStep`, `CommitStep`, `CelebrationCard`, `HabitPackPicker`, `BreathTimer`
- `tasks/` — `TasksPanel` > `KanbanView` (swipeable Inbox/Today/Week/Backlog columns) + `TaskCard` + `QuickAdd`
- `dashboard/` — `Dashboard` aggregates MorningFlow, tasks preview, calendar, Wheel of Life, knowledge cards
- `goals/` — `GoalsPanel` with `DomainJourney` SVG illustrations and `MilestoneList`
- `knowledge/` — `KnowledgeCard` (expandable AI summary), `KnowledgeFeed` (search + category filter)
- `capture/` — `CaptureModal` (text/voice/URL input with destination routing: inbox, note, task, knowledge)
- `layout/` — `Header`, `BottomNav`, `FloatingCapture`, `CommandPalette`
- `common/` — `Card`, `Badge`, `ErrorBoundary`, `Skeleton`, `WheelOfLife` (SVG spider chart)

### Data Persistence

All client state uses localStorage via `loadLocal`/`saveLocal` from `app/lib/utils.js`. Keys:
- `hub-${YYYY-MM-DD}` — Daily state (habits, journal, captures, breathworkDone, breathworkSkipped)
- `hub-committed-${YYYY-MM-DD}` — Daily commitment data `{ committed: true, intention: string }`
- `hub-habit-config` — Habit pack selection + custom habits
- `hub-knowledge` — Knowledge items (persists across days)
- `hub-wheel-of-life` — Life area scores and goals

### Habit Packs (`app/lib/habitPacks.js`)

4 research-backed packs (Huberman, Ali Abdaal, CEO Focus, Mindful Start) + Custom blank. Each pack has 5 habits with `{ id, label, icon }`. Custom pack uses `packId: 'custom'`.

### Constants (`app/lib/constants.js`)

`HABITS` (default 5), `JOURNAL_PROMPTS`, `NAV_ITEMS`, `WHEEL_OF_LIFE_AREAS` (8 domains), `API` endpoint paths, `PRIORITY_COLORS`, `STORAGE_KEYS`.

## Project Status & Roadmap

### Completed

- **Phase 0**: Modular restructuring (576-line monolith split into 20+ files)
- **Phase 1**: Dashboard shell, command palette, pull-to-refresh, streak counter, skeleton loaders, PWA install prompt
- **Review #2**: Shared contexts (Tasks, Calendar, WheelOfLife), extracted common components
- **Sprints D-I**: Habit packs, morning flow carousel, kanban task view, knowledge capture + AI, goals domain journeys
- **Sprint K**: Fixed 18 audit bugs (state integrity, MorningFlow shared state, knowledge system, task polish, custom habit editor UI)

### Known Bugs from Triple-Agent Audit

Three parallel audit agents identified 66 findings. Sprint K fixed 18 of 21 tracked bugs. Remaining unresolved:

- `submitError` state check is stale due to React batching (`CaptureModal.js:132`)
- No rate limiting on AI summary button
- Voice input may re-append accumulated transcript on some browsers (`CaptureModal.js:58-61`)

### Planned Phases (Not Yet Built)

- **Phase 2**: Native task engine with goal hierarchy and 80/20 AI analysis
- **Phase 3**: Universal capture with content processors (YouTube metadata, web articles, Google Maps places)
- **Phase 4**: Two-way Google Calendar sync with AI time blocking
- **Phase 5**: Adaptive pressure/accountability system with escalation engine
- **Phase 6**: Voice commands (short mode + memo mode)
- **Phase 7**: Daily/weekly/monthly AI reviews and synthesis
- **Phase 8**: Journey map visualization polish

### Design Decisions (User-Approved)

- Morning flow: 4-step swipeable carousel (Habits > Breathe > Journal > Commit), not full-screen overlay
- Habit packs: Full-screen picker on first use, "Customize" forks into custom mode
- Tasks: Kanban columns (Inbox/Today/This Week/Backlog) with 3s undo toast before Todoist sync
- Knowledge: Dedicated localStorage, AI summary via Claude Haiku, card-based feed with search + category filters
- Goals: 8 Wheel of Life domains as RPG journeys with SVG illustrations and milestone tracking
- Rank progression: Novice (1-2) > Apprentice (3-4) > Journeyman (5-6) > Expert (7-8) > Master (9-10)
- Tab structure: Home | Tasks | Practice | Goals
- Error UX: User-friendly messages + retry buttons, no toast system
- Auth: None (single-user personal device)
- Database: Supabase (configured but not actively used yet — localStorage primary)

## Environment Variables

See `.env.example` for full list. Key vars:
- `TODOIST_API_TOKEN` — Required for task sync
- `GOOGLE_CALENDAR_CREDENTIALS` + `GOOGLE_CALENDAR_ID` — Optional calendar integration
- `ANTHROPIC_API_KEY` — Required for AI knowledge summaries (uses `claude-haiku-4-5-20251001`)
