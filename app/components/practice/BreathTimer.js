'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { colors } from '../../lib/theme';

const PHASES = { inhale: 4, hold: 4, exhale: 6 };
const TOTAL_CYCLES = 4;
const labels = { inhale: 'Breathe in', hold: 'Hold', exhale: 'Breathe out', idle: 'Ready', done: 'Complete' };
const phaseColors = {
  inhale: colors.primary,
  hold: colors.secondary,
  exhale: colors.success,
  idle: colors.textFaint,
  done: colors.warning,
};

export default function BreathTimer() {
  const [active, setActive] = useState(false);
  const [phase, setPhase] = useState('idle');
  const [count, setCount] = useState(0);
  const [cycle, setCycle] = useState(0);
  const intervalRef = useRef(null);
  const refs = useRef({ phase: 'idle', count: 0, cycle: 0 });

  const stop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setActive(false);
    setPhase('idle');
    setCount(0);
    setCycle(0);
    refs.current = { phase: 'idle', count: 0, cycle: 0 };
  }, []);

  const start = useCallback(() => {
    setActive(true);
    refs.current = { phase: 'inhale', count: PHASES.inhale, cycle: 0 };
    setPhase('inhale');
    setCount(PHASES.inhale);
    setCycle(0);

    intervalRef.current = setInterval(() => {
      const r = refs.current;
      r.count -= 1;
      if (r.count <= 0) {
        if (r.phase === 'inhale') { r.phase = 'hold'; r.count = PHASES.hold; }
        else if (r.phase === 'hold') { r.phase = 'exhale'; r.count = PHASES.exhale; }
        else if (r.phase === 'exhale') {
          r.cycle += 1;
          if (r.cycle >= TOTAL_CYCLES) {
            clearInterval(intervalRef.current);
            r.phase = 'done';
            setPhase('done');
            setActive(false);
            return;
          }
          r.phase = 'inhale';
          r.count = PHASES.inhale;
        }
        setCycle(r.cycle);
      }
      setPhase(r.phase);
      setCount(r.count);
    }, 1000);
  }, []);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const maxT = PHASES[phase] || 1;
  const progress = phase === 'done' ? 1 : phase === 'idle' ? 0 : count / maxT;
  const scale = phase === 'inhale' ? 1 + (1 - progress) * 0.15 : phase === 'exhale' ? 1 + progress * 0.15 : phase === 'hold' ? 1.15 : 1;
  const c = phaseColors[phase];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0' }}>
      <div style={{ position: 'relative', width: 140, height: 140, marginBottom: 20 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: `radial-gradient(circle, ${c}15, transparent)`, transform: `scale(${scale})`, transition: 'transform 1s ease-in-out, background 0.5s' }} />
        <div style={{ position: 'absolute', inset: 8, borderRadius: '50%', border: `2px solid ${c}40`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: phase === 'idle' || phase === 'done' ? 16 : 36, fontWeight: 300, color: c, fontVariantNumeric: 'tabular-nums' }}>
            {phase === 'idle' ? '4-4-6' : phase === 'done' ? '\u{1F64F}' : count}
          </div>
          <div style={{ fontSize: 11, color: c, opacity: 0.7, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
            {labels[phase]}
          </div>
        </div>
      </div>
      {active && <div style={{ fontSize: 12, color: colors.textFaint, marginBottom: 12 }}>Cycle {cycle + 1} of {TOTAL_CYCLES}</div>}
      <button
        onClick={active ? stop : start}
        style={{
          padding: '10px 32px', borderRadius: 100,
          border: `1px solid ${active ? colors.dangerBorder : colors.primaryBorder}`,
          background: active ? colors.dangerBg : colors.primaryBg,
          color: active ? colors.danger : colors.primary,
          fontSize: 14, fontWeight: 500, cursor: 'pointer',
        }}
      >
        {phase === 'done' ? 'Again' : active ? 'Stop' : 'Begin'}
      </button>
    </div>
  );
}
