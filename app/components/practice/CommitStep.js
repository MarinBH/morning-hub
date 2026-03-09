'use client';
import { useState } from 'react';
import { colors, radius, spacing } from '../../lib/theme';
import { useTasks } from '../../contexts/TasksContext';
import { useCalendarEvents } from '../../contexts/CalendarContext';
import { fmtTime } from '../../lib/utils';

export default function CommitStep({ onCommit, committed }) {
  const { tasks, loading } = useTasks();
  const { events } = useCalendarEvents();
  const [intention, setIntention] = useState('');

  const topTasks = tasks.filter((t) => t.priority >= 3).slice(0, 3);
  const displayTasks = topTasks.length > 0 ? topTasks : tasks.slice(0, 3);
  const nextEvent = events[0];

  const handleCommit = () => {
    onCommit(intention);
  };

  if (committed) {
    return (
      <div style={{ textAlign: 'center', padding: `${spacing.xl}px 0` }}>
        <div style={{ fontSize: 32, marginBottom: spacing.md }}>{'\u2713'}</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: colors.success }}>
          Locked in for today
        </div>
        {intention && (
          <div style={{ fontSize: 14, color: colors.textDim, marginTop: spacing.sm, fontStyle: 'italic' }}>
            &ldquo;{intention}&rdquo;
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Top priorities */}
      {loading ? (
        <div style={{ fontSize: 14, color: colors.textDim, textAlign: 'center' }}>Loading tasks...</div>
      ) : displayTasks.length > 0 ? (
        <div style={{ marginBottom: spacing.xl }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.md }}>
            Top priorities
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
            {displayTasks.map((task, i) => (
              <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 6,
                  background: i === 0 ? 'rgba(108,155,255,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `1.5px solid ${i === 0 ? colors.primary : colors.textGhost}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: i === 0 ? colors.primary : colors.textFaint,
                }}>
                  {i + 1}
                </div>
                <span style={{ fontSize: 14, color: colors.text, fontWeight: i === 0 ? 600 : 400 }}>
                  {task.content}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', fontSize: 14, color: colors.textDim, marginBottom: spacing.xl }}>
          No tasks loaded
        </div>
      )}

      {/* Next event */}
      {nextEvent && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: spacing.sm,
          padding: `${spacing.md}px`, borderRadius: radius.sm,
          background: 'rgba(108,155,255,0.06)',
          border: '1px solid rgba(108,155,255,0.1)',
          marginBottom: spacing.xl, fontSize: 13,
        }}>
          <span>{'\u{1F4C5}'}</span>
          <span style={{ color: colors.textDim }}>
            Next: <span style={{ color: colors.text }}>{nextEvent.summary}</span>
            {nextEvent.start && (
              <span style={{ color: colors.textFaint }}> {'\u00B7'} {fmtTime(nextEvent.start)}</span>
            )}
          </span>
        </div>
      )}

      {/* Intention field */}
      <div style={{ marginBottom: spacing.xl }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm }}>
          My focus today
        </div>
        <input
          type="text"
          value={intention}
          onChange={(e) => setIntention(e.target.value)}
          placeholder="What matters most today?"
          style={{
            width: '100%', padding: `${spacing.md}px ${spacing.lg}px`,
            borderRadius: radius.sm,
            border: `1px solid ${colors.border}`,
            background: 'rgba(255,255,255,0.03)',
            color: colors.text, fontSize: 15,
            fontFamily: "'DM Sans', -apple-system, sans-serif",
            outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Lock in button */}
      <button
        onClick={handleCommit}
        style={{
          width: '100%', padding: `${spacing.lg}px`,
          borderRadius: radius.sm, border: 'none',
          background: colors.gradient, color: '#fff',
          fontSize: 16, fontWeight: 600, cursor: 'pointer',
          letterSpacing: 0.5, minHeight: 48,
        }}
      >
        {'\u26A1'} Lock in my day
      </button>
    </div>
  );
}
