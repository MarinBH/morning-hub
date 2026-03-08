'use client';
import { colors, radius, spacing } from '../../lib/theme';

export default function Badge({ children, color, bg, style, ...props }) {
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 500,
        color: color || colors.primary,
        background: bg || colors.primaryBg,
        padding: `2px ${spacing.sm}px`,
        borderRadius: radius.sm,
        letterSpacing: 0.3,
        ...style,
      }}
      {...props}
    >
      {children}
    </span>
  );
}
