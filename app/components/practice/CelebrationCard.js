'use client';
import { useState, useEffect } from 'react';
import { colors, radius, spacing } from '../../lib/theme';

const QUOTES = [
  'The secret of getting ahead is getting started.',
  'Small daily improvements lead to staggering long-term results.',
  'Discipline is choosing between what you want now and what you want most.',
  'You don\u2019t have to be extreme, just consistent.',
  'The way to get started is to quit talking and begin doing.',
  'Success is the sum of small efforts repeated day in and day out.',
];

export default function CelebrationCard({ habitCount, totalHabits, hasJournal, streakDays, onCollapse }) {
  const [visible, setVisible] = useState(true);
  const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onCollapse?.();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onCollapse]);

  if (!visible) return null;

  return (
    <div style={{
      textAlign: 'center',
      padding: `${spacing.xxl}px ${spacing.xl}px`,
      animation: 'fadeUp 0.5s ease',
    }}>
      <div style={{
        fontSize: 48, marginBottom: spacing.lg,
        animation: 'pulse 1s ease-in-out 2',
      }}>
        {'\u2728'}
      </div>
      <div style={{
        fontSize: 20, fontWeight: 700, color: colors.text,
        marginBottom: spacing.md,
      }}>
        Morning ritual complete!
      </div>
      <div style={{
        display: 'flex', justifyContent: 'center', gap: spacing.lg,
        marginBottom: spacing.lg, fontSize: 14, color: colors.textDim,
      }}>
        <span>{habitCount}/{totalHabits} habits</span>
        {hasJournal && <span>{'\u270D\uFE0F'} journaled</span>}
        {streakDays > 1 && <span>{streakDays}d{'\u{1F525}'}</span>}
      </div>
      <div style={{
        fontSize: 14, color: colors.textFaint,
        fontStyle: 'italic', lineHeight: 1.5,
        maxWidth: 300, margin: '0 auto',
      }}>
        &ldquo;{quote}&rdquo;
      </div>
    </div>
  );
}

export function CompactSummary({ habitCount, totalHabits, hasJournal, streakDays, onExpand }) {
  return (
    <button
      onClick={onExpand}
      style={{
        width: '100%', display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: spacing.md,
        padding: `${spacing.md}px ${spacing.lg}px`,
        borderRadius: radius.sm,
        border: `1px solid ${colors.successBorder}`,
        background: colors.successBg,
        cursor: 'pointer', fontSize: 13,
        color: colors.success, fontWeight: 500, minHeight: 44,
      }}
    >
      <span>{'\u2713'} {habitCount}/{totalHabits}</span>
      {hasJournal && <span>{'\u00B7'} journal</span>}
      {streakDays > 1 && <span>{'\u00B7'} {streakDays}d{'\u{1F525}'}</span>}
    </button>
  );
}
