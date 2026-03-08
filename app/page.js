'use client';
import { useState, useCallback, useRef } from 'react';
import { colors, spacing } from './lib/theme';
import { loadLocal, saveLocal, todayKey } from './lib/utils';
import { useTodayState } from './hooks/useTodayState';
import { usePullToRefresh } from './hooks/usePullToRefresh';
import { TasksProvider, useTasks } from './contexts/TasksContext';
import { CalendarProvider, useCalendarEvents } from './contexts/CalendarContext';

import Header from './components/layout/Header';
import BottomNav from './components/layout/BottomNav';
import FloatingCapture from './components/layout/FloatingCapture';
import CommandPalette from './components/layout/CommandPalette';
import Dashboard from './components/dashboard/Dashboard';
import TasksPanel from './components/tasks/TasksPanel';
import GoalsPanel from './components/goals/GoalsPanel';
import KnowledgePanel from './components/knowledge/KnowledgePanel';
import CaptureModal from './components/capture/CaptureModal';

const TABS = ['dashboard', 'tasks', 'knowledge', 'goals'];

export default function CommandCenter() {
  const [tab, setTab] = useState('dashboard');
  const [captureOpen, setCaptureOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [committed, setCommitted] = useState(() => {
    if (typeof window === 'undefined') return false;
    return loadLocal(`hub-committed-${todayKey()}`, false);
  });
  const { habits, journal, captures, loaded, momentumScore, streakDays, toggleHabit, setJournal, addCapture } = useTodayState();

  const handleCommit = useCallback(() => {
    setCommitted(true);
    saveLocal(`hub-committed-${todayKey()}`, true);
  }, []);

  if (!loaded) {
    return (
      <div style={{ ...containerStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 32, animation: 'pulse 1.5s ease-in-out infinite' }}>{'\u26A1'}</div>
      </div>
    );
  }

  return (
    <TasksProvider>
      <CalendarProvider>
        <AppShell
          tab={tab}
          setTab={setTab}
          captureOpen={captureOpen}
          setCaptureOpen={setCaptureOpen}
          paletteOpen={paletteOpen}
          setPaletteOpen={setPaletteOpen}
          committed={committed}
          onCommit={handleCommit}
          habits={habits}
          journal={journal}
          captures={captures}
          momentumScore={momentumScore}
          streakDays={streakDays}
          toggleHabit={toggleHabit}
          setJournal={setJournal}
          addCapture={addCapture}
        />
      </CalendarProvider>
    </TasksProvider>
  );
}

// Inner component that can access context for pull-to-refresh
function AppShell({
  tab, setTab, captureOpen, setCaptureOpen, paletteOpen, setPaletteOpen,
  committed, onCommit, habits, journal, captures, momentumScore, streakDays,
  toggleHabit, setJournal, addCapture,
}) {
  const { refetch: refetchTasks } = useTasks();
  const { refetch: refetchCalendar } = useCalendarEvents();
  const scrollRef = useRef(null);

  const handleRefresh = useCallback(async () => {
    await Promise.all([refetchTasks(), refetchCalendar()]);
  }, [refetchTasks, refetchCalendar]);

  const { refreshing, pullDistance, handlers } = usePullToRefresh(handleRefresh);

  return (
    <div style={containerStyle}>
      <Header
        momentumScore={momentumScore}
        captureCount={captures.length}
        streakDays={streakDays}
        onSearchClick={() => setPaletteOpen(true)}
      />

      {/* Pull-to-refresh indicator */}
      {pullDistance > 0 && (
        <div style={{
          height: pullDistance,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: refreshing ? 'none' : 'height 0.2s',
          overflow: 'hidden',
        }}>
          <div style={{
            fontSize: 20,
            opacity: Math.min(1, pullDistance / 60),
            animation: refreshing ? 'spinSlow 1s linear infinite' : 'none',
          }}>
            {refreshing ? '\u{1F504}' : '\u2193'}
          </div>
        </div>
      )}

      <div
        ref={scrollRef}
        {...handlers}
        style={{ flex: 1, overflowY: 'auto', paddingTop: pullDistance > 0 ? 0 : 20 }}
      >
        {TABS.map((t) => (
          <div key={t} style={{ display: tab === t ? 'block' : 'none', animation: tab === t ? 'fadeUp 0.3s ease' : 'none' }}>
            {t === 'dashboard' && (
              <Dashboard
                habits={habits}
                journalEntry={journal}
                onHabitToggle={toggleHabit}
                onJournalChange={setJournal}
                onNavigate={setTab}
                committed={committed}
                onCommit={onCommit}
              />
            )}
            {t === 'tasks' && <TasksPanel />}
            {t === 'knowledge' && <KnowledgePanel captures={captures} />}
            {t === 'goals' && <GoalsPanel />}
          </div>
        ))}
      </div>

      <FloatingCapture onClick={() => setCaptureOpen(true)} />
      <BottomNav activeTab={tab} onTabChange={setTab} />
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onNavigate={setTab}
        onCapture={() => setCaptureOpen(true)}
      />
      <CaptureModal
        open={captureOpen}
        onClose={() => setCaptureOpen(false)}
        onCapture={addCapture}
      />
    </div>
  );
}

const containerStyle = {
  background: colors.bg,
  color: colors.text,
  minHeight: '100vh',
  maxWidth: 480,
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
};
