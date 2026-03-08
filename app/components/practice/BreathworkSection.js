'use client';
import { useState } from 'react';
import { colors, radius } from '../../lib/theme';
import BreathTimer from './BreathTimer';

export default function BreathworkSection({ label = 'Box Breathing', compact = false }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: compact ? '14px 16px' : '16px 18px',
          borderRadius: radius.md,
          border: `1px solid ${colors.secondaryBorder}`,
          background: colors.secondaryBg,
          cursor: 'pointer',
          fontSize: compact ? 13 : 14,
          color: colors.secondary,
          fontWeight: 500,
        }}
      >
        <span>{'\u{1F32C}\uFE0F'} Breathwork &mdash; {label}</span>
        <span style={{ fontSize: compact ? 16 : 18, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>{'\u2304'}</span>
      </button>
      {open && <BreathTimer />}
    </div>
  );
}
