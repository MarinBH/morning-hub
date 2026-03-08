'use client';
import { colors, spacing } from '../../lib/theme';
import { NAV_ITEMS } from '../../lib/constants';

export default function BottomNav({ activeTab, onTabChange }) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        background: 'rgba(18,17,16,0.95)',
        backdropFilter: 'blur(12px)',
        borderTop: `1px solid ${colors.borderLight}`,
        padding: `${spacing.sm}px 0`,
        paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
        zIndex: 99,
      }}
    >
      {NAV_ITEMS.map((t) => (
        <button
          key={t.id}
          onClick={() => onTabChange(t.id)}
          style={{
            flex: 1,
            maxWidth: 100,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            padding: `${spacing.sm}px 0`,
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: activeTab === t.id ? colors.text : colors.textFaint,
            transition: 'color 0.2s',
          }}
        >
          <span style={{ fontSize: 18 }}>{t.icon}</span>
          <span
            style={{
              fontSize: 10,
              fontWeight: activeTab === t.id ? 600 : 400,
              letterSpacing: 0.3,
            }}
          >
            {t.label}
          </span>
          {activeTab === t.id && (
            <div
              style={{
                width: 4,
                height: 4,
                borderRadius: 2,
                background: colors.primary,
                marginTop: -1,
              }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
