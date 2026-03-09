'use client';
import { useState, useRef } from 'react';
import { colors, radius, spacing } from '../../lib/theme';
import { todayKey } from '../../lib/utils';
import { useTaskGoals } from '../../contexts/TaskGoalsContext';
import TaskCard from './TaskCard';

const COLUMNS = [
  { id: 'inbox', label: 'Inbox', icon: '\u{1F4E5}' },
  { id: 'today', label: 'Today', icon: '\u26A1' },
  { id: 'week', label: 'This Week', icon: '\u{1F4C5}' },
  { id: 'backlog', label: 'Backlog', icon: '\u{1F4E6}' },
];

function categorizeTasks(allTasks) {
  const today = todayKey();
  const weekEnd = (() => {
    const d = new Date();
    d.setDate(d.getDate() + (7 - d.getDay()));
    return d.toISOString().split('T')[0];
  })();

  const inbox = [];
  const todayTasks = [];
  const week = [];
  const backlog = [];

  for (const t of allTasks) {
    const due = t.due?.date;
    if (!due) {
      inbox.push(t);
    } else if (due <= today) {
      todayTasks.push(t);
    } else if (due <= weekEnd) {
      week.push(t);
    } else {
      backlog.push(t);
    }
  }

  return { inbox, today: todayTasks, week, backlog };
}

export default function KanbanView({ allTasks, projects, completing, onComplete, onExpand, onColumnChange }) {
  const { getTaskGoal } = useTaskGoals();
  const [activeCol, setActiveCol] = useState('today');
  const touchStartRef = useRef(null);

  const categorized = categorizeTasks(allTasks);

  const currentIdx = COLUMNS.findIndex((c) => c.id === activeCol);

  const touchStartYRef = useRef(null);

  const handleTouchStart = (e) => {
    touchStartRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (touchStartRef.current === null) return;
    const diffX = touchStartRef.current - e.changedTouches[0].clientX;
    const diffY = touchStartYRef.current - e.changedTouches[0].clientY;
    touchStartRef.current = null;
    touchStartYRef.current = null;
    // Only swipe if horizontal movement dominates vertical (#18)
    const diff = diffX;
    if (Math.abs(diffX) > 80 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
      if (diff > 0 && currentIdx < COLUMNS.length - 1) {
        const newCol = COLUMNS[currentIdx + 1].id;
        setActiveCol(newCol);
        onColumnChange?.(newCol);
      } else if (diff < 0 && currentIdx > 0) {
        const newCol = COLUMNS[currentIdx - 1].id;
        setActiveCol(newCol);
        onColumnChange?.(newCol);
      }
    }
  };

  const tasks = categorized[activeCol] || [];

  return (
    <div>
      {/* Column tabs */}
      <div style={{
        display: 'flex', gap: 0,
        borderBottom: `1px solid ${colors.border}`,
        marginBottom: spacing.lg,
        overflowX: 'auto',
      }}>
        {COLUMNS.map((col) => {
          const count = (categorized[col.id] || []).length;
          const active = activeCol === col.id;
          return (
            <button
              key={col.id}
              onClick={() => { setActiveCol(col.id); onColumnChange?.(col.id); }}
              style={{
                flex: 1, padding: `${spacing.md}px ${spacing.sm}px`,
                background: 'none', border: 'none',
                borderBottom: active ? `2px solid ${colors.primary}` : '2px solid transparent',
                color: active ? colors.text : colors.textDim,
                fontSize: 13, fontWeight: active ? 600 : 400,
                cursor: 'pointer', minHeight: 44,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                whiteSpace: 'nowrap',
              }}
            >
              <span>{col.icon}</span>
              <span>{col.label}</span>
              {count > 0 && (
                <span style={{
                  fontSize: 11, fontWeight: 600,
                  background: active ? 'rgba(108,155,255,0.15)' : 'rgba(255,255,255,0.06)',
                  color: active ? colors.primary : colors.textFaint,
                  padding: '2px 6px', borderRadius: 10,
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Task list — swipeable */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ minHeight: 200 }}
      >
        {tasks.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                projects={projects}
                completing={completing.has(task.id)}
                onComplete={onComplete}
                onExpand={onExpand}
                impactScore={getTaskGoal(task.id)?.impactScore || 0}
              />
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center', padding: 40, color: colors.textFaint, fontSize: 14,
          }}>
            {activeCol === 'inbox' ? 'Inbox is empty' :
             activeCol === 'today' ? 'All clear for today! \u{1F389}' :
             activeCol === 'week' ? 'Nothing scheduled this week' :
             'No backlog tasks'}
          </div>
        )}
      </div>
    </div>
  );
}
