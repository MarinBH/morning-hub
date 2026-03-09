'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import { colors, spacing } from './lib/theme';
import { loadLocal, saveLocal, todayKey } from './lib/utils';
import { useTodayState } from './hooks/useTodayState';
import { useHabitConfig } from './hooks/useHabitConfig';
import { usePullToRefresh } from './hooks/usePullToRefresh';
import { TasksProvider, useTasks } from './contexts/TasksContext';
import { CalendarProvider, useCalendarEvents } from './contexts/CalendarContext';
import { WheelOfLifeProvider } from './contexts/WheelOfLifeContext';

import Header from './components/layout/Header';
import BottomNav from './components/layout/BottomNav';
import FloatingCapture from './components/layout/FloatingCapture';
import CommandPalette from './components/layout/CommandPalette';
import Dashboard from './components/dashboard/Dashboard';
import TasksPanel from './components/tasks/TasksPanel';
import PracticePanel from './components/practice/PracticePanel';
import GoalsPanel from './components/goals/GoalsPanel';
import CaptureModal from './components/capture/CaptureModal';
import ErrorBoundary from './components/common/ErrorBoundary';

const TABS = ['dashboard', 'tasks', 'practice', 'goals'];

export default function CommandCenter() {
  const [tab, setTab] = useState('dashboard');
  const [captureOpen, setCaptureOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [committed, setCommitted] = useState(() => {
    if (typeof window === 'undefined') return false;
    return loadLocal(`hub-committed-${todayKey()}`, false);
  });
  const habitConfig = useHabitConfig();
  const { habits, journal, captures, breathworkDone, loaded, momentumScore, streakDays, toggleHabit, setJournal, addCapture, setBreathworkDone } = useTodayState(habitConfig.habits.length || undefined);

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
        <WheelOfLifeProvider>
        <ErrorBoundary>
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
          breathworkDone={breathworkDone}
          momentumScore={momentumScore}
          streakDays={streakDays}
          toggleHabit={toggleHabit}
          setJournal={setJournal}
          addCapture={addCapture}
          setBreathworkDone={setBreathworkDone}
          habitConfig={habitConfig}
        />
        </ErrorBoundary>
        </WheelOfLifeProvider>
      </CalendarProvider>
    </TasksProvider>
  );
}

// Inner component that can access context for pull-to-refresh
function AppShell({
  tab, setTab, captureOpen, setCaptureOpen, paletteOpen, setPaletteOpen,
  committed, onCommit, habits, journal, captures, breathworkDone, momentumScore, streakDays,
  toggleHabit, setJournal, addCapture, setBreathworkDone, habitConfig,
}) {
  const { refetch: refetchTasks } = useTasks();
  const { refetch: refetchCalendar } = useCalendarEvents();
  const scrollRef = useRef(null);
  const [installPrompt, setInstallPrompt] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

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
                habitConfig={habitConfig}
              />
            )}
            {t === 'tasks' && <TasksPanel />}
            {t === 'practice' && (
              <PracticePanel
                habits={habits}
                journalEntry={journal}
                onHabitToggle={toggleHabit}
                onJournalChange={setJournal}
                habitConfig={habitConfig}
              />
            )}
            {t === 'goals' && <GoalsPanel />}
          </div>
        ))}
      </div>

      {installPrompt && (
        <div style={{
          position: 'fixed', bottom: 75, left: '50%', transform: 'translateX(-50%)',
          width: 'calc(100% - 40px)', maxWidth: 440, padding: '12px 16px',
          background: colors.bgElevated, borderRadius: 12,
          border: `1px solid ${colors.borderActive}`,
          display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: '0 8px 30px rgba(0,0,0,0.4)', zIndex: 101,
        }}>
          <div style={{ flex: 1, fontSize: 13, color: colors.text }}>
            Add to home screen for the best experience
          </div>
          <button
            onClick={() => { installPrompt.prompt(); setInstallPrompt(null); }}
            style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: colors.gradient, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >Install</button>
          <button
            onClick={() => setInstallPrompt(null)}
            style={{ padding: '8px', border: 'none', background: 'transparent', color: colors.textFaint, fontSize: 16, cursor: 'pointer' }}
            aria-label="Dismiss"
          >{'\u2715'}</button>
        </div>
      )}

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
