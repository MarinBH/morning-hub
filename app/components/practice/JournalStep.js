'use client';
import { colors, radius, spacing, fonts } from '../../lib/theme';

export default function JournalStep({ value, onChange, prompt }) {
  return (
    <div>
      {prompt && (
        <div style={{
          fontSize: 16, color: colors.textMuted,
          fontStyle: 'italic', marginBottom: spacing.lg,
          lineHeight: 1.5, fontFamily: fonts.heading,
          textAlign: 'center',
        }}>
          &ldquo;{prompt}&rdquo;
        </div>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write freely..."
        style={{
          width: '100%', minHeight: 140, padding: spacing.lg,
          borderRadius: radius.md,
          border: `1px solid ${colors.border}`,
          background: 'rgba(255,255,255,0.03)',
          color: colors.text, fontSize: 15, lineHeight: 1.6,
          resize: 'vertical', fontFamily: fonts.body,
          outline: 'none', boxSizing: 'border-box',
        }}
      />
      {value && (
        <div style={{ textAlign: 'right', marginTop: spacing.sm, fontSize: 12, color: colors.textFaint }}>
          {value.trim().split(/\s+/).filter(Boolean).length} words
        </div>
      )}
    </div>
  );
}
