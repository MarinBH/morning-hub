'use client';
import { useState, useEffect } from 'react';
import { loadLocal, saveLocal } from '../lib/utils';
import { STORAGE_KEYS, WHEEL_OF_LIFE_AREAS } from '../lib/constants';

export function useWheelOfLife() {
  const [scores, setScores] = useState({});
  const [goals, setGoals] = useState({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = loadLocal(STORAGE_KEYS.wheelOfLife, null);
    if (saved) {
      setScores(saved.scores || {});
      setGoals(saved.goals || {});
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    saveLocal(STORAGE_KEYS.wheelOfLife, { scores, goals });
  }, [scores, goals, loaded]);

  const setScore = (areaId, score) => {
    setScores((prev) => ({ ...prev, [areaId]: score }));
  };

  const addGoal = (areaId, text) => {
    const areaGoals = goals[areaId] || [];
    setGoals((prev) => ({
      ...prev,
      [areaId]: [...areaGoals, { id: crypto.randomUUID(), text, done: false }],
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
