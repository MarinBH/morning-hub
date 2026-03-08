'use client';
import { colors, radius } from '../../lib/theme';
import { HABITS } from '../../lib/constants';

export default function HabitList({ habits, onToggle, compact = false }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {HABITS.map((h) => {
        const done = habits.includes(h.id);
        return (
          <button
            key={h.id}
            onClick={() => onToggle(h.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: compact ? 6 : 8,
              padding: compact ? '8px 14px' : '10px 16px',
              borderRadius: radius.full,
              fontSize: compact ? 13 : 14,
              border: done ? `1px solid ${colors.successBorder}` : `1px solid ${colors.borderActive}`,
              background: done ? colors.successBg : 'rgba(255,255,255,0.03)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              color: done ? colors.success : colors.textMuted,
            }}
          >
            <span style={{ fontSize: compact ? 14 : 15 }}>{h.icon}</span>
            <span>{h.label}</span>
            {done && <span style={{ fontSize: compact ? 11 : 12 }}>{'\u2713'}</span>}
          </button>
        );
      })}
    </div>
  );
}
