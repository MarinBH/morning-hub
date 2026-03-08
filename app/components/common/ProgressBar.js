'use client';
import { colors, radius } from '../../lib/theme';

export default function ProgressBar({
  value = 0,
  max = 100,
  color,
  height = 6,
  showLabel,
  style,
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const barColor = color || (pct >= 70 ? colors.success : pct >= 40 ? colors.warning : colors.danger);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...style }}>
      <div
        style={{
          flex: 1,
          height,
          borderRadius: radius.full,
          background: 'rgba(255,255,255,0.06)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            borderRadius: radius.full,
            background: barColor,
            transition: 'width 0.5s ease, background 0.3s',
          }}
        />
      </div>
      {showLabel && (
        <span style={{ fontSize: 12, color: colors.textDim, minWidth: 32, textAlign: 'right' }}>
          {Math.round(pct)}%
        </span>
      )}
    </div>
  );
}
