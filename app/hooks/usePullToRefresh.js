'use client';
import { useState, useRef, useCallback } from 'react';

/**
 * Pull-to-refresh hook for mobile PWA.
 * Returns { refreshing, handlers, pullDistance } to attach to a scrollable container.
 * `onRefresh` should return a Promise.
 */
export function usePullToRefresh(onRefresh, { threshold = 80 } = {}) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);
  const pullDistanceRef = useRef(0);

  const onTouchStart = useCallback((e) => {
    // Only activate when scrolled to top
    const el = e.currentTarget;
    if (el.scrollTop > 0 || refreshing) return;
    startY.current = e.touches[0].clientY;
    pulling.current = true;
  }, [refreshing]);

  const onTouchMove = useCallback((e) => {
    if (!pulling.current) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta < 0) {
      pulling.current = false;
      setPullDistance(0);
      return;
    }
    // Dampen the pull (feels more natural)
    const dist = Math.min(delta * 0.4, threshold + 20);
    pullDistanceRef.current = dist;
    setPullDistance(dist);
  }, [threshold]);

  const onTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;
    if (pullDistanceRef.current >= threshold) {
      setRefreshing(true);
      setPullDistance(threshold * 0.5); // Hold at indicator position
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [threshold, onRefresh]);

  return {
    refreshing,
    pullDistance,
    handlers: { onTouchStart, onTouchMove, onTouchEnd },
  };
}
