'use client';
import { colors, radius } from '../../lib/theme';

export default function FloatingCapture({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
        bottom: 80,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: radius.circle,
        border: 'none',
        background: colors.gradient,
        color: '#fff',
        fontSize: 24,
        cursor: 'pointer',
        boxShadow: '0 4px 20px rgba(108,155,255,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        transition: 'transform 0.2s',
      }}
    >
      +
    </button>
  );
}
