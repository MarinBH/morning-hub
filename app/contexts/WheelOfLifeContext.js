'use client';
import { createContext, useContext } from 'react';
import { useWheelOfLife } from '../hooks/useWheelOfLife';

const WheelOfLifeContext = createContext(null);

export function WheelOfLifeProvider({ children }) {
  const wheelOfLife = useWheelOfLife();
  return (
    <WheelOfLifeContext.Provider value={wheelOfLife}>
      {children}
    </WheelOfLifeContext.Provider>
  );
}

export function useWheelOfLifeContext() {
  const ctx = useContext(WheelOfLifeContext);
  if (!ctx) throw new Error('useWheelOfLifeContext must be used within WheelOfLifeProvider');
  return ctx;
}
