'use client';
import { useState } from 'react';
import { colors, radius, spacing, typography } from '../../lib/theme';
import { getDateString, fmtTime } from '../../lib/utils';
import { isTaskOverdue } from '../../lib/utils';
import { HABITS, getPrompt, PRIORITY_COLORS } from '../../lib/constants';
import { useTasks } from '../../contexts/TasksContext';
import { useCalendarEvents } from '../../contexts/CalendarContext';
import { useWheelOfLifeContext } from '../../contexts/WheelOfLifeContext';
import Card from '../common/Card';
import ProgressBar from '../common/ProgressBar';
import Badge from '../common/Badge';
import WheelOfLife from '../common/WheelOfLife';
import Skeleton, { SkeletonCard } from '../common/Skeleton';
import HabitList from '../practice/HabitList';
import BreathworkSection from '../practice/BreathworkSection';
import JournalEntry from '../practice/JournalEntry';

export default function Dashboard({ habits, journalEntry, onHabitToggle, onJournalChange, onNavigate, committed, onCommit, habitConfig }) {
  const { tasks, loading: loadingTasks, error: errorTasks } = useTasks();
  const { events, loading: loadingEvents, error: errorEvents } = useCalendarEvents();
  const [practiceOpen, setPracticeOpen] = useState(true);

  const habitDefs = habitConfig?.habits?.length > 0 ? habitConfig.habits : HABITS;
  const completedHabits = habits.length;
  const totalHabits = habitDefs.length;
  const habitProgress = totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0;
  const prompt = getPrompt();

  const nextEvent = events[0];
  const highPriorityTasks = tasks.filter((t) => t.priority >= 3);
  const previewTasks = tasks.slice(0, 5);

  return (
    <div style={{ padding: `0 ${spacing.xl}px 100px` }}>
      {/* Date */}
      <div style={{ marginBottom: spacing.xxl }}>
        <div style={typography.label}>{getDateString().toUpperCase()}</div>
      </div>

      {/* AI Briefing Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(108,155,255,0.08), rgba(139,108,255,0.08))',
          borderRadius: radius.md,
          padding: `${spacing.xl}px`,
          marginBottom: spacing.lg,
          border: '1px solid rgba(108,155,255,0.12)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
          <span style={{ fontSize: 16 }}>{'\u26A1'}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: colors.primary, textTransform: 'uppercase', letterSpacing: 1 }}>
            Today&apos;s Focus
          </span>
        </div>

        {loadingTasks ? (
          <div style={{ fontSize: 14, color: colors.textDim }}>Loading priorities...</div>
        ) : errorTasks ? (
          <div style={{ fontSize: 14, color: colors.danger }}>Failed to load tasks</div>
        ) : highPriorityTasks.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
            {highPriorityTasks.slice(0, 3).map((task, i) => (
              <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 6,
                  background: i === 0 ? 'rgba(108,155,255,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `1.5px solid ${i === 0 ? colors.primary : colors.textGhost}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, color: i === 0 ? colors.primary : colors.textFaint,
                }}>
                  {i + 1}
                </div>
                <span style={{
                  fontSize: 14, color: i === 0 ? colors.text : 'rgba(240,237,230,0.7)',
                  fontWeight: i === 0 ? 600 : 400,
                }}>
                  {task.content}
                </span>
              </div>
            ))}
          </div>
        ) : previewTasks.length > 0 ? (
          <div style={{ fontSize: 14, color: colors.textMuted }}>
            {previewTasks.length} tasks today {'\u2014'} no high-priority items flagged
          </div>
        ) : (
          <div style={{ fontSize: 14, color: colors.textMuted }}>
            No tasks for today
          </div>
        )}

        {nextEvent && (
          <div style={{
            marginTop: spacing.md, paddingTop: spacing.md,
            borderTop: '1px solid rgba(108,155,255,0.1)',
            display: 'flex', alignItems: 'center', gap: spacing.sm,
          }}>
            <span style={{ fontSize: 12 }}>{'\u{1F4C5}'}</span>
            <span style={{ fontSize: 13, color: colors.textDim }}>
              Next: <span style={{ color: colors.text }}>{nextEvent.summary}</span>
              {nextEvent.start && (
                <span style={{ color: colors.textFaint }}>
                  {' '}{'\u00B7'} {fmtTime(nextEvent.start)}
                </span>
              )}
            </span>
          </div>
        )}

        {/* Start my day button */}
        {!committed && !loadingTasks && (
          <button
            onClick={onCommit}
            style={{
              width: '100%',
              marginTop: spacing.md,
              padding: `${spacing.md}px`,
              borderRadius: radius.sm,
              border: 'none',
              background: colors.gradient,
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              letterSpacing: 0.5,
              transition: 'opacity 0.2s',
            }}
          >
            {'\u26A1'} Start my day
          </button>
        )}
        {committed && (
          <div style={{
            marginTop: spacing.md,
            padding: `${spacing.sm}px`,
            textAlign: 'center',
            fontSize: 13,
            color: colors.success,
          }}>
            {'\u2713'} Locked in &mdash; let&apos;s go
          </div>
        )}
      </div>

      {/* Morning Practice */}
      <Card
        collapsible
        collapsed={!practiceOpen}
        onToggle={() => setPracticeOpen(!practiceOpen)}
        title="Morning Practice"
        subtitle={`${completedHabits}/${totalHabits} habits ${'\u00B7'} ${journalEntry ? 'journal \u2713' : 'journal pending'}`}
        icon={'\u{1F305}'}
        action={<ProgressBar value={habitProgress} max={100} height={4} style={{ width: 48 }} />}
        style={{ marginBottom: spacing.lg }}
      >
        <div style={{ marginBottom: spacing.xl }}>
          <HabitList habits={habits} onToggle={onHabitToggle} habitDefs={habitDefs} compact />
        </div>
        <div style={{ marginBottom: spacing.xl }}>
          <BreathworkSection label="4-4-6" compact />
        </div>
        <JournalEntry value={journalEntry} onChange={onJournalChange} prompt={prompt} compact />
      </Card>

      {/* Tasks Overview */}
      <Card
        title="Tasks"
        subtitle={loadingTasks ? 'Loading...' : errorTasks ? 'Error' : `${previewTasks.length} due today`}
        icon={'\u2705'}
        action={
          <button
            onClick={() => onNavigate('tasks')}
            style={{ fontSize: 12, color: colors.primary, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
          >
            View all {'\u2192'}
          </button>
        }
        style={{ marginBottom: spacing.lg }}
      >
        {loadingTasks ? (
          <SkeletonCard lines={3} />
        ) : errorTasks ? (
          <div style={{ padding: spacing.xl, textAlign: 'center', color: colors.danger, fontSize: 14 }}>Could not load tasks</div>
        ) : previewTasks.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {previewTasks.slice(0, 4).map((task) => {
              const overdue = isTaskOverdue(task);
              return (
                <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: 4, flexShrink: 0,
                    background: PRIORITY_COLORS[task.priority] || PRIORITY_COLORS[1],
                  }} />
                  <span style={{ fontSize: 14, color: colors.text, flex: 1 }}>{task.content}</span>
                  {overdue && <Badge color={colors.danger} bg={colors.dangerBg}>overdue</Badge>}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: spacing.lg, textAlign: 'center', color: colors.textFaint, fontSize: 14 }}>
            All clear! {'\u{1F389}'}
          </div>
        )}
      </Card>

      {/* Calendar Preview */}
      <Card
        title="Schedule"
        subtitle={loadingEvents ? 'Loading...' : errorEvents ? 'Error' : `${events.length} events`}
        icon={'\u{1F4C5}'}
        style={{ marginBottom: spacing.lg }}
      >
        {loadingEvents ? (
          <SkeletonCard lines={2} />
        ) : errorEvents ? (
          <div style={{ padding: spacing.xl, textAlign: 'center', color: colors.danger, fontSize: 14 }}>Could not load calendar</div>
        ) : events.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {events.slice(0, 4).map((ev, i) => (
              <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                <div style={{
                  width: 3, height: 28, borderRadius: 2, flexShrink: 0,
                  background: ev.color || colors.events[i % colors.events.length],
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: colors.text }}>{ev.summary}</div>
                  <div style={{ fontSize: 12, color: colors.textFaint }}>{fmtTime(ev.start)}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: spacing.lg, textAlign: 'center', color: colors.textFaint, fontSize: 14 }}>No events today</div>
        )}
      </Card>

      {/* Wheel of Life */}
      <Card
        title="Life Balance"
        subtitle="Wheel of Life"
        icon={'\u{1F3AF}'}
        action={
          <button
            onClick={() => onNavigate('goals')}
            style={{ fontSize: 12, color: colors.primary, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
          >
            Details {'\u2192'}
          </button>
        }
        style={{ marginBottom: spacing.lg }}
      >
        <WheelOfLifeMini onNavigate={onNavigate} />
      </Card>

      {/* Knowledge Placeholder */}
      <Card
        title="Knowledge"
        subtitle="Capture links, articles, and ideas"
        icon={'\u{1F4DA}'}
        style={{ marginBottom: spacing.lg }}
      >
        <div
          onClick={() => onNavigate('knowledge')}
          style={{ padding: `${spacing.xl}px`, textAlign: 'center', cursor: 'pointer' }}
        >
          <div style={{ fontSize: 32, marginBottom: spacing.sm }}>{'\u{1F9E0}'}</div>
          <div style={{ fontSize: 14, color: colors.textDim, marginBottom: spacing.sm }}>Your personal knowledge base</div>
          <div style={{ fontSize: 13, color: colors.primary, fontWeight: 500 }}>Start capturing {'\u2192'}</div>
        </div>
      </Card>
    </div>
  );
}

function WheelOfLifeMini({ onNavigate }) {
  const { scores } = useWheelOfLifeContext();
  const hasScores = Object.values(scores).some((v) => v > 0);

  if (!hasScores) {
    return (
      <div onClick={() => onNavigate('goals')} style={{ padding: `${spacing.lg}px`, textAlign: 'center', cursor: 'pointer' }}>
        <WheelOfLife scores={{}} size={200} />
        <div style={{ fontSize: 13, color: colors.textDim, marginTop: spacing.sm }}>
          Tap to rate your life areas and set goals
        </div>
      </div>
    );
  }

  return (
    <div onClick={() => onNavigate('goals')} style={{ cursor: 'pointer' }}>
      <WheelOfLife scores={scores} size={220} />
    </div>
  );
}
