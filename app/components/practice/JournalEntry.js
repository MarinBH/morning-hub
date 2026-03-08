'use client';
import { colors, radius, spacing, fonts } from '../../lib/theme';

export default function JournalEntry({ value, onChange, prompt, compact = false }) {
  return (
    <div>
      {prompt && (
        <div style={{
          fontSize: compact ? 14 : 15,
          color: colors.textMuted,
          fontStyle: 'italic',
          marginBottom: compact ? spacing.md : 12,
          lineHeight: 1.5,
          fontFamily: fonts.heading,
        }}>
          &ldquo;{prompt}&rdquo;
        </div>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write freely..."
        style={{
          width: '100%',
          minHeight: compact ? 100 : 120,
          padding: compact ? spacing.lg : 16,
          borderRadius: radius.md,
          border: `1px solid ${colors.border}`,
          background: 'rgba(255,255,255,0.03)',
          color: colors.text,
          fontSize: 15,
          lineHeight: 1.6,
          resize: 'vertical',
          fontFamily: fonts.body,
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
}
