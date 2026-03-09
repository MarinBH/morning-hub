'use client';
import { colors, radius, spacing, fonts } from '../../lib/theme';
import { HABIT_PACKS, CUSTOM_PACK } from '../../lib/habitPacks';

export default function HabitPackPicker({ onSelectPack, onCustomize }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: colors.bg, overflowY: 'auto',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      <div style={{ width: '100%', maxWidth: 480, padding: `${spacing.xxl}px ${spacing.xl}px` }}>
        <div style={{ textAlign: 'center', marginBottom: spacing.xxl }}>
          <div style={{ fontSize: 32, marginBottom: spacing.sm }}>{'☀️'}</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: colors.text, marginBottom: spacing.xs }}>
            Choose your morning ritual
          </div>
          <div style={{ fontSize: 14, color: colors.textDim }}>
            Pick a research-backed routine or build your own
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.md }}>
          {HABIT_PACKS.map((pack) => (
            <div
              key={pack.id}
              style={{
                background: colors.bgCard,
                borderRadius: radius.md,
                border: `1px solid ${colors.border}`,
                padding: spacing.xl,
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
                <span style={{ fontSize: 24 }}>{pack.icon}</span>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: colors.text }}>{pack.name}</div>
                  <div style={{ fontSize: 12, color: colors.textFaint }}>{pack.subtitle}</div>
                </div>
              </div>

              <div style={{ fontSize: 13, color: colors.textDim, marginBottom: spacing.md }}>
                {pack.description}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: spacing.lg }}>
                {pack.habits.map((h) => (
                  <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, fontSize: 14, color: colors.text }}>
                    <span>{h.icon}</span>
                    <span>{h.label}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: spacing.sm }}>
                <button
                  onClick={() => onSelectPack(pack.id)}
                  style={{
                    flex: 1, padding: `${spacing.md}px`, borderRadius: radius.sm,
                    border: 'none', background: colors.gradient, color: '#fff',
                    fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Use this pack
                </button>
                <button
                  onClick={() => onCustomize(pack.id)}
                  style={{
                    padding: `${spacing.md}px ${spacing.lg}px`, borderRadius: radius.sm,
                    border: `1px solid ${colors.borderActive}`, background: 'transparent',
                    color: colors.textDim, fontSize: 14, cursor: 'pointer',
                  }}
                >
                  Customize
                </button>
              </div>
            </div>
          ))}

          {/* Custom option */}
          <button
            onClick={() => onSelectPack('custom')}
            style={{
              background: 'transparent',
              borderRadius: radius.md,
              border: `1px dashed ${colors.borderActive}`,
              padding: spacing.xl,
              cursor: 'pointer',
              textAlign: 'center',
              color: colors.textDim,
            }}
          >
            <div style={{ fontSize: 24, marginBottom: spacing.xs }}>{CUSTOM_PACK.icon}</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: colors.text }}>Build Your Own</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Start with a blank slate</div>
          </button>
        </div>
      </div>
    </div>
  );
}
