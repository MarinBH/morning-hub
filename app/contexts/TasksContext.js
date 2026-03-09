'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { filterSystemTasks } from '../lib/utils';
import { API } from '../lib/constants';

const TasksContext = createContext(null);

export function TasksProvider({ children }) {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadTasks = useCallback(async () => {
    setError(null);
    try {
      const [taskRes, projRes] = await Promise.all([
        fetch(API.todoistTasks),
        fetch(API.todoistProjects),
      ]);
      const taskData = await taskRes.json();
      const projData = await projRes.json();

      if (taskData.error) {
        setError(taskData.error);
        setLoading(false);
        return;
      }

      const projMap = {};
      (projData.results || []).forEach((p) => {
        projMap[p.id] = p.name;
      });
      setProjects(projMap);

      const sorted = filterSystemTasks(taskData.results || []).sort((a, b) => {
        if (a.priority !== b.priority) return b.priority - a.priority;
        const aDate = a.due?.date || '9999';
        const bDate = b.due?.date || '9999';
        return aDate.localeCompare(bDate);
      });

      setTasks(sorted);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const removeTask = useCallback((taskId) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }, []);

  return (
    <TasksContext.Provider value={{ tasks, projects, loading, error, refetch: loadTasks, removeTask }}>
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks() {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error('useTasks must be used within TasksProvider');
  return ctx;
}
