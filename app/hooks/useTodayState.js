'use client';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { todayKey, loadLocal, saveLocal } from '../lib/utils';
import { STORAGE_KEYS, HABITS } from '../lib/constants';

export function useTodayState() {
  const [habits, setHabits] = useState([]);
  const [journal, setJournal] = useState('');
  const [captures, setCaptures] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const saveTimerRef = useRef(null);

  useEffect(() => {
    const key = STORAGE_KEYS.dailyState(todayKey());
    const saved = loadLocal(key, null);
    if (saved) {
      setHabits(saved.habits || []);
      setJournal(saved.journal || '');
      setCaptures(saved.captures || []);
    }
    setLoaded(true);
  }, []);

  // Debounced save — 500ms delay to avoid writing on every keystroke
  useEffect(() => {
    if (!loaded) return;
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveLocal(STORAGE_KEYS.dailyState(todayKey()), { habits, journal, captures });
    }, 500);
    return () => clearTimeout(saveTimerRef.current);
  }, [habits, journal, captures, loaded]);

  const toggleHabit = (id) =>
    setHabits((p) => (p.includes(id) ? p.filter((h) => h !== id) : [...p, id]));

  const addCapture = (capture) => setCaptures((p) => [...p, capture]);

  // Momentum score — derived, not stored
  const momentumScore = Math.round(
    ((habits.length / HABITS.length) * 100 + (journal ? 100 : 0)) / 2
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
    loaded,
    momentumScore,
    streakDays,
    toggleHabit,
    setJournal,
    addCapture,
  };
}
