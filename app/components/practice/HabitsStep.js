'use client';
import { colors, radius, spacing } from '../../lib/theme';

export default function HabitsStep({ habits, habitDefs, onToggle }) {
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: spacing.lg }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>
          {habits.length}/{habitDefs.length} complete
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
        {habitDefs.map((h) => {
          const done = habits.includes(h.id);
          return (
            <button
              key={h.id}
              onClick={() => onToggle(h.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 16px', borderRadius: radius.full,
                fontSize: 14, minHeight: 44,
                border: done ? `1px solid ${colors.successBorder}` : `1px solid ${colors.borderActive}`,
                background: done ? colors.successBg : 'rgba(255,255,255,0.03)',
                cursor: 'pointer', transition: 'all 0.2s',
                color: done ? colors.success : colors.textMuted,
              }}
            >
              <span style={{ fontSize: 16 }}>{h.icon}</span>
              <span>{h.label}</span>
              {done && <span style={{ fontSize: 12 }}>{'\u2713'}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
