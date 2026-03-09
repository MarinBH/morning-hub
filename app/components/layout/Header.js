'use client';
import { colors, spacing, fonts } from '../../lib/theme';
import { getGreeting } from '../../lib/utils';
import MomentumRing from '../common/MomentumRing';

export default function Header({ momentumScore = 0, captureCount = 0, streakDays = 0, onSearchClick }) {
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
          <span style={{ fontSize: 12, color: colors.textFaint }}>Command Center</span>
          {streakDays > 0 && (
            <span style={{
              fontSize: 11,
              color: colors.orange,
              background: 'rgba(255,184,108,0.1)',
              padding: '1px 6px',
              borderRadius: 100,
              fontWeight: 600,
            }}>
              {streakDays}d streak
            </span>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
        {/* Search trigger */}
        <button
          onClick={onSearchClick}
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            border: `1px solid ${colors.borderActive}`,
            background: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            color: colors.textDim,
            transition: 'background 0.2s',
          }}
          aria-label="Search"
        >
          {'\u{1F50D}'}
        </button>
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
            {captureCount}
          </div>
        )}
        <MomentumRing score={momentumScore} size={40} strokeWidth={2.5} />
      </div>
    </div>
  );
}
