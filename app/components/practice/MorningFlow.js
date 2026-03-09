'use client';
import { useState, useRef, useCallback } from 'react';
import { colors, radius, spacing } from '../../lib/theme';
import { getPrompt } from '../../lib/constants';
import HabitsStep from './HabitsStep';
import BreathStep from './BreathStep';
import JournalStep from './JournalStep';
import CommitStep from './CommitStep';
import CelebrationCard, { CompactSummary } from './CelebrationCard';

const STEPS = ['habits', 'breathe', 'journal', 'commit'];
const STEP_LABELS = ['Habits', 'Breathe', 'Journal', 'Commit'];

export default function MorningFlow({
  habits, habitDefs, onHabitToggle,
  journalEntry, onJournalChange,
  onBreathworkDone, onBreathworkSkip, committed, onCommit,
  streakDays, compact = false,
  // External state (shared between Dashboard + Practice tab)
  flowStep, setFlowStep, flowCelebrating, setFlowCelebrating, flowCollapsed, setFlowCollapsed,
}) {
  // Use external state if provided, otherwise fall back to local state
  const [_localStep, _setLocalStep] = useState(0);
  const [_localCelebrating, _setLocalCelebrating] = useState(false);
  const [_localCollapsed, _setLocalCollapsed] = useState(committed);

  const step = flowStep ?? _localStep;
  const setStep = setFlowStep ?? _setLocalStep;
  const celebrating = flowCelebrating ?? _localCelebrating;
  const setCelebrating = setFlowCelebrating ?? _setLocalCelebrating;
  const collapsed = flowCollapsed ?? _localCollapsed;
  const setCollapsed = setFlowCollapsed ?? _setLocalCollapsed;
  const touchStartRef = useRef(null);
  const prompt = getPrompt();

  const totalHabits = habitDefs.length;
  const habitCount = habits.length;

  const goNext = useCallback(() => {
    if (step < STEPS.length - 1) setStep(step + 1);
  }, [step]);

  const goPrev = useCallback(() => {
    if (step > 0) setStep(step - 1);
  }, [step]);

  // Swipe handlers — skip swipe when interacting with textarea/input (#15)
  const handleTouchStart = (e) => {
    const tag = e.target.tagName;
    if (tag === 'TEXTAREA' || tag === 'INPUT') {
      touchStartRef.current = null;
      return;
    }
    if (!e.touches?.[0]) return;
    touchStartRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartRef.current === null) return;
    if (!e.changedTouches?.[0]) return;
    const diff = touchStartRef.current - e.changedTouches[0].clientX;
    touchStartRef.current = null;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goNext();
      else goPrev();
    }
  };

  const handleCommit = (intention) => {
    onCommit(intention);
    setCelebrating(true);
  };

  const handleBreathDone = () => {
    onBreathworkDone?.();
    goNext();
  };

  const handleBreathSkip = () => {
    onBreathworkSkip?.();
    goNext();
  };

  // Collapsed summary bar
  if (collapsed && committed) {
    return (
      <CompactSummary
        habitCount={habitCount}
        totalHabits={totalHabits}
        hasJournal={!!journalEntry}
        streakDays={streakDays}
        onExpand={() => { setCollapsed(false); setStep(3); }}
      />
    );
  }

  // Celebration screen
  if (celebrating) {
    return (
      <div style={{
        background: colors.bgCard,
        borderRadius: radius.md,
        border: `1px solid ${colors.border}`,
        overflow: 'hidden',
      }}>
        <CelebrationCard
          habitCount={habitCount}
          totalHabits={totalHabits}
          hasJournal={!!journalEntry}
          streakDays={streakDays}
          onCollapse={() => {
            setCelebrating(false);
            setCollapsed(true);
          }}
        />
      </div>
    );
  }

  return (
    <div style={{
      background: colors.bgCard,
      borderRadius: radius.md,
      border: `1px solid ${colors.border}`,
      overflow: 'hidden',
    }}>
      {/* Progress dots + step label */}
      <div style={{
        padding: `${spacing.lg}px ${spacing.xl}px ${spacing.sm}px`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              aria-label={`Go to ${STEP_LABELS[i]}`}
              style={{
                width: i === step ? 20 : 8, height: 8,
                borderRadius: 4, border: 'none',
                background: i === step ? colors.primary : i < step ? colors.success : colors.textGhost,
                cursor: 'pointer', transition: 'all 0.3s',
                padding: 0, minHeight: 0,
              }}
            />
          ))}
        </div>
        <span style={{ fontSize: 12, color: colors.textFaint, fontWeight: 500 }}>
          {STEP_LABELS[step]}
        </span>
      </div>

      {/* Step content — swipeable */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ padding: `${spacing.md}px ${spacing.xl}px ${spacing.xl}px`, minHeight: compact ? 180 : 220 }}
      >
        {step === 0 && (
          <HabitsStep
            habits={habits}
            habitDefs={habitDefs}
            onToggle={onHabitToggle}
          />
        )}
        {/* BreathStep uses display:none to preserve timer state when navigating away (#17) */}
        <div style={{ display: step === 1 ? 'block' : 'none' }}>
          <BreathStep onComplete={handleBreathDone} onSkip={handleBreathSkip} />
        </div>
        {step === 2 && (
          <JournalStep
            value={journalEntry}
            onChange={onJournalChange}
            prompt={prompt}
          />
        )}
        {step === 3 && (
          <CommitStep
            onCommit={handleCommit}
            committed={committed}
          />
        )}
      </div>

      {/* Navigation arrows */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        padding: `0 ${spacing.xl}px ${spacing.lg}px`,
      }}>
        <button
          onClick={goPrev}
          disabled={step === 0}
          style={{
            background: 'none', border: 'none',
            color: step === 0 ? colors.textGhost : colors.textDim,
            fontSize: 13, cursor: step === 0 ? 'default' : 'pointer',
            minHeight: 44, padding: `${spacing.sm}px ${spacing.md}px`,
          }}
        >
          {'\u2190'} Back
        </button>
        {step < STEPS.length - 1 && (
          <button
            onClick={goNext}
            style={{
              background: 'none', border: 'none',
              color: colors.primary, fontSize: 13,
              fontWeight: 500, cursor: 'pointer',
              minHeight: 44, padding: `${spacing.sm}px ${spacing.md}px`,
            }}
          >
            Next {'\u2192'}
          </button>
        )}
      </div>
    </div>
  );
}
