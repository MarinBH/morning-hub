'use client';
import { useState, useEffect, useCallback } from 'react';
import { loadLocal, saveLocal } from '../lib/utils';

const STORAGE_KEY = 'hub-knowledge';

export function useKnowledge() {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = loadLocal(STORAGE_KEY, []);
    setItems(saved);
    setLoaded(true);
  }, []);

  const save = useCallback((newItems) => {
    setItems(newItems);
    saveLocal(STORAGE_KEY, newItems);
  }, []);

  const addItem = useCallback((item) => {
    setItems((prev) => {
      const updated = [{ ...item, id: `k-${Date.now()}`, createdAt: new Date().toISOString() }, ...prev];
      saveLocal(STORAGE_KEY, updated);
      return updated;
    });
  }, []);

  const removeItem = useCallback((id) => {
    setItems((prev) => {
      const updated = prev.filter((i) => i.id !== id);
      saveLocal(STORAGE_KEY, updated);
      return updated;
    });
  }, []);

  return { items, loaded, addItem, removeItem };
}
