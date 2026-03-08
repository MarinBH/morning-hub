'use client';
import { useState, useEffect, useRef } from 'react';
import { loadLocal, saveLocal } from '../lib/utils';
import { STORAGE_KEYS, WHEEL_OF_LIFE_AREAS } from '../lib/constants';

export function useWheelOfLife() {
  const [scores, setScores] = useState({});
  const [goals, setGoals] = useState({});
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef(null);

  useEffect(() => {
    const saved = loadLocal(STORAGE_KEYS.wheelOfLife, null);
    if (saved) {
      setScores(saved.scores || {});
      setGoals(saved.goals || {});
    }
    setLoaded(true);
  }, []);

  // Debounced save (300ms) — prevents rapid localStorage writes during slider drags
  useEffect(() => {
    if (!loaded) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveLocal(STORAGE_KEYS.wheelOfLife, { scores, goals });
    }, 300);
    return () => clearTimeout(saveTimer.current);
  }, [scores, goals, loaded]);

  const setScore = (areaId, score) => {
    setScores((prev) => ({ ...prev, [areaId]: score }));
  };

  const addGoal = (areaId, text) => {
    setGoals((prev) => ({
      ...prev,
      [areaId]: [...(prev[areaId] || []), { id: crypto.randomUUID(), text, done: false }],
    }));
  };

  const toggleGoal = (areaId, goalId) => {
    setGoals((prev) => ({
      ...prev,
      [areaId]: (prev[areaId] || []).map((g) =>
        g.id === goalId ? { ...g, done: !g.done } : g
      ),
    }));
  };

  const avgScore =
    Object.values(scores).length > 0
      ? (Object.values(scores).reduce((a, b) => a + b, 0) / WHEEL_OF_LIFE_AREAS.length).toFixed(1)
      : '0.0';

  return {
    scores,
    goals,
    loaded,
    avgScore,
    setScore,
    addGoal,
    toggleGoal,
  };
}
