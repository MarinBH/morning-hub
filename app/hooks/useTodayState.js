'use client';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { todayKey, loadLocal, saveLocal } from '../lib/utils';
import { STORAGE_KEYS, HABITS } from '../lib/constants';

export function useTodayState(totalHabitsOverride) {
  const [habits, setHabits] = useState([]);
  const [journal, setJournal] = useState('');
  const [captures, setCaptures] = useState([]);
  const [breathworkDone, setBreathworkDone] = useState(false);
  const [breathworkSkipped, setBreathworkSkipped] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const saveTimerRef = useRef(null);

  useEffect(() => {
    const key = STORAGE_KEYS.dailyState(todayKey());
    const saved = loadLocal(key, null);
    if (saved) {
      setHabits(saved.habits || []);
      setJournal(saved.journal || '');
      setCaptures(saved.captures || []);
      setBreathworkDone(saved.breathworkDone || false);
      setBreathworkSkipped(saved.breathworkSkipped || false);
    }
    setLoaded(true);
  }, []);

  // Debounced save — 500ms delay to avoid writing on every keystroke
  useEffect(() => {
    if (!loaded) return;
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveLocal(STORAGE_KEYS.dailyState(todayKey()), { habits, journal, captures, breathworkDone, breathworkSkipped });
    }, 500);
    return () => clearTimeout(saveTimerRef.current);
  }, [habits, journal, captures, breathworkDone, breathworkSkipped, loaded]);

  const toggleHabit = (id) =>
    setHabits((p) => (p.includes(id) ? p.filter((h) => h !== id) : [...p, id]));

  const addCapture = (capture) => setCaptures((p) => [...p, capture]);

  // Clear habits when pack changes to avoid orphaned IDs
  const clearHabits = useCallback(() => setHabits([]), []);

  // Momentum score — habits 50%, journal 25%, breathwork 25%
  const totalHabits = totalHabitsOverride ?? HABITS.length;
  const momentumScore = Math.round(
    (totalHabits > 0 ? (habits.length / totalHabits) * 50 : 0) +
    (journal ? 25 : 0) +
    (breathworkDone ? (breathworkSkipped ? 10 : 25) : 0)
  );

  // Streak — count consecutive days with at least 1 habit logged (memoized)
  const streakDays = useMemo(() => {
    if (!loaded) return 0;
    let count = 0;
    const today = new Date();
    for (let i = 1; i <= 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = STORAGE_KEYS.dailyState(d.toISOString().split('T')[0]);
      const saved = loadLocal(key, null);
      if (saved?.habits?.length > 0) {
        count++;
      } else {
        break;
      }
    }
    if (habits.length > 0) count++;
    return count;
  }, [habits, loaded]);

  return {
    habits,
    journal,
    captures,
    breathworkDone,
    breathworkSkipped,
    loaded,
    momentumScore,
    streakDays,
    toggleHabit,
    setJournal,
    addCapture,
    setBreathworkDone,
    setBreathworkSkipped,
    clearHabits,
  };
}
