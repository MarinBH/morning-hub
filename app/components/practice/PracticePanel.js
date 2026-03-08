'use client';
import { useState } from 'react';
import { colors, radius, spacing, typography, fonts } from '../../lib/theme';
import { HABITS, getPrompt } from '../../lib/constants';
import BreathTimer from './BreathTimer';

export default function PracticePanel({ habits, journalEntry, onHabitToggle, onJournalChange }) {
  const [showBreath, setShowBreath] = useState(false);
  const prompt = getPrompt();

  return (
    <div style={{ padding: `0 ${spacing.xl}px 100px` }}>
      <div style={{ marginBottom: spacing.xxl }}>
        <div style={typography.label}>MORNING PRACTICE</div>
        <div style={{ fontSize: 14, color: colors.textDim }}>
          {habits.length}/{HABITS.length} habits {'\u00B7'} {journalEntry ? '\u270D\uFE0F written' : '\u{1F4DD} journal'}
        </div>
      </div>

      {/* Habits */}
      <div style={{ marginBottom: 28 }}>
        <div style={typography.sub}>Habits</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {HABITS.map((h) => {
            const done = habits.includes(h.id);
            return (
              <button
                key={h.id}
                onClick={() => onHabitToggle(h.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
                  borderRadius: radius.full,
                  border: done ? `1px solid ${colors.successBorder}` : `1px solid ${colors.borderActive}`,
                  background: done ? colors.successBg : 'rgba(255,255,255,0.03)',
                  cursor: 'pointer', transition: 'all 0.2s', fontSize: 14,
                  color: done ? colors.success : colors.textMuted,
                }}
              >
                <span>{h.icon}</span><span>{h.label}</span>
                {done && <span style={{ fontSize: 12 }}>{'\u2713'}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Breathwork */}
      <div style={{ marginBottom: 28 }}>
        <button
          onClick={() => setShowBreath(!showBreath)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 18px', borderRadius: radius.md,
            border: `1px solid ${colors.secondaryBorder}`,
            background: colors.secondaryBg, cursor: 'pointer', fontSize: 14,
            color: colors.secondary, fontWeight: 500,
          }}
        >
          <span>{'\u{1F32C}\uFE0F'} Breathwork &mdash; Box Breathing</span>
          <span style={{ fontSize: 18, transition: 'transform 0.2s', transform: showBreath ? 'rotate(180deg)' : 'none' }}>{'\u2304'}</span>
        </button>
        {showBreath && <BreathTimer />}
      </div>

      {/* Journal */}
      <div>
        <div style={typography.sub}>Journal</div>
        <div style={{ fontSize: 15, color: colors.textMuted, fontStyle: 'italic', marginBottom: 12, lineHeight: 1.5, fontFamily: fonts.heading }}>
          &ldquo;{prompt}&rdquo;
        </div>
        <textarea
          value={journalEntry}
          onChange={(e) => onJournalChange(e.target.value)}
          placeholder="Write freely..."
          style={{
            width: '100%', minHeight: 120, padding: 16, borderRadius: radius.md,
            border: `1px solid ${colors.border}`, background: 'rgba(255,255,255,0.03)',
            color: colors.text, fontSize: 15, lineHeight: 1.6, resize: 'vertical',
            fontFamily: fonts.body, outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>
    </div>
  );
}
