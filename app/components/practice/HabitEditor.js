'use client';
import { useState } from 'react';
import { colors, radius, spacing } from '../../lib/theme';

const EMOJI_OPTIONS = ['⭐', '☀️', '💧', '🏃', '🧘', '📖', '✍️', '🎯', '🧊', '💪', '🌬️', '✨', '📵', '🙏', '🎵', '🥗', '😴', '🧠'];

export default function HabitEditor({ habits, onAdd, onRemove, onUpdate, onClose }) {
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newIcon, setNewIcon] = useState('⭐');

  const handleAdd = () => {
    if (!newLabel.trim()) return;
    onAdd(newLabel.trim(), newIcon);
    setNewLabel('');
    setNewIcon('⭐');
    setAdding(false);
  };

  return (
    <div style={{
      background: colors.bgCard,
      borderRadius: radius.md,
      border: `1px solid ${colors.border}`,
      padding: spacing.xl,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: colors.text }}>
          Edit Habits
        </div>
        <button
          onClick={onClose}
          aria-label="Close editor"
          style={{
            background: 'none', border: 'none',
            color: colors.textFaint, fontSize: 18,
            cursor: 'pointer', minHeight: 44, minWidth: 44,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {'\u2715'}
        </button>
      </div>

      {/* Habit list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm, marginBottom: spacing.lg }}>
        {habits.length === 0 && (
          <div style={{ textAlign: 'center', padding: spacing.xl, color: colors.textFaint, fontSize: 14 }}>
            No habits yet. Add your first one below.
          </div>
        )}
        {habits.map((habit, i) => (
          <div
            key={habit.id}
            style={{
              display: 'flex', alignItems: 'center', gap: spacing.sm,
              padding: `${spacing.sm}px ${spacing.md}px`,
              background: 'rgba(255,255,255,0.02)',
              borderRadius: radius.sm,
              border: `1px solid ${colors.borderLight}`,
            }}
          >
            <span style={{ fontSize: 18 }}>{habit.icon}</span>
            <span style={{ flex: 1, fontSize: 14, color: colors.text }}>{habit.label}</span>

            {/* Move up */}
            {i > 0 && (
              <button
                onClick={() => {
                  const reordered = [...habits];
                  [reordered[i - 1], reordered[i]] = [reordered[i], reordered[i - 1]];
                  // Update all habits in new order
                  reordered.forEach((h, idx) => onUpdate(h.id, { order: idx }));
                }}
                aria-label="Move up"
                style={{
                  background: 'none', border: 'none', color: colors.textDim,
                  fontSize: 14, cursor: 'pointer', minHeight: 44, minWidth: 32,
                }}
              >
                {'\u2191'}
              </button>
            )}

            {/* Move down */}
            {i < habits.length - 1 && (
              <button
                onClick={() => {
                  const reordered = [...habits];
                  [reordered[i], reordered[i + 1]] = [reordered[i + 1], reordered[i]];
                  reordered.forEach((h, idx) => onUpdate(h.id, { order: idx }));
                }}
                aria-label="Move down"
                style={{
                  background: 'none', border: 'none', color: colors.textDim,
                  fontSize: 14, cursor: 'pointer', minHeight: 44, minWidth: 32,
                }}
              >
                {'\u2193'}
              </button>
            )}

            {/* Remove */}
            <button
              onClick={() => {
                if (window.confirm(`Remove "${habit.label}"?`)) {
                  onRemove(habit.id);
                }
              }}
              aria-label={`Remove ${habit.label}`}
              style={{
                background: 'none', border: 'none', color: colors.danger,
                fontSize: 14, cursor: 'pointer', minHeight: 44, minWidth: 32,
              }}
            >
              {'\u2715'}
            </button>
          </div>
        ))}
      </div>

      {/* Add new habit */}
      {adding ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
          {/* Emoji picker */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => setNewIcon(emoji)}
                style={{
                  width: 36, height: 36, borderRadius: 8,
                  border: newIcon === emoji ? `2px solid ${colors.primary}` : `1px solid ${colors.borderLight}`,
                  background: newIcon === emoji ? colors.primaryBg : 'transparent',
                  fontSize: 18, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {emoji}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: spacing.sm }}>
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Habit name..."
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              style={{
                flex: 1, padding: `${spacing.sm}px ${spacing.md}px`,
                borderRadius: radius.sm,
                border: `1px solid ${colors.borderActive}`,
                background: 'rgba(255,255,255,0.03)',
                color: colors.text, fontSize: 14,
                outline: 'none', boxSizing: 'border-box',
                minHeight: 44,
              }}
            />
            <button
              onClick={handleAdd}
              disabled={!newLabel.trim()}
              style={{
                padding: `${spacing.sm}px ${spacing.lg}px`,
                borderRadius: radius.sm, border: 'none',
                background: newLabel.trim() ? colors.gradient : colors.bgCardHover,
                color: newLabel.trim() ? '#fff' : colors.textFaint,
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                minHeight: 44,
              }}
            >
              Add
            </button>
            <button
              onClick={() => { setAdding(false); setNewLabel(''); }}
              style={{
                padding: `${spacing.sm}px ${spacing.md}px`,
                borderRadius: radius.sm,
                border: `1px solid ${colors.borderActive}`,
                background: 'transparent',
                color: colors.textDim, fontSize: 14,
                cursor: 'pointer', minHeight: 44,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          style={{
            width: '100%', padding: `${spacing.md}px`,
            borderRadius: radius.sm,
            border: `1px dashed ${colors.borderActive}`,
            background: 'transparent',
            color: colors.primary, fontSize: 14,
            fontWeight: 500, cursor: 'pointer',
            minHeight: 44,
          }}
        >
          + Add habit
        </button>
      )}
    </div>
  );
}
