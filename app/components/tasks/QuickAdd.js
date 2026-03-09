'use client';
import { useState } from 'react';
import { colors, radius, spacing, fonts } from '../../lib/theme';
import { API, BOTTOM_NAV_HEIGHT } from '../../lib/constants';

export default function QuickAdd({ onTaskAdded, activeColumn }) {
  const [text, setText] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || adding) return;
    setAdding(true);
    setError(null);
    try {
      const res = await fetch(API.todoist, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          content: text.trim(),
          ...(activeColumn === 'today' && { due_string: 'today' }),
          ...(activeColumn === 'week' && { due_string: 'this week' }),
        }),
      });
      if (!res.ok) throw new Error('Failed to add task');
      const task = await res.json();
      onTaskAdded?.(task);
      setText('');
    } catch {
      setError('Could not add task. Try again.');
      setTimeout(() => setError(null), 3000);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div style={{
      position: 'sticky', bottom: 0,
      padding: `${spacing.md}px ${spacing.xl}px ${spacing.lg}px`,
      background: `linear-gradient(transparent, ${colors.bg} 20%)`,
    }}>
      {error && (
        <div style={{ fontSize: 12, color: colors.danger, marginBottom: spacing.xs, textAlign: 'center' }}>
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: spacing.sm }}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="+ Add task..."
          style={{
            flex: 1, padding: `${spacing.md}px ${spacing.lg}px`,
            borderRadius: radius.sm,
            border: `1px solid ${colors.borderActive}`,
            background: colors.bgCard,
            color: colors.text, fontSize: 14,
            fontFamily: fonts.body, outline: 'none',
            boxSizing: 'border-box', minHeight: 44,
          }}
        />
        {text.trim() && (
          <button
            type="submit"
            disabled={adding}
            style={{
              padding: `${spacing.md}px ${spacing.lg}px`,
              borderRadius: radius.sm, border: 'none',
              background: colors.gradient, color: '#fff',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
              opacity: adding ? 0.5 : 1, minHeight: 44,
            }}
          >
            {adding ? '...' : '\u21B5'}
          </button>
        )}
      </form>
    </div>
  );
}
