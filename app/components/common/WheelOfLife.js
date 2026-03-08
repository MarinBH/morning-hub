'use client';
import { useMemo } from 'react';
import { colors, fonts } from '../../lib/theme';
import { WHEEL_OF_LIFE_AREAS } from '../../lib/constants';

export default function WheelOfLife({
  scores = {},
  size = 280,
  interactive = false,
  onScoreChange,
  avgScore: avgScoreProp,
}) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 30;
  const n = WHEEL_OF_LIFE_AREAS.length;
  const angleStep = (2 * Math.PI) / n;

  // Get point on the wheel for a given area index and score (0-10)
  const getPoint = (index, score) => {
    const angle = angleStep * index - Math.PI / 2; // Start from top
    const r = (score / 10) * maxR;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  // Memoize the score polygon path
  const scorePath = useMemo(() => {
    const points = WHEEL_OF_LIFE_AREAS.map((area, i) => {
      const score = scores[area.id] ?? 0;
      return getPoint(i, score);
    });
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';
  }, [scores, cx, cy, maxR, angleStep]);

  // Memoize score dot positions
  const scoreDots = useMemo(() => {
    return WHEEL_OF_LIFE_AREAS.map((area, i) => {
      const score = scores[area.id] ?? 0;
      return { ...area, score, point: getPoint(i, score) };
    });
  }, [scores, cx, cy, maxR, angleStep]);

  // Memoize label positions
  const labels = useMemo(() => {
    return WHEEL_OF_LIFE_AREAS.map((area, i) => {
      const labelPoint = getPoint(i, 12.5);
      const angle = angleStep * i - Math.PI / 2;
      const isRight = Math.cos(angle) > 0.1;
      const isLeft = Math.cos(angle) < -0.1;
      const textAnchor = isRight ? 'start' : isLeft ? 'end' : 'middle';
      return { ...area, labelPoint, textAnchor };
    });
  }, [cx, cy, maxR, angleStep]);

  // Grid rings (at 2, 4, 6, 8, 10)
  const rings = [2, 4, 6, 8, 10];

  const handleAreaClick = (areaId, currentScore) => {
    if (!interactive || !onScoreChange) return;
    const next = ((currentScore || 0) + 1) % 11; // Cycle 0-10
    onScoreChange(areaId, next);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background rings */}
        {rings.map((ring) => {
          const r = (ring / 10) * maxR;
          return (
            <circle
              key={ring}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="rgba(240,237,230,0.06)"
              strokeWidth={ring === 10 ? 1.5 : 0.5}
            />
          );
        })}

        {/* Axis lines */}
        {WHEEL_OF_LIFE_AREAS.map((area, i) => {
          const end = getPoint(i, 10);
          return (
            <line
              key={area.id}
              x1={cx}
              y1={cy}
              x2={end.x}
              y2={end.y}
              stroke="rgba(240,237,230,0.06)"
              strokeWidth={0.5}
            />
          );
        })}

        {/* Score fill */}
        <path
          d={scorePath}
          fill="rgba(108,155,255,0.08)"
          stroke="rgba(108,155,255,0.4)"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />

        {/* Score dots */}
        {scoreDots.map((dot) => (
          <circle
            key={`dot-${dot.id}`}
            cx={dot.point.x}
            cy={dot.point.y}
            r={4}
            fill={dot.color}
            stroke={colors.bg}
            strokeWidth={2}
            style={{ cursor: interactive ? 'pointer' : 'default' }}
            onClick={() => handleAreaClick(dot.id, dot.score)}
          />
        ))}

        {/* Labels */}
        {labels.map((lbl) => (
          <g key={`label-${lbl.id}`}>
            <text
              x={lbl.labelPoint.x}
              y={lbl.labelPoint.y}
              textAnchor={lbl.textAnchor}
              dominantBaseline="central"
              style={{
                fontSize: 9,
                fill: colors.textDim,
                fontFamily: fonts.body,
                fontWeight: 500,
                cursor: interactive ? 'pointer' : 'default',
              }}
              onClick={() => handleAreaClick(lbl.id, scores[lbl.id] ?? 0)}
            >
              {lbl.icon} {lbl.label.split(' ')[0]}
            </text>
            <text
              x={lbl.labelPoint.x}
              y={lbl.labelPoint.y + 12}
              textAnchor={lbl.textAnchor}
              dominantBaseline="central"
              style={{
                fontSize: 9,
                fill: lbl.color,
                fontFamily: fonts.body,
                fontWeight: 700,
              }}
            >
              {scores[lbl.id] ?? 0}/10
            </text>
          </g>
        ))}

        {/* Center score */}
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          style={{
            fontSize: 18,
            fontWeight: 700,
            fill: colors.text,
            fontFamily: fonts.body,
          }}
        >
          {avgScoreProp ?? getAvgScore(scores)}
        </text>
        <text
          x={cx}
          y={cy + 10}
          textAnchor="middle"
          style={{
            fontSize: 8,
            fill: colors.textFaint,
            fontFamily: fonts.body,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          BALANCE
        </text>
      </svg>
    </div>
  );
}

function getAvgScore(scores) {
  const values = Object.values(scores);
  if (values.length === 0) return '0.0';
  const avg = values.reduce((a, b) => a + b, 0) / WHEEL_OF_LIFE_AREAS.length;
  return avg.toFixed(1);
}
