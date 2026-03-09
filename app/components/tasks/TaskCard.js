'use client';
import { useState } from 'react';
import { colors, radius, spacing } from '../../lib/theme';
import { isTaskOverdue } from '../../lib/utils';
import { PRIORITY_COLORS } from '../../lib/constants';
import Badge from '../common/Badge';

export default function TaskCard({ task, projects, completing, onComplete, onExpand }) {
  const done = completing;
  const overdue = isTaskOverdue(task);
  const projectName = projects[task.project_id] || 'Inbox';

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: done ? 'rgba(108,255,184,0.04)' : colors.bgCard,
        borderRadius: radius.md,
        padding: `${spacing.md}px ${spacing.lg}px`,
        transition: 'all 0.5s',
        opacity: done ? 0.3 : 1,
        transform: done ? 'translateX(20px)' : 'none',
        minHeight: 44,
      }}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => { e.stopPropagation(); if (!done) onComplete(task.id); }}
        aria-label={`Complete task: ${task.content}`}
        style={{
          width: 22, height: 22, borderRadius: 7, flexShrink: 0,
          border: done
            ? `2px solid ${colors.success}`
            : `2px solid ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS[1]}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: done ? 'rgba(108,255,184,0.15)' : 'transparent',
          transition: 'all 0.3s', cursor: 'pointer', padding: 0,
          minHeight: 0,
        }}
      >
        {done && <span style={{ fontSize: 13, color: colors.success }}>{'\u2713'}</span>}
      </button>

      {/* Content — tappable to expand */}
      <div
        onClick={() => onExpand?.(task)}
        style={{ flex: 1, cursor: 'pointer' }}
      >
        <div style={{
          fontSize: 15, lineHeight: 1.4,
          color: done ? colors.textDim : colors.text,
          textDecoration: done ? 'line-through' : 'none',
        }}>
          {task.content}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: colors.textGhost, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {projectName}
          </span>
          {task.due?.date && (
            <span style={{ fontSize: 11, color: overdue ? colors.danger : colors.textFaint }}>
              {task.due.date}
            </span>
          )}
          {overdue && <Badge color={colors.danger} bg={colors.dangerBg}>overdue</Badge>}
        </div>
      </div>
    </div>
  );
}
