'use client';
import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { loadLocal, saveLocal } from '../lib/utils';
import { useTasks } from './TasksContext';

const STORAGE_KEY = 'hub-task-goals';
const TaskGoalsContext = createContext(null);

export function TaskGoalsProvider({ children }) {
  const { allTasks } = useTasks();
  const [taskGoals, setTaskGoals] = useState(() => loadLocal(STORAGE_KEY, {}));
  const prevTaskIdsRef = useRef(null);

  // Persist on change
  useEffect(() => {
    saveLocal(STORAGE_KEY, taskGoals);
  }, [taskGoals]);

  // Orphan cleanup: prune mappings for tasks no longer in Todoist
  useEffect(() => {
    if (!allTasks.length) return;
    const currentIds = new Set(allTasks.map((t) => String(t.id)));

    // Only run if task list has actually changed
    const idsKey = [...currentIds].sort().join(',');
    if (prevTaskIdsRef.current === idsKey) return;
    prevTaskIdsRef.current = idsKey;

    setTaskGoals((prev) => {
      const keys = Object.keys(prev);
      const orphans = keys.filter((id) => !currentIds.has(id));
      if (orphans.length === 0) return prev;
      console.log(`[TaskGoals] Pruned ${orphans.length} orphan mapping(s)`);
      const cleaned = { ...prev };
      orphans.forEach((id) => delete cleaned[id]);
      return cleaned;
    });
  }, [allTasks]);

  const linkTask = useCallback((taskId, data) => {
    setTaskGoals((prev) => ({
      ...prev,
      [String(taskId)]: {
        ...prev[String(taskId)],
        ...data,
        updatedAt: new Date().toISOString(),
      },
    }));
  }, []);

  const unlinkTask = useCallback((taskId) => {
    setTaskGoals((prev) => {
      const next = { ...prev };
      delete next[String(taskId)];
      return next;
    });
  }, []);

  const getTaskGoal = useCallback((taskId) => {
    return taskGoals[String(taskId)] || null;
  }, [taskGoals]);

  const getTasksByDomain = useCallback((domainId) => {
    return Object.entries(taskGoals)
      .filter(([, v]) => v.domainId === domainId)
      .map(([id]) => id);
  }, [taskGoals]);

  return (
    <TaskGoalsContext.Provider value={{
      taskGoals,
      linkTask,
      unlinkTask,
      getTaskGoal,
      getTasksByDomain,
    }}>
      {children}
    </TaskGoalsContext.Provider>
  );
}

export function useTaskGoals() {
  const ctx = useContext(TaskGoalsContext);
  if (!ctx) throw new Error('useTaskGoals must be used within TaskGoalsProvider');
  return ctx;
}
