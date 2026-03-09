'use client';
import { useState } from 'react';
import { colors, radius, spacing, fonts } from '../../lib/theme';

export default function MilestoneList({ areaId, areaColor, milestones = [], onAdd, onToggle, onRemove }) {
  const [text, setText] = useState('');

  const handleAdd = () => {
    if (!text.trim()) return;
    onAdd(areaId, text.trim());
    setText('');
  };

  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm }}>
        Milestones
      </div>

      {milestones.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: spacing.md }}>
          {milestones.map((m) => (
            <div
              key={m.id}
              style={{
                display: 'flex', alignItems: 'center', gap: spacing.sm,
                padding: `${spacing.sm}px 0`, minHeight: 44,
              }}
            >
              <button
                onClick={() => onToggle(areaId, m.id)}
                role="checkbox"
                aria-checked={m.done}
                style={{
                  width: 22, height: 22, borderRadius: 5, flexShrink: 0,
                  border: m.done ? `2px solid ${colors.success}` : `2px solid ${colors.textGhost}`,
                  background: m.done ? 'rgba(108,255,184,0.15)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', padding: 0, minHeight: 0,
                }}
              >
                {m.done && <span style={{ fontSize: 11, color: colors.success }}>{'\u2713'}</span>}
              </button>
              <span style={{
                flex: 1, fontSize: 14,
                color: m.done ? colors.textDim : colors.text,
                textDecoration: m.done ? 'line-through' : 'none',
              }}>
                {m.text}
              </span>
              {onRemove && (
                <button
                  onClick={() => onRemove(areaId, m.id)}
                  aria-label="Remove milestone"
                  style={{
                    background: 'none', border: 'none',
                    color: colors.textGhost, fontSize: 14,
                    cursor: 'pointer', padding: '4px 8px', minHeight: 0,
                  }}
                >
                  {'\u2715'}
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: 13, color: colors.textFaint, marginBottom: spacing.md }}>
          No milestones yet
        </div>
      )}

      {/* Add milestone */}
      <div style={{ display: 'flex', gap: spacing.sm }}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Add a milestone..."
          style={{
            flex: 1, padding: `${spacing.sm}px ${spacing.md}px`,
            borderRadius: radius.md,
            border: `1px solid ${colors.border}`,
            background: 'rgba(255,255,255,0.03)',
            color: colors.text, fontSize: 13,
            fontFamily: fonts.body, outline: 'none',
            boxSizing: 'border-box', minHeight: 40,
          }}
        />
        <button
          onClick={handleAdd}
          style={{
            padding: `${spacing.sm}px ${spacing.md}px`,
            borderRadius: radius.md, border: 'none',
            background: text.trim() ? areaColor : colors.bgCardHover,
            color: text.trim() ? colors.bg : colors.textFaint,
            fontSize: 13, fontWeight: 600,
            cursor: text.trim() ? 'pointer' : 'default',
            minHeight: 40,
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}
