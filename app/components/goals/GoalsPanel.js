'use client';
import { useState } from 'react';
import { colors, radius, spacing, typography, fonts } from '../../lib/theme';
import { WHEEL_OF_LIFE_AREAS } from '../../lib/constants';
import { useWheelOfLife } from '../../hooks/useWheelOfLife';
import Card from '../common/Card';
import WheelOfLife from '../common/WheelOfLife';

export default function GoalsPanel() {
  const { scores, goals, avgScore, setScore, addGoal, toggleGoal } = useWheelOfLife();
  const [expandedArea, setExpandedArea] = useState(null);
  const [newGoalText, setNewGoalText] = useState('');

  const handleAddGoal = (areaId) => {
    if (!newGoalText.trim()) return;
    addGoal(areaId, newGoalText.trim());
    setNewGoalText('');
  };

  return (
    <div style={{ padding: `0 ${spacing.xl}px 100px` }}>
      <div style={{ marginBottom: spacing.xxl }}>
        <div style={typography.label}>WHEEL OF LIFE</div>
        <div style={{ fontSize: 14, color: colors.textDim }}>
          Rate each area 0&ndash;10 &middot; tap dots to adjust
        </div>
      </div>

      {/* Wheel Visualization */}
      <div
        style={{
          background: 'rgba(255,255,255,0.02)',
          borderRadius: radius.md,
          padding: `${spacing.lg}px 0`,
          marginBottom: spacing.xl,
        }}
      >
        <WheelOfLife
          scores={scores}
          size={300}
          interactive
          onScoreChange={setScore}
        />
      </div>

      {/* Area Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
        {WHEEL_OF_LIFE_AREAS.map((area) => {
          const score = scores[area.id] ?? 0;
          const areaGoals = goals[area.id] || [];
          const isExpanded = expandedArea === area.id;
          const completedGoals = areaGoals.filter((g) => g.done).length;

          return (
            <Card
              key={area.id}
              collapsible
              collapsed={!isExpanded}
              onToggle={() => setExpandedArea(isExpanded ? null : area.id)}
              title={`${area.icon} ${area.label}`}
              subtitle={`${score}/10${areaGoals.length > 0 ? ` \u00B7 ${completedGoals}/${areaGoals.length} goals` : ''}`}
              action={
                <div
                  style={{
                    width: 32,
                    height: 6,
                    borderRadius: 3,
                    background: 'rgba(255,255,255,0.06)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${score * 10}%`,
                      height: '100%',
                      borderRadius: 3,
                      background: area.color,
                      transition: 'width 0.3s',
                    }}
                  />
                </div>
              }
              style={{ borderLeft: `3px solid ${area.color}` }}
            >
              {/* Description */}
              <div style={{ fontSize: 13, color: colors.textDim, marginBottom: spacing.md }}>
                {area.description}
              </div>

              {/* Score Slider */}
              <div style={{ marginBottom: spacing.lg }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing.xs }}>
                  <span style={{ fontSize: 12, color: colors.textFaint }}>Satisfaction</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: area.color }}>{score}/10</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={score}
                  onChange={(e) => setScore(area.id, parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    accentColor: area.color,
                    height: 4,
                  }}
                />
              </div>

              {/* Goals for this area */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: colors.textFaint, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm }}>
                  Goals in this area
                </div>
                {areaGoals.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: spacing.md }}>
                    {areaGoals.map((goal) => (
                      <div
                        key={goal.id}
                        onClick={() => toggleGoal(area.id, goal.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: spacing.sm,
                          padding: `${spacing.sm}px 0`,
                          cursor: 'pointer',
                        }}
                      >
                        <div
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: 5,
                            border: goal.done ? `2px solid ${colors.success}` : `2px solid ${colors.textGhost}`,
                            background: goal.done ? 'rgba(108,255,184,0.15)' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            transition: 'all 0.2s',
                          }}
                        >
                          {goal.done && <span style={{ fontSize: 11, color: colors.success }}>{'\u2713'}</span>}
                        </div>
                        <span
                          style={{
                            fontSize: 14,
                            color: goal.done ? colors.textDim : colors.text,
                            textDecoration: goal.done ? 'line-through' : 'none',
                          }}
                        >
                          {goal.text}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: colors.textFaint, marginBottom: spacing.md }}>
                    No goals yet &mdash; add one below
                  </div>
                )}

                {/* Add goal input */}
                <div style={{ display: 'flex', gap: spacing.sm }}>
                  <input
                    type="text"
                    value={expandedArea === area.id ? newGoalText : ''}
                    onChange={(e) => setNewGoalText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddGoal(area.id)}
                    placeholder={`Add a goal for ${area.label.split(' ')[0].toLowerCase()}...`}
                    style={{
                      flex: 1,
                      padding: `${spacing.sm}px ${spacing.md}px`,
                      borderRadius: radius.md,
                      border: `1px solid ${colors.border}`,
                      background: 'rgba(255,255,255,0.03)',
                      color: colors.text,
                      fontSize: 13,
                      fontFamily: fonts.body,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    onClick={() => handleAddGoal(area.id)}
                    style={{
                      padding: `${spacing.sm}px ${spacing.md}px`,
                      borderRadius: radius.md,
                      border: 'none',
                      background: newGoalText.trim() ? area.color : colors.bgCardHover,
                      color: newGoalText.trim() ? colors.bg : colors.textFaint,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: newGoalText.trim() ? 'pointer' : 'default',
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
