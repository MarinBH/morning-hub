'use client';
import { colors, spacing, fonts } from '../../lib/theme';
import { getGreeting } from '../../lib/utils';
import MomentumRing from '../common/MomentumRing';

export default function Header({ momentumScore = 0, captureCount = 0 }) {
  return (
    <div
      style={{
        padding: `${spacing.lg}px ${spacing.xl}px ${spacing.md}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `1px solid ${colors.borderLight}`,
      }}
    >
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: colors.text,
            fontFamily: fonts.heading,
          }}
        >
          {getGreeting()}
        </div>
        <div style={{ fontSize: 12, color: colors.textFaint, marginTop: 2 }}>
          Command Center
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
        {captureCount > 0 && (
          <div
            style={{
              padding: `4px ${spacing.md}px`,
              borderRadius: 100,
              background: colors.primaryBg,
              fontSize: 12,
              color: colors.primary,
            }}
          >
            {captureCount} captured
          </div>
        )}
        <MomentumRing score={momentumScore} size={40} strokeWidth={2.5} />
      </div>
    </div>
  );
}
