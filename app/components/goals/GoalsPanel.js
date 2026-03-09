'use client';
import { useState } from 'react';
import { colors, radius, spacing, typography } from '../../lib/theme';
import { WHEEL_OF_LIFE_AREAS } from '../../lib/constants';
import { useWheelOfLifeContext } from '../../contexts/WheelOfLifeContext';
import { useTaskGoals } from '../../contexts/TaskGoalsContext';
import WheelOfLife from '../common/WheelOfLife';
import DomainJourney from './DomainJourney';
import MilestoneList from './MilestoneList';

export default function GoalsPanel() {
  const { scores, goals, avgScore, setScore, addGoal, toggleGoal, removeGoal } = useWheelOfLifeContext();
  const { getTasksByDomain } = useTaskGoals();
  const [expandedArea, setExpandedArea] = useState(null);

  return (
    <div style={{ padding: `0 ${spacing.xl}px 100px` }}>
      <div style={{ marginBottom: spacing.xxl }}>
        <div style={typography.label}>LIFE JOURNEYS</div>
        <div style={{ fontSize: 14, color: colors.textDim }}>
          Balance score: {avgScore || '0.0'}/10
        </div>
      </div>

      {/* Wheel Visualization */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        borderRadius: radius.md,
        padding: `${spacing.lg}px 0`,
        marginBottom: spacing.xl,
      }}>
        <WheelOfLife
          scores={scores}
          size={280}
          interactive
          onScoreChange={setScore}
        />
      </div>

      {/* Domain Journey Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
        {WHEEL_OF_LIFE_AREAS.map((area) => {
          const score = scores[area.id] ?? 0;
          const areaGoals = goals[area.id] || [];
          const linkedTaskIds = getTasksByDomain(area.id);
          const isExpanded = expandedArea === area.id;

          return (
            <div key={area.id}>
              {/* Compact card — tap to expand */}
              <div onClick={() => setExpandedArea(isExpanded ? null : area.id)}>
                <DomainJourney
                  area={area}
                  score={score}
                  milestones={areaGoals}
                  compact
                />
                {linkedTaskIds.length > 0 && (
                  <div style={{
                    padding: `${spacing.xs}px ${spacing.lg}px ${spacing.sm}px`,
                    fontSize: 11, color: area.color,
                    background: colors.bgCard,
                    borderRadius: `0 0 ${radius.sm}px ${radius.sm}px`,
                    marginTop: -2,
                  }}>
                    {linkedTaskIds.length} task{linkedTaskIds.length !== 1 ? 's' : ''} linked
                  </div>
                )}
              </div>

              {/* Expanded view */}
              {isExpanded && (
                <div style={{
                  background: colors.bgCard,
                  borderRadius: `0 0 ${radius.md}px ${radius.md}px`,
                  border: `1px solid ${colors.border}`,
                  borderTop: 'none',
                  padding: spacing.xl,
                  animation: 'fadeUp 0.2s ease',
                }}>
                  {/* Full journey visual */}
                  <DomainJourney area={area} score={score} milestones={areaGoals} />

                  {/* Score slider */}
                  <div style={{ marginBottom: spacing.xl }}>
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
                      style={{ width: '100%', accentColor: area.color, height: 4 }}
                    />
                  </div>

                  {/* Description */}
                  <div style={{ fontSize: 13, color: colors.textDim, marginBottom: spacing.lg }}>
                    {area.description}
                  </div>

                  {/* Milestones */}
                  <MilestoneList
                    areaId={area.id}
                    areaColor={area.color}
                    milestones={areaGoals}
                    onAdd={addGoal}
                    onToggle={toggleGoal}
                    onRemove={removeGoal}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
