'use client';
import { colors, radius } from '../../lib/theme';

export default function Skeleton({ width = '100%', height = 16, borderRadius = radius.sm, style }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background: `linear-gradient(90deg, ${colors.bgCard} 25%, rgba(255,255,255,0.06) 50%, ${colors.bgCard} 75%)`,
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s ease-in-out infinite',
        ...style,
      }}
    />
  );
}

export function SkeletonCard({ lines = 3, style }) {
  return (
    <div
      style={{
        background: colors.bgCard,
        borderRadius: radius.md,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        ...style,
      }}
    >
      <Skeleton width="40%" height={12} />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? '60%' : '100%'} height={14} />
      ))}
    </div>
  );
}
