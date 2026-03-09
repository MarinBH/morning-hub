export const HABITS = [
  { id: 'h1', label: 'Drink water', icon: '\u{1F4A7}' },
  { id: 'h2', label: 'Stretch / move', icon: '\u{1F9D8}' },
  { id: 'h3', label: 'No phone first 30m', icon: '\u{1F4F5}' },
  { id: 'h4', label: "Review today's plan", icon: '\u{1F4CB}' },
  { id: 'h5', label: 'Gratitude moment', icon: '\u{2728}' },
];

export const JOURNAL_PROMPTS = [
  "What's the one thing that would make today a win?",
  'What am I grateful for right now?',
  "What's weighing on me that I can release?",
  'What would my best self do today?',
  'What did I learn yesterday that I want to carry forward?',
  "Where am I holding back, and what would happen if I didn't?",
  "What's one thing I've been avoiding that deserves 10 minutes today?",
  'If I could only accomplish one thing today, what would it be?',
  'What would I do today if I had no fear?',
  'Who can I help or reach out to today?',
  "What's a small win I can get in the first hour?",
  'What habit am I proud of building recently?',
  'What energy am I bringing into today?',
  "What's one thing I'd like to learn today?",
  'How do I want to feel at the end of today?',
  "What's something I'm looking forward to?",
  'What boundary do I need to protect today?',
  "What's one thing I can let go of?",
  'Who inspires me right now, and why?',
  "What's a challenge I'm ready to face?",
  "What's working well in my life that I should do more of?",
  'If today were my last, what would matter most?',
  'What would make my future self proud?',
  'What do I need to say no to today?',
  "What's a recent mistake that taught me something?",
  'How can I bring more play into today?',
  'What relationship deserves more attention?',
  "What's one way I can simplify today?",
  "What's draining my energy, and can I change it?",
  'What intention do I want to set for this week?',
  'What am I curious about right now?',
];

export function getPrompt() {
  const d = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000
  );
  return JOURNAL_PROMPTS[d % JOURNAL_PROMPTS.length];
}

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Home', icon: '\u{26A1}' },
  { id: 'tasks', label: 'Tasks', icon: '\u{2705}' },
  { id: 'practice', label: 'Practice', icon: '\u{1F9D8}' },
  { id: 'goals', label: 'Goals', icon: '\u{1F3AF}' },
];

// Priority color mapping (Todoist priority 1-4) — references theme tokens
import { colors } from './theme';

export const PRIORITY_COLORS = {
  4: colors.p1,  // urgent
  3: colors.p2,  // high
  2: colors.p3,  // medium
  1: colors.p4,  // low
};

// Layout constants
export const BOTTOM_NAV_HEIGHT = 70; // px, including safe area padding

// localStorage keys
export const STORAGE_KEYS = {
  dailyState: (date) => `hub-${date}`,
  wheelOfLife: 'hub-wheel-of-life',
};

// API endpoints
export const API = {
  calendar: '/api/calendar',
  todoistTasks: '/api/todoist?endpoint=tasks&filter=today%7Coverdue',
  todoistAllTasks: '/api/todoist?endpoint=tasks&filter=all',
  todoistProjects: '/api/todoist?endpoint=projects',
  todoist: '/api/todoist',
};

// Wheel of Life — 8 core life areas (customizable)
// Based on Paul J. Meyer's framework, adapted for personal command center
export const WHEEL_OF_LIFE_AREAS = [
  { id: 'career', label: 'Career & Work', icon: '\u{1F4BC}', color: '#6C9BFF', description: 'Professional growth, purpose, and fulfillment' },
  { id: 'finance', label: 'Finances', icon: '\u{1F4B0}', color: '#6CFFB8', description: 'Financial health, security, and goals' },
  { id: 'health', label: 'Health & Fitness', icon: '\u{1F4AA}', color: '#FF8F6C', description: 'Physical health, nutrition, exercise, sleep' },
  { id: 'relationships', label: 'Relationships', icon: '\u{2764}\uFE0F', color: '#FF6B9D', description: 'Family, friends, and meaningful connections' },
  { id: 'growth', label: 'Personal Growth', icon: '\u{1F331}', color: '#8B6CFF', description: 'Learning, skills, self-improvement' },
  { id: 'fun', label: 'Fun & Recreation', icon: '\u{1F3AE}', color: '#FFD76C', description: 'Joy, hobbies, rest, and play' },
  { id: 'environment', label: 'Environment', icon: '\u{1F3E0}', color: '#6CFFF0', description: 'Living space, surroundings, community' },
  { id: 'purpose', label: 'Purpose & Meaning', icon: '\u{2728}', color: '#FFB86C', description: 'Spirituality, contribution, legacy' },
];
