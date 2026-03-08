'use client';
import { spacing, typography, colors } from '../../lib/theme';
import { HABITS, getPrompt } from '../../lib/constants';
import HabitList from './HabitList';
import BreathworkSection from './BreathworkSection';
import JournalEntry from './JournalEntry';

export default function PracticePanel({ habits, journalEntry, onHabitToggle, onJournalChange }) {
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
        <HabitList habits={habits} onToggle={onHabitToggle} />
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
