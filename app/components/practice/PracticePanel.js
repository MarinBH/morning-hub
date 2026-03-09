'use client';
import { useState } from 'react';
import { spacing, typography, colors, radius } from '../../lib/theme';
import { HABITS, getPrompt } from '../../lib/constants';
import HabitList from './HabitList';
import BreathworkSection from './BreathworkSection';
import JournalEntry from './JournalEntry';
import HabitPackPicker from './HabitPackPicker';

export default function PracticePanel({ habits, journalEntry, onHabitToggle, onJournalChange, habitConfig }) {
  const prompt = getPrompt();
  const [showPicker, setShowPicker] = useState(false);

  const habitDefs = habitConfig?.habits?.length > 0 ? habitConfig.habits : HABITS;
  const totalHabits = habitDefs.length;

  // Show picker on first use (no config) or when user requests it
  if (!habitConfig?.isConfigured && habitConfig?.loaded) {
    return (
      <HabitPackPicker
        onSelectPack={habitConfig.selectPack}
        onCustomize={habitConfig.customizePack}
      />
    );
  }

  if (showPicker) {
    return (
      <HabitPackPicker
        onSelectPack={(id) => { habitConfig.selectPack(id); setShowPicker(false); }}
        onCustomize={(id) => { habitConfig.customizePack(id); setShowPicker(false); }}
      />
    );
  }

  return (
    <div style={{ padding: `0 ${spacing.xl}px 100px` }}>
      <div style={{ marginBottom: spacing.xxl, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={typography.label}>MORNING PRACTICE</div>
          <div style={{ fontSize: 14, color: colors.textDim }}>
            {habits.length}/{totalHabits} habits {'\u00B7'} {journalEntry ? '\u270D\uFE0F written' : '\u{1F4DD} journal'}
          </div>
        </div>
        <button
          onClick={() => setShowPicker(true)}
          aria-label="Change habit pack"
          style={{
            width: 36, height: 36, borderRadius: '50%',
            border: `1px solid ${colors.borderActive}`,
            background: 'transparent', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, color: colors.textDim, minHeight: 44, minWidth: 44,
          }}
        >
          {'\u2699\uFE0F'}
        </button>
      </div>

      {/* Habits */}
      <div style={{ marginBottom: 28 }}>
        <div style={typography.sub}>Habits</div>
        <HabitList habits={habits} onToggle={onHabitToggle} habitDefs={habitDefs} />
      </div>

      {/* Breathwork */}
      <div style={{ marginBottom: 28 }}>
        <BreathworkSection label="Box Breathing" />
      </div>

      {/* Journal */}
      <div>
        <div style={typography.sub}>Journal</div>
        <JournalEntry value={journalEntry} onChange={onJournalChange} prompt={prompt} />
      </div>
    </div>
  );
}
