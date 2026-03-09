'use client';
import { colors, radius, spacing } from '../../lib/theme';
import BreathTimer from './BreathTimer';
import { useState } from 'react';

export default function BreathStep({ onComplete, onSkip }) {
  const [started, setStarted] = useState(false);

  if (!started) {
    return (
      <div style={{ textAlign: 'center', padding: `${spacing.xl}px 0` }}>
        <div style={{ fontSize: 48, marginBottom: spacing.lg }}>{'\u{1F32C}\uFE0F'}</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: colors.text, marginBottom: spacing.sm }}>
          Breathwork
        </div>
        <div style={{ fontSize: 14, color: colors.textDim, marginBottom: spacing.xl }}>
          4-4-6 box breathing to center your mind
        </div>
        <button
          onClick={() => setStarted(true)}
          style={{
            padding: '12px 32px', borderRadius: radius.sm,
            border: 'none', background: colors.gradient,
            color: '#fff', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', minHeight: 44,
          }}
        >
          Begin breathing
        </button>
        <div style={{ marginTop: spacing.lg }}>
          <button
            onClick={onSkip || onComplete}
            style={{
              background: 'none', border: 'none',
              color: colors.textFaint, fontSize: 13,
              cursor: 'pointer', minHeight: 44,
            }}
          >
            Skip for now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <BreathTimer />
      <div style={{ textAlign: 'center', marginTop: spacing.lg }}>
        <button
          onClick={onComplete}
          style={{
            padding: '10px 24px', borderRadius: radius.sm,
            border: `1px solid ${colors.successBorder}`,
            background: colors.successBg, color: colors.success,
            fontSize: 13, fontWeight: 600, cursor: 'pointer', minHeight: 44,
          }}
        >
          {'\u2713'} Done
        </button>
      </div>
    </div>
  );
}
