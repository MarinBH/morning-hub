'use client';
import { useState, useEffect, useCallback } from 'react';
import { loadLocal, saveLocal } from '../lib/utils';
import { HABIT_PACKS, CUSTOM_PACK, getPackById } from '../lib/habitPacks';

const STORAGE_KEY = 'hub-habit-config';

export function useHabitConfig() {
  const [config, setConfig] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = loadLocal(STORAGE_KEY, null);
    if (saved) {
      setConfig(saved);
    }
    setLoaded(true);
  }, []);

  const selectPack = useCallback((packId) => {
    const pack = getPackById(packId);
    const newConfig = {
      packId: pack.id,
      habits: pack.habits.map((h) => ({ ...h, custom: false })),
    };
    setConfig(newConfig);
    saveLocal(STORAGE_KEY, newConfig);
  }, []);

  const customizePack = useCallback((packId) => {
    const pack = getPackById(packId);
    const newConfig = {
      packId: 'custom',
      basedOn: packId,
      habits: pack.habits.map((h) => ({ ...h, custom: false })),
    };
    setConfig(newConfig);
    saveLocal(STORAGE_KEY, newConfig);
  }, []);

  const addHabit = useCallback((label, icon = '⭐') => {
    setConfig((prev) => {
      const updated = {
        ...prev,
        packId: 'custom',
        habits: [
          ...(prev?.habits || []),
          { id: `custom-${Date.now()}`, label, icon, custom: true },
        ],
      };
      saveLocal(STORAGE_KEY, updated);
      return updated;
    });
  }, []);

  const removeHabit = useCallback((habitId) => {
    setConfig((prev) => {
      const updated = {
        ...prev,
        habits: (prev?.habits || []).filter((h) => h.id !== habitId),
      };
      saveLocal(STORAGE_KEY, updated);
      return updated;
    });
  }, []);

  const updateHabit = useCallback((habitId, updates) => {
    setConfig((prev) => {
      const updated = {
        ...prev,
        habits: (prev?.habits || []).map((h) =>
          h.id === habitId ? { ...h, ...updates } : h
        ),
      };
      saveLocal(STORAGE_KEY, updated);
      return updated;
    });
  }, []);

  const isConfigured = config !== null;
  const habits = config?.habits || [];
  const packId = config?.packId || null;

  return {
    config,
    loaded,
    isConfigured,
    habits,
    packId,
    selectPack,
    customizePack,
    addHabit,
    removeHabit,
    updateHabit,
  };
}
