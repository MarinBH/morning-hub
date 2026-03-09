'use client';
import { useState } from 'react';
import { spacing, typography, colors } from '../../lib/theme';
import { HABITS } from '../../lib/constants';
import MorningFlow from './MorningFlow';
import HabitPackPicker from './HabitPackPicker';
import HabitEditor from './HabitEditor';

export default function PracticePanel({ habits, journalEntry, onHabitToggle, onJournalChange, habitConfig, onBreathworkDone, onBreathworkSkip, committed, onCommit, streakDays, flowStep, setFlowStep, flowCelebrating, setFlowCelebrating, flowCollapsed, setFlowCollapsed }) {
  const [showPicker, setShowPicker] = useState(false);
  // Auto-show editor when custom pack has no habits
  const [showEditor, setShowEditor] = useState(
    habitConfig?.packId === 'custom' && (!habitConfig?.habits || habitConfig.habits.length === 0)
  );

  const habitDefs = habitConfig?.habits?.length > 0 ? habitConfig.habits : HABITS;

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
            {habits.length}/{habitDefs.length} habits {'\u00B7'} {journalEntry ? '\u270D\uFE0F written' : '\u{1F4DD} journal'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: spacing.sm }}>
          {habitConfig?.packId === 'custom' && (
            <button
              onClick={() => setShowEditor(!showEditor)}
              aria-label="Edit habits"
              style={{
                padding: `${spacing.xs}px ${spacing.md}px`,
                borderRadius: 20,
                border: `1px solid ${colors.borderActive}`,
                background: showEditor ? colors.primaryBg : 'transparent',
                color: showEditor ? colors.primary : colors.textDim,
                fontSize: 12, fontWeight: 500, cursor: 'pointer',
                minHeight: 44,
              }}
            >
              {'\u270F\uFE0F'} Edit
            </button>
          )}
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
      </div>

      <MorningFlow
        habits={habits}
        habitDefs={habitDefs}
        onHabitToggle={onHabitToggle}
        journalEntry={journalEntry}
        onJournalChange={onJournalChange}
        onBreathworkDone={onBreathworkDone}
        onBreathworkSkip={onBreathworkSkip}
        committed={committed}
        onCommit={onCommit}
        streakDays={streakDays}
        flowStep={flowStep}
        setFlowStep={setFlowStep}
        flowCelebrating={flowCelebrating}
        setFlowCelebrating={setFlowCelebrating}
        flowCollapsed={flowCollapsed}
        setFlowCollapsed={setFlowCollapsed}
      />

      {/* Habit Editor for custom packs */}
      {showEditor && habitConfig?.packId === 'custom' && (
        <div style={{ marginTop: spacing.lg }}>
          <HabitEditor
            habits={habitConfig.habits}
            onAdd={habitConfig.addHabit}
            onRemove={habitConfig.removeHabit}
            onUpdate={habitConfig.updateHabit}
            onClose={() => setShowEditor(false)}
          />
        </div>
      )}
    </div>
  );
}
