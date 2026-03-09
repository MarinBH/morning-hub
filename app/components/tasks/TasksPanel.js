'use client';
import { useState, useCallback, useRef } from 'react';
import { colors, radius, spacing, typography } from '../../lib/theme';
import { API } from '../../lib/constants';
import { useTasks } from '../../contexts/TasksContext';
import KanbanView from './KanbanView';
import QuickAdd from './QuickAdd';
import TaskEditor from './TaskEditor';

export default function TasksPanel() {
  const { allTasks, projects, loading, error, removeTask, addTask } = useTasks();
  const [completing, setCompleting] = useState(new Set());
  const [completeError, setCompleteError] = useState(null);
  const [undoTask, setUndoTask] = useState(null);
  const undoTimerRef = useRef(null);
  const [expanded, setExpanded] = useState(null);
  const [activeColumn, setActiveColumn] = useState('today');

  const completeTask = useCallback((taskId) => {
    const task = allTasks.find((t) => t.id === taskId);
    setCompleting((prev) => new Set(prev).add(taskId));
    setUndoTask(task);
    setCompleteError(null);

    clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(async () => {
      setUndoTask(null);
      try {
        const res = await fetch(API.todoist, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId, action: 'complete' }),
        });
        if (!res.ok) throw new Error('Failed to complete task');
        removeTask(taskId);
      } catch {
        setCompleteError('Could not complete task. Please try again.');
        setTimeout(() => setCompleteError(null), 3000);
      }
      setCompleting((prev) => {
        const n = new Set(prev);
        n.delete(taskId);
        return n;
      });
    }, 3000);
  }, [allTasks, removeTask]);

  const handleUndo = useCallback(() => {
    clearTimeout(undoTimerRef.current);
    if (undoTask) {
      setCompleting((prev) => {
        const n = new Set(prev);
        n.delete(undoTask.id);
        return n;
      });
      setUndoTask(null);
    }
  }, [undoTask]);

  return (
    <div style={{ padding: `0 ${spacing.xl}px 100px`, display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: spacing.xxl }}>
        <div style={typography.label}>TASKS</div>
        <div style={{ fontSize: 14, color: colors.textDim }}>
          {loading ? 'Loading...' : `${allTasks.length} total tasks`}
        </div>
      </div>

      {error && (
        <div style={{
          padding: `${spacing.lg}px 18px`, background: colors.dangerBg,
          borderRadius: radius.md, border: `1px solid ${colors.dangerBorder}`,
          marginBottom: spacing.lg,
        }}>
          <div style={{ fontSize: 13, color: colors.danger }}>{'\u26A0\uFE0F'} Could not connect to Todoist</div>
          <div style={{ fontSize: 12, color: colors.textDim, marginTop: 4 }}>
            Pull down to refresh or check your connection
          </div>
        </div>
      )}

      {completeError && (
        <div style={{ padding: `${spacing.sm}px 18px`, background: colors.dangerBg, borderRadius: radius.md, marginBottom: spacing.sm, fontSize: 13, color: colors.danger }}>
          {completeError}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: colors.textFaint }}>Loading tasks...</div>
      ) : (
        <KanbanView
          allTasks={allTasks}
          projects={projects}
          completing={completing}
          onComplete={completeTask}
          onExpand={setExpanded}
          onColumnChange={setActiveColumn}
        />
      )}

      {/* Task editor bottom sheet */}
      {expanded && (
        <TaskEditor
          task={expanded}
          projects={projects}
          onClose={() => setExpanded(null)}
        />
      )}

      {/* Undo toast */}
      {undoTask && (
        <div style={{
          position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
          width: 'calc(100% - 40px)', maxWidth: 440,
          padding: `${spacing.md}px ${spacing.lg}px`,
          background: colors.bgElevated,
          borderRadius: radius.md, border: `1px solid ${colors.borderActive}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 8px 30px rgba(0,0,0,0.4)', zIndex: 150,
          animation: 'fadeUp 0.2s ease',
        }}>
          <span style={{ fontSize: 14, color: colors.text }}>
            {'\u2713'} Task completed
          </span>
          <button
            onClick={handleUndo}
            style={{
              padding: `${spacing.sm}px ${spacing.lg}px`,
              borderRadius: radius.sm, border: 'none',
              background: colors.primaryBg, color: colors.primary,
              fontSize: 13, fontWeight: 600, cursor: 'pointer', minHeight: 36,
            }}
          >
            Undo
          </button>
        </div>
      )}

      <QuickAdd onTaskAdded={addTask} activeColumn={activeColumn} />
    </div>
  );
}
