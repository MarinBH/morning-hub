'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { API } from '../lib/constants';

const CalendarContext = createContext(null);

export function CalendarProvider({ children }) {
  const [events, setEvents] = useState([]);
  const [configured, setConfigured] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadEvents = useCallback(async () => {
    try {
      const res = await fetch(API.calendar);
      const data = await res.json();
      setEvents(data.events || []);
      setConfigured(data.configured);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  return (
    <CalendarContext.Provider value={{ events, configured, loading, error, refetch: loadEvents }}>
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendarEvents() {
  const ctx = useContext(CalendarContext);
  if (!ctx) throw new Error('useCalendarEvents must be used within CalendarProvider');
  return ctx;
}
