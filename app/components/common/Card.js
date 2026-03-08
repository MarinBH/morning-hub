'use client';
import { colors, radius, spacing } from '../../lib/theme';

export default function Card({
  children,
  style,
  borderColor,
  collapsible,
  collapsed,
  onToggle,
  title,
  subtitle,
  icon,
  action,
  ...props
}) {
  const isCollapsed = collapsible && collapsed;

  return (
    <div
      style={{
        background: colors.bgCard,
        borderRadius: radius.md,
        padding: `${spacing.lg}px ${spacing.lg}px`,
        borderLeft: borderColor ? `3px solid ${borderColor}` : undefined,
        ...style,
      }}
      {...props}
    >
      {(title || collapsible) && (
        <div
          onClick={collapsible ? onToggle : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: collapsible ? 'pointer' : 'default',
            marginBottom: isCollapsed ? 0 : spacing.md,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
            {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
            <div>
              {title && (
                <div style={{ fontSize: 15, fontWeight: 600, color: colors.text }}>
                  {title}
                </div>
              )}
              {subtitle && (
                <div style={{ fontSize: 12, color: colors.textDim, marginTop: 2 }}>
                  {subtitle}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
            {action}
            {collapsible && (
              <span
                style={{
                  fontSize: 18,
                  color: colors.textDim,
                  transition: 'transform 0.2s',
                  transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                }}
              >
                \u2304
              </span>
            )}
          </div>
        </div>
      )}
      {!isCollapsed && children}
    </div>
  );
}
