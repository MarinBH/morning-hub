'use client';
import { colors, radius, spacing, typography } from '../../lib/theme';
import { getDateString, fmtTime } from '../../lib/utils';
import { isTaskOverdue } from '../../lib/utils';
import { HABITS, PRIORITY_COLORS } from '../../lib/constants';
import { useTasks } from '../../contexts/TasksContext';
import { useCalendarEvents } from '../../contexts/CalendarContext';
import { useTaskGoals } from '../../contexts/TaskGoalsContext';
import Card from '../common/Card';
import Badge from '../common/Badge';
import { SkeletonCard } from '../common/Skeleton';
import MorningFlow from '../practice/MorningFlow';

export default function Dashboard({ habits, journalEntry, onHabitToggle, onJournalChange, onNavigate, committed, onCommit, habitConfig, onBreathworkDone, onBreathworkSkip, streakDays, knowledge, flowStep, setFlowStep, flowCelebrating, setFlowCelebrating, flowCollapsed, setFlowCollapsed }) {
  const { tasks, loading: loadingTasks, error: errorTasks } = useTasks();
  const { getTaskGoal } = useTaskGoals();
  const { events } = useCalendarEvents();

  const habitDefs = habitConfig?.habits?.length > 0 ? habitConfig.habits : HABITS;

  const nextEvent = events?.[0];
  // Sort focus tasks by: impact score desc, then priority desc, then due date asc
  const focusTasks = [...tasks].sort((a, b) => {
    const aImpact = getTaskGoal(a.id)?.impactScore || 0;
    const bImpact = getTaskGoal(b.id)?.impactScore || 0;
    if (bImpact !== aImpact) return bImpact - aImpact;
    if (b.priority !== a.priority) return b.priority - a.priority;
    const aDate = a.due?.date || '9999';
    const bDate = b.due?.date || '9999';
    return aDate.localeCompare(bDate);
  });
  const topFocusTasks = focusTasks.slice(0, 3).filter((t) => (getTaskGoal(t.id)?.impactScore || 0) >= 1 || t.priority >= 3);
  const previewTasks = tasks.slice(0, 5);

  return (
    <div style={{ padding: `0 ${spacing.xl}px 100px` }}>
      {/* Date */}
      <div style={{ marginBottom: spacing.xxl }}>
        <div style={typography.label}>{getDateString().toUpperCase()}</div>
      </div>

      {/* Today's Focus */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(108,155,255,0.08), rgba(139,108,255,0.08))',
          borderRadius: radius.md,
          padding: `${spacing.xl}px`,
          marginBottom: spacing.lg,
          border: '1px solid rgba(108,155,255,0.12)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: colors.primary, textTransform: 'uppercase', letterSpacing: 1 }}>
            Today&apos;s Focus
          </span>
        </div>

        {loadingTasks ? (
          <div style={{ fontSize: 14, color: colors.textDim }}>Loading priorities...</div>
        ) : errorTasks ? (
          <div style={{ fontSize: 14, color: colors.danger }}>Failed to load tasks</div>
        ) : topFocusTasks.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
            {topFocusTasks.map((task, i) => {
              const impact = getTaskGoal(task.id)?.impactScore || 0;
              return (
                <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 6,
                    background: i === 0 ? 'rgba(108,155,255,0.15)' : 'rgba(255,255,255,0.04)',
                    border: `1.5px solid ${i === 0 ? colors.primary : colors.textGhost}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700, color: i === 0 ? colors.primary : colors.textFaint,
                  }}>
                    {i + 1}
                  </div>
                  <span style={{
                    fontSize: 14, color: i === 0 ? colors.text : 'rgba(240,237,230,0.7)',
                    fontWeight: i === 0 ? 600 : 400, flex: 1,
                  }}>
                    {task.content}
                  </span>
                  {impact > 0 && (
                    <span style={{ fontSize: 10, color: colors.warning, letterSpacing: -1 }}>
                      {'\u2605'.repeat(Math.min(Math.max(impact, 0), 5))}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : previewTasks.length > 0 ? (
          <div style={{ fontSize: 14, color: colors.textMuted }}>
            {tasks.length} task{tasks.length !== 1 ? 's' : ''} today
          </div>
        ) : (
          <div style={{ fontSize: 14, color: colors.textMuted }}>
            No tasks for today
          </div>
        )}

        {nextEvent && (
          <div style={{
            marginTop: spacing.md, paddingTop: spacing.md,
            borderTop: '1px solid rgba(108,155,255,0.1)',
            display: 'flex', alignItems: 'center', gap: spacing.sm,
          }}>
            <span style={{ fontSize: 13, color: colors.textDim }}>
              Next: <span style={{ color: colors.text }}>{nextEvent.summary}</span>
              {nextEvent.start && (
                <span style={{ color: colors.textFaint }}>
                  {' '}{'\u00B7'} {fmtTime(nextEvent.start)}
                </span>
              )}
            </span>
          </div>
        )}

      </div>

      {/* Morning Flow Carousel */}
      <div style={{ marginBottom: spacing.lg }}>
        <MorningFlow
          habits={habits}
          habitDefs={habitDefs}
          onHabitToggle={onHabitToggle}
          journalEntry={journalEntry}
          onJournalChange={onJournalChange}
          onBreathworkDone={onBreathworkDone}
          onBreathworkSkip={onBreathworkSkip}
          committed={committed}
          onCommit={onCommit}
          streakDays={streakDays}
          flowStep={flowStep}
          setFlowStep={setFlowStep}
          flowCelebrating={flowCelebrating}
          setFlowCelebrating={setFlowCelebrating}
          flowCollapsed={flowCollapsed}
          setFlowCollapsed={setFlowCollapsed}
          compact
        />
      </div>

      {/* Tasks Overview */}
      <Card
        title="Tasks"
        subtitle={loadingTasks ? 'Loading...' : errorTasks ? 'Error' : `${previewTasks.length} due today`}
        action={
          <button
            onClick={() => onNavigate('tasks')}
            style={{ fontSize: 12, color: colors.primary, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, minHeight: 44, padding: `${spacing.sm}px` }}
          >
            View all {'\u2192'}
          </button>
        }
        style={{ marginBottom: spacing.lg }}
      >
        {loadingTasks ? (
          <SkeletonCard lines={3} />
        ) : errorTasks ? (
          <div style={{ padding: spacing.xl, textAlign: 'center', color: colors.danger, fontSize: 14 }}>Could not load tasks</div>
        ) : previewTasks.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {previewTasks.slice(0, 4).map((task) => {
              const overdue = isTaskOverdue(task);
              return (
                <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: 4, flexShrink: 0,
                    background: PRIORITY_COLORS[task.priority] || PRIORITY_COLORS[1],
                  }} />
                  <span style={{ fontSize: 14, color: colors.text, flex: 1 }}>{task.content}</span>
                  {overdue && <Badge color={colors.danger} bg={colors.dangerBg}>overdue</Badge>}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: spacing.lg, textAlign: 'center', color: colors.textFaint, fontSize: 14 }}>
            All clear for today
          </div>
        )}
      </Card>
    </div>
  );
}
