// Research-backed habit packs from thought leaders
export const HABIT_PACKS = [
  {
    id: 'huberman',
    name: 'Neuroscience Optimal',
    subtitle: 'Huberman Protocol',
    icon: '🧠',
    description: 'Evidence-based morning routine for peak cognitive performance',
    habits: [
      { id: 'hub-1', label: 'Morning sunlight (10-30 min)', icon: '☀️' },
      { id: 'hub-2', label: 'Hydrate (water + electrolytes)', icon: '💧' },
      { id: 'hub-3', label: 'Move / exercise', icon: '🏃' },
      { id: 'hub-4', label: 'Cold exposure (shower/splash)', icon: '🧊' },
      { id: 'hub-5', label: 'Delay caffeine 90 min', icon: '⏰' },
    ],
  },
  {
    id: 'abdaal',
    name: 'Feel-Good Productivity',
    subtitle: 'Ali Abdaal Style',
    icon: '⚡',
    description: 'Energize your morning with intention and movement',
    habits: [
      { id: 'ali-1', label: 'Morning manifesto (2-min journal)', icon: '📝' },
      { id: 'ali-2', label: 'Set top 3 priorities', icon: '🎯' },
      { id: 'ali-3', label: 'Zone 2 cardio', icon: '🏃' },
      { id: 'ali-4', label: 'Read 10 pages', icon: '📖' },
      { id: 'ali-5', label: 'Gratitude moment', icon: '🧘' },
    ],
  },
  {
    id: 'ceo',
    name: 'CEO Focus',
    subtitle: 'Cook / Nadella / Bezos',
    icon: '🏰',
    description: 'Distilled from top tech leader morning routines',
    habits: [
      { id: 'ceo-1', label: 'Morning workout', icon: '🏋️' },
      { id: 'ceo-2', label: '90-second meditation', icon: '🧘' },
      { id: 'ceo-3', label: 'Gratitude check-in', icon: '🙏' },
      { id: 'ceo-4', label: "Review today's plan", icon: '📋' },
      { id: 'ceo-5', label: 'No reactive work first hour', icon: '📵' },
    ],
  },
  {
    id: 'mindful',
    name: 'Mindful Start',
    subtitle: 'Gentle / Wellness',
    icon: '🌿',
    description: 'A calmer, gentler morning for peaceful days',
    habits: [
      { id: 'mind-1', label: 'Drink water', icon: '💧' },
      { id: 'mind-2', label: 'Stretch / yoga', icon: '🧘' },
      { id: 'mind-3', label: 'Breathwork', icon: '🌬️' },
      { id: 'mind-4', label: 'Set intention', icon: '✨' },
      { id: 'mind-5', label: 'Read or learn', icon: '📖' },
    ],
  },
];

export const CUSTOM_PACK = {
  id: 'custom',
  name: 'Custom',
  subtitle: 'Build Your Own',
  icon: '⭐',
  description: 'Start blank or fork any pack. Full control.',
  habits: [],
};

export function getPackById(packId) {
  return HABIT_PACKS.find((p) => p.id === packId) || CUSTOM_PACK;
}
