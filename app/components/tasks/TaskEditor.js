'use client';
import { useState, useCallback, useRef } from 'react';
import { colors, radius, spacing, typography } from '../../lib/theme';
import { PRIORITY_COLORS, API, WHEEL_OF_LIFE_AREAS } from '../../lib/constants';
import { useTasks } from '../../contexts/TasksContext';
import { useTaskGoals } from '../../contexts/TaskGoalsContext';
import { useWheelOfLifeContext } from '../../contexts/WheelOfLifeContext';

export default function TaskEditor({ task, projects, onClose }) {
  const { updateTask } = useTasks();
  const { getTaskGoal, linkTask, unlinkTask } = useTaskGoals();
  const { goals } = useWheelOfLifeContext();
  const existingGoal = getTaskGoal(task.id);
  const [selectedDomain, setSelectedDomain] = useState(existingGoal?.domainId || null);
  const [selectedMilestone, setSelectedMilestone] = useState(existingGoal?.milestoneId || null);
  const [impactScore, setImpactScore] = useState(existingGoal?.impactScore || 0);
  const [content, setContent] = useState(task.content || '');
  const [description, setDescription] = useState(task.description || '');
  const [priority, setPriority] = useState(task.priority || 1);
  const [dueDate, setDueDate] = useState(task.due?.date || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const saveTimerRef = useRef(null);

  const projectName = projects[task.project_id] || 'Inbox';

  const handleSave = useCallback(async () => {
    const trimmed = content.trim();
    if (!trimmed) {
      setError('Task content cannot be empty');
      return;
    }

    setSaving(true);
    setError(null);

    // Build updates object — only include changed fields
    const updates = {};
    if (trimmed !== task.content) updates.content = trimmed;
    if (description !== (task.description || '')) updates.description = description;
    if (priority !== task.priority) updates.priority = priority;
    const currentDue = task.due?.date || '';
    if (dueDate !== currentDue) updates.due_string = dueDate || '';

    // Save goal link + impact changes (localStorage, no API call needed)
    const prevDomain = existingGoal?.domainId || null;
    const prevMilestone = existingGoal?.milestoneId || null;
    const prevImpact = existingGoal?.impactScore || 0;
    const goalChanged = selectedDomain !== prevDomain || selectedMilestone !== prevMilestone || impactScore !== prevImpact;
    if (goalChanged) {
      if (selectedDomain || impactScore > 0) {
        linkTask(task.id, {
          domainId: selectedDomain || null,
          milestoneId: selectedMilestone || null,
          impactScore: impactScore || 0,
        });
      } else {
        unlinkTask(task.id);
      }
    }

    // Nothing changed in Todoist fields
    if (Object.keys(updates).length === 0) {
      onClose();
      return;
    }

    // Optimistic update
    const optimistic = { ...updates };
    if (updates.due_string !== undefined) {
      optimistic.due = dueDate ? { date: dueDate } : null;
      delete optimistic.due_string;
    }
    updateTask(task.id, optimistic);

    try {
      const res = await fetch(API.todoist, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: task.id, action: 'update', ...updates }),
      });

      if (!res.ok) throw new Error('Failed to update task');
      setSaving(false);
      onClose();
      return;
    } catch {
      // Rollback Todoist fields
      updateTask(task.id, {
        content: task.content,
        description: task.description || '',
        priority: task.priority,
        due: task.due || null,
      });
      // Rollback goal link if it was changed
      if (goalChanged) {
        if (prevDomain || prevImpact > 0) {
          linkTask(task.id, {
            domainId: prevDomain,
            milestoneId: prevMilestone,
            impactScore: prevImpact,
          });
        } else {
          unlinkTask(task.id);
        }
      }
      setError('Could not update task. Try again.');
      setSaving(false);
    }
  }, [content, description, priority, dueDate, task, updateTask, onClose, selectedDomain, selectedMilestone, impactScore, existingGoal, linkTask, unlinkTask]);

  const priorities = [
    { value: 4, label: 'P1', color: colors.p1 },
    { value: 3, label: 'P2', color: colors.p2 },
    { value: 2, label: 'P3', color: colors.p3 },
    { value: 1, label: 'P4', color: colors.p4 },
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480,
          maxHeight: '70vh', overflowY: 'auto',
          background: colors.bgElevated,
          borderRadius: `${radius.lg}px ${radius.lg}px 0 0`,
          padding: `${spacing.xl}px ${spacing.xl}px ${spacing.xxxl}px`,
        }}
      >
        {/* Drag handle */}
        <div style={{ width: 40, height: 4, borderRadius: 2, background: colors.textGhost, margin: '0 auto 16px' }} />

        {/* Content input */}
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Task name"
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: `${spacing.md}px ${spacing.lg}px`,
            fontSize: 17, fontWeight: 600, color: colors.text,
            background: colors.bgCard, border: `1px solid ${colors.borderActive}`,
            borderRadius: radius.sm, outline: 'none',
            minHeight: 44,
          }}
        />

        {/* Description */}
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          rows={2}
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: `${spacing.md}px ${spacing.lg}px`,
            fontSize: 14, color: colors.textMuted,
            background: colors.bgCard, border: `1px solid ${colors.border}`,
            borderRadius: radius.sm, outline: 'none',
            marginTop: spacing.sm, resize: 'vertical',
            fontFamily: 'inherit', lineHeight: 1.5,
          }}
        />

        {/* Priority chips */}
        <div style={{ marginTop: spacing.lg }}>
          <div style={{ ...typography.label, marginBottom: spacing.sm }}>PRIORITY</div>
          <div style={{ display: 'flex', gap: spacing.sm }}>
            {priorities.map((p) => (
              <button
                key={p.value}
                onClick={() => setPriority(p.value)}
                style={{
                  flex: 1, minHeight: 44,
                  padding: `${spacing.sm}px`,
                  borderRadius: radius.sm, cursor: 'pointer',
                  border: priority === p.value ? `2px solid ${p.color}` : `1px solid ${colors.border}`,
                  background: priority === p.value ? `${p.color}15` : 'transparent',
                  color: priority === p.value ? p.color : colors.textDim,
                  fontSize: 14, fontWeight: 600,
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Due date */}
        <div style={{ marginTop: spacing.lg }}>
          <div style={{ ...typography.label, marginBottom: spacing.sm }}>DUE DATE</div>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: `${spacing.md}px ${spacing.lg}px`,
              fontSize: 14, color: colors.text,
              background: colors.bgCard, border: `1px solid ${colors.border}`,
              borderRadius: radius.sm, outline: 'none',
              minHeight: 44, colorScheme: 'dark',
            }}
          />
        </div>

        {/* Project (read-only) */}
        <div style={{ marginTop: spacing.lg }}>
          <div style={{ ...typography.label, marginBottom: spacing.sm }}>PROJECT</div>
          <div style={{
            padding: `${spacing.md}px ${spacing.lg}px`,
            fontSize: 14, color: colors.textDim,
            background: colors.bgCard, borderRadius: radius.sm,
            border: `1px solid ${colors.border}`,
          }}>
            {'\u{1F4C1}'} {projectName}
          </div>
        </div>

        {/* Goal link */}
        <div style={{ marginTop: spacing.lg }}>
          <div style={{ ...typography.label, marginBottom: spacing.sm }}>LINK TO GOAL</div>
          <div style={{
            display: 'flex', gap: spacing.xs, overflowX: 'auto',
            paddingBottom: spacing.xs, WebkitOverflowScrolling: 'touch',
          }}>
            {WHEEL_OF_LIFE_AREAS.map((area) => {
              const isSelected = selectedDomain === area.id;
              return (
                <button
                  key={area.id}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedDomain(null);
                      setSelectedMilestone(null);
                    } else {
                      setSelectedDomain(area.id);
                      setSelectedMilestone(null);
                    }
                  }}
                  style={{
                    flexShrink: 0, minHeight: 44,
                    padding: `${spacing.xs}px ${spacing.md}px`,
                    borderRadius: radius.full, cursor: 'pointer',
                    border: isSelected ? `2px solid ${area.color}` : `1px solid ${colors.border}`,
                    background: isSelected ? `${area.color}15` : 'transparent',
                    color: isSelected ? area.color : colors.textDim,
                    fontSize: 12, whiteSpace: 'nowrap',
                  }}
                >
                  {area.icon} {area.label.split(' ')[0]}
                </button>
              );
            })}
          </div>
          {selectedDomain && goals[selectedDomain]?.length > 0 && (
            <div style={{ marginTop: spacing.sm }}>
              <select
                value={selectedMilestone || ''}
                onChange={(e) => setSelectedMilestone(e.target.value || null)}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: `${spacing.sm}px ${spacing.md}px`,
                  fontSize: 13, color: colors.text,
                  background: colors.bgCard, border: `1px solid ${colors.border}`,
                  borderRadius: radius.sm, minHeight: 44,
                  colorScheme: 'dark',
                }}
              >
                <option value="">No specific milestone</option>
                {goals[selectedDomain].map((g) => (
                  <option key={g.id} value={g.id}>{g.text}</option>
                ))}
              </select>
            </div>
          )}
          {!selectedDomain && (
            <div style={{ fontSize: 12, color: colors.textGhost, marginTop: spacing.xs }}>
              Link to a life domain to track impact
            </div>
          )}
        </div>

        {/* Impact score */}
        <div style={{ marginTop: spacing.lg }}>
          <div style={{ ...typography.label, marginBottom: spacing.sm }}>IMPACT ON GOALS</div>
          <div style={{ display: 'flex', gap: spacing.xs, alignItems: 'center' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setImpactScore(impactScore === star ? 0 : star)}
                style={{
                  minHeight: 44, minWidth: 44,
                  fontSize: 22, cursor: 'pointer',
                  background: 'none', border: 'none',
                  padding: 0, lineHeight: 1,
                  color: star <= impactScore ? colors.warning : colors.textGhost,
                  transition: 'color 0.15s',
                }}
                aria-label={`${star} star${star !== 1 ? 's' : ''}`}
              >
                {star <= impactScore ? '\u2605' : '\u2606'}
              </button>
            ))}
            {impactScore > 0 && (
              <span style={{ fontSize: 11, color: colors.textFaint, marginLeft: spacing.xs }}>
                {impactScore <= 2 ? 'Maintenance' : impactScore <= 3 ? 'Useful' : impactScore === 4 ? 'High impact' : 'Game-changer'}
              </span>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            marginTop: spacing.md, padding: `${spacing.sm}px ${spacing.md}px`,
            background: colors.dangerBg, borderRadius: radius.sm,
            fontSize: 13, color: colors.danger,
          }}>
            {error}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: spacing.sm, marginTop: spacing.xl }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, minHeight: 44, padding: `${spacing.md}px`,
              borderRadius: radius.sm, border: `1px solid ${colors.borderActive}`,
              background: 'transparent', color: colors.textDim,
              fontSize: 14, cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !content.trim()}
            style={{
              flex: 1, minHeight: 44, padding: `${spacing.md}px`,
              borderRadius: radius.sm, border: 'none',
              background: saving || !content.trim() ? colors.textGhost : colors.primary,
              color: saving || !content.trim() ? colors.textDim : '#000',
              fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
