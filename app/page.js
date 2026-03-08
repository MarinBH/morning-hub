'use client';
import { useState } from 'react';
import { colors } from './lib/theme';
import { useTodayState } from './hooks/useTodayState';
import { TasksProvider } from './contexts/TasksContext';
import { CalendarProvider } from './contexts/CalendarContext';

import Header from './components/layout/Header';
import BottomNav from './components/layout/BottomNav';
import FloatingCapture from './components/layout/FloatingCapture';
import Dashboard from './components/dashboard/Dashboard';
import TasksPanel from './components/tasks/TasksPanel';
import GoalsPanel from './components/goals/GoalsPanel';
import KnowledgePanel from './components/knowledge/KnowledgePanel';
import CaptureModal from './components/capture/CaptureModal';

const TABS = ['dashboard', 'tasks', 'knowledge', 'goals'];

export default function CommandCenter() {
  const [tab, setTab] = useState('dashboard');
  const [captureOpen, setCaptureOpen] = useState(false);
  const { habits, journal, captures, loaded, momentumScore, toggleHabit, setJournal, addCapture } = useTodayState();

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
        <div style={containerStyle}>
          <Header
            momentumScore={momentumScore}
            captureCount={captures.length}
          />

          <div style={{ flex: 1, overflowY: 'auto', paddingTop: 20 }}>
            {TABS.map((t) => (
              <div key={t} style={{ display: tab === t ? 'block' : 'none', animation: tab === t ? 'fadeUp 0.3s ease' : 'none' }}>
                {t === 'dashboard' && (
                  <Dashboard
                    habits={habits}
                    journalEntry={journal}
                    onHabitToggle={toggleHabit}
                    onJournalChange={setJournal}
                    onNavigate={setTab}
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
          <CaptureModal
            open={captureOpen}
            onClose={() => setCaptureOpen(false)}
            onCapture={addCapture}
          />
        </div>
      </CalendarProvider>
    </TasksProvider>
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
