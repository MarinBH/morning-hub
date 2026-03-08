'use client';
import { useState, useCallback } from 'react';
import { colors, radius, spacing, typography } from '../../lib/theme';
import { isTaskOverdue } from '../../lib/utils';
import { PRIORITY_COLORS, API } from '../../lib/constants';
import { useTasks } from '../../contexts/TasksContext';
import Badge from '../common/Badge';

export default function TasksPanel() {
  const { tasks, projects, loading, error, removeTask } = useTasks();
  const [completing, setCompleting] = useState(new Set());

  const completeTask = useCallback(async (taskId) => {
    setCompleting((prev) => new Set(prev).add(taskId));
    try {
      await fetch(API.todoist, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, action: 'complete' }),
      });
      setTimeout(() => {
        removeTask(taskId);
        setCompleting((prev) => {
          const n = new Set(prev);
          n.delete(taskId);
          return n;
        });
      }, 600);
    } catch {
      setCompleting((prev) => {
        const n = new Set(prev);
        n.delete(taskId);
        return n;
      });
    }
  }, [removeTask]);

  return (
    <div style={{ padding: `0 ${spacing.xl}px 100px` }}>
      <div style={{ marginBottom: spacing.xxl }}>
        <div style={typography.label}>TODAY&apos;S TASKS</div>
        <div style={{ fontSize: 14, color: colors.textDim }}>
          {loading ? 'Loading...' : `${tasks.length} tasks \u00B7 tap to complete`}
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: `${spacing.lg}px 18px`,
            background: colors.dangerBg,
            borderRadius: radius.md,
            border: `1px solid ${colors.dangerBorder}`,
            marginBottom: spacing.lg,
          }}
        >
          <div style={{ fontSize: 13, color: colors.danger }}>{'\u26A0\uFE0F'} {error}</div>
          <div style={{ fontSize: 12, color: colors.textDim, marginTop: 4 }}>
            Check TODOIST_API_TOKEN in Vercel env vars
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: colors.textFaint }}>
          Loading tasks...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tasks.map((task) => {
            const done = completing.has(task.id);
            const overdue = isTaskOverdue(task);
            return (
              <div
                key={task.id}
                onClick={() => !done && completeTask(task.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  background: done ? 'rgba(108,255,184,0.04)' : colors.bgCard,
                  borderRadius: radius.md,
                  padding: `${spacing.md}px ${spacing.lg}px`,
                  cursor: 'pointer',
                  transition: 'all 0.5s',
                  opacity: done ? 0.3 : 1,
                  transform: done ? 'translateX(20px)' : 'none',
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 7,
                    flexShrink: 0,
                    border: done
                      ? `2px solid ${colors.success}`
                      : `2px solid ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS[1]}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: done ? 'rgba(108,255,184,0.15)' : 'transparent',
                    transition: 'all 0.3s',
                  }}
                >
                  {done && (
                    <span style={{ fontSize: 13, color: colors.success }}>{'\u2713'}</span>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 15,
                      lineHeight: 1.4,
                      color: done ? colors.textDim : colors.text,
                      textDecoration: done ? 'line-through' : 'none',
                    }}
                  >
                    {task.content}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
                    <span
                      style={{
                        fontSize: 11,
                        color: colors.textGhost,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}
                    >
                      {projects[task.project_id] || 'Inbox'}
                    </span>
                    {overdue && <Badge color={colors.danger} bg={colors.dangerBg}>overdue</Badge>}
                  </div>
                </div>
              </div>
            );
          })}
          {tasks.length === 0 && !error && (
            <div style={{ textAlign: 'center', padding: 40, color: colors.textFaint }}>
              All clear for today! {'\u{1F389}'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
