'use client';
import { colors, radius, spacing } from '../../lib/theme';

// Domain visual metaphors with 5-tier progression
const DOMAIN_VISUALS = {
  health: {
    icon: '\u{1F3D4}\uFE0F',
    metaphor: 'Mountain',
    tiers: [
      { label: 'Base Camp', visual: '\u{1F3D5}\uFE0F', desc: 'Starting the climb' },
      { label: 'Forest Trail', visual: '\u{1F332}', desc: 'Building momentum' },
      { label: 'Rocky Pass', visual: '\u{26F0}\uFE0F', desc: 'Pushing through' },
      { label: 'Snow Line', visual: '\u{1F3D4}\uFE0F', desc: 'Near the peak' },
      { label: 'Summit', visual: '\u{1F3D4}\uFE0F\u2728', desc: 'Peak fitness achieved' },
    ],
  },
  career: {
    icon: '\u{1F3F0}',
    metaphor: 'Tower',
    tiers: [
      { label: 'Foundation', visual: '\u{1F9F1}', desc: 'Laying groundwork' },
      { label: 'First Floor', visual: '\u{1F3DB}\uFE0F', desc: 'Structure forming' },
      { label: 'Rising Floors', visual: '\u{1F3E2}', desc: 'Gaining height' },
      { label: 'Penthouse', visual: '\u{1F3E2}\u2728', desc: 'Command view' },
      { label: 'Spire', visual: '\u{1F3F0}', desc: 'Pinnacle reached' },
    ],
  },
  finance: {
    icon: '\u{1F4B0}',
    metaphor: 'Vault',
    tiers: [
      { label: 'First Coins', visual: '\u{1FA99}', desc: 'Seeds planted' },
      { label: 'Silver Chest', visual: '\u{1F4B0}', desc: 'Growing reserves' },
      { label: 'Gold Hoard', visual: '\u{1F4B0}\u2728', desc: 'Wealth building' },
      { label: 'Treasure Room', visual: '\u{1F451}', desc: 'Financial freedom nearing' },
      { label: 'Crown Jewels', visual: '\u{1F48E}', desc: 'Legacy secured' },
    ],
  },
  relationships: {
    icon: '\u{1F33F}',
    metaphor: 'Garden',
    tiers: [
      { label: 'Seeds', visual: '\u{1F331}', desc: 'Planting connections' },
      { label: 'Sprouts', visual: '\u{1F33F}', desc: 'Growth emerging' },
      { label: 'Bloom', visual: '\u{1F33A}', desc: 'Relationships flourishing' },
      { label: 'Grove', visual: '\u{1F333}', desc: 'Deep roots formed' },
      { label: 'Enchanted Forest', visual: '\u{1F333}\u2728', desc: 'Bonds unbreakable' },
    ],
  },
  growth: {
    icon: '\u{1F4DA}',
    metaphor: 'Library',
    tiers: [
      { label: 'Empty Shelf', visual: '\u{1F4D6}', desc: 'First lessons' },
      { label: 'Bookcase', visual: '\u{1F4DA}', desc: 'Knowledge growing' },
      { label: 'Study', visual: '\u{1F4DA}\u2728', desc: 'Patterns emerging' },
      { label: 'Archive', visual: '\u{1F3DB}\uFE0F', desc: 'Deep expertise' },
      { label: 'Grand Library', visual: '\u{1F3DB}\uFE0F\u2728', desc: 'Wisdom achieved' },
    ],
  },
  fun: {
    icon: '\u{1F9ED}',
    metaphor: 'Map',
    tiers: [
      { label: 'First Step', visual: '\u{1F5FA}\uFE0F', desc: 'Journey begins' },
      { label: 'Trail Blazer', visual: '\u{1F9ED}', desc: 'New paths found' },
      { label: 'Explorer', visual: '\u{26F5}', desc: 'Horizons expanding' },
      { label: 'Adventurer', visual: '\u{1F30D}', desc: 'World opening' },
      { label: 'Legend', visual: '\u{1F30D}\u2728', desc: 'All lands discovered' },
    ],
  },
  environment: {
    icon: '\u{1F3E1}',
    metaphor: 'Hearth',
    tiers: [
      { label: 'Campfire', visual: '\u{1F525}', desc: 'Humble start' },
      { label: 'Cabin', visual: '\u{1F3E0}', desc: 'Shelter built' },
      { label: 'Homestead', visual: '\u{1F3E1}', desc: 'Comfort achieved' },
      { label: 'Manor', visual: '\u{1F3E0}\u2728', desc: 'Space optimized' },
      { label: 'Castle', visual: '\u{1F3F0}', desc: 'Sanctuary complete' },
    ],
  },
  purpose: {
    icon: '\u{1F4A1}',
    metaphor: 'Beacon',
    tiers: [
      { label: 'Candle', visual: '\u{1F56F}\uFE0F', desc: 'Inner spark' },
      { label: 'Lantern', visual: '\u{1F3EE}', desc: 'Lighting the way' },
      { label: 'Torch', visual: '\u{1F525}', desc: 'Others notice' },
      { label: 'Lighthouse', visual: '\u{1F3EE}\u2728', desc: 'Guiding others' },
      { label: 'Sun', visual: '\u2600\uFE0F', desc: 'Radiant impact' },
    ],
  },
};

const RANKS = ['Novice', 'Apprentice', 'Journeyman', 'Expert', 'Master'];

function getRankFromScore(score) {
  if (score <= 2) return 0;
  if (score <= 4) return 1;
  if (score <= 6) return 2;
  if (score <= 8) return 3;
  return 4;
}

export default function DomainJourney({ area, score, milestones = [], compact = false }) {
  const visual = DOMAIN_VISUALS[area.id] || DOMAIN_VISUALS.health;
  const rankIdx = getRankFromScore(score);
  const rank = RANKS[rankIdx];
  const tier = visual.tiers[rankIdx];
  const completedMilestones = milestones.filter((m) => m.done).length;
  const totalMilestones = milestones.length;
  const progress = totalMilestones > 0 ? completedMilestones / totalMilestones : 0;

  if (compact) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: spacing.md,
        padding: `${spacing.md}px`, borderRadius: radius.md,
        background: colors.bgCard,
        border: `1px solid ${colors.border}`,
        borderLeft: `3px solid ${area.color}`,
        minHeight: 44, cursor: 'pointer',
      }}>
        <span style={{ fontSize: 28 }}>{tier.visual}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: colors.text }}>
            {area.label}
          </div>
          <div style={{ fontSize: 12, color: area.color, fontWeight: 500 }}>
            {rank} {'\u00B7'} {tier.label}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: area.color }}>{score}/10</div>
          {totalMilestones > 0 && (
            <div style={{ fontSize: 11, color: colors.textFaint }}>
              {completedMilestones}/{totalMilestones}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', padding: `${spacing.lg}px 0` }}>
      {/* Journey visual */}
      <div style={{ fontSize: 56, marginBottom: spacing.md }}>
        {tier.visual}
      </div>

      <div style={{ fontSize: 18, fontWeight: 700, color: colors.text, marginBottom: 4 }}>
        {rank}
      </div>
      <div style={{ fontSize: 13, color: area.color, fontWeight: 500, marginBottom: spacing.sm }}>
        {tier.label} {'\u2014'} {tier.desc}
      </div>

      {/* Progress bar through tiers */}
      <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: spacing.md }}>
        {visual.tiers.map((t, i) => (
          <div
            key={i}
            style={{
              width: 32, height: 6, borderRadius: 3,
              background: i <= rankIdx ? area.color : 'rgba(255,255,255,0.06)',
              transition: 'background 0.3s',
            }}
          />
        ))}
      </div>

      {/* Milestones progress */}
      {totalMilestones > 0 && (
        <div style={{ fontSize: 13, color: colors.textDim }}>
          {completedMilestones}/{totalMilestones} milestones completed
        </div>
      )}
    </div>
  );
}

export { DOMAIN_VISUALS, RANKS, getRankFromScore };
