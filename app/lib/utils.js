// Shared utilities

export function todayKey() {
  return new Date().toISOString().split('T')[0];
}

export function loadLocal(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

export function saveLocal(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
}

export function fmtTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function fmtDuration(start, end) {
  if (!start || !end) return '';
  const ms = new Date(end) - new Date(start);
  const m = Math.round(ms / 60000);
  return m >= 60 ? `${Math.floor(m / 60)}h${m % 60 > 0 ? ` ${m % 60}m` : ''}` : `${m}m`;
}

export function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function getDateString() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

// Filter out Todoist system/onboarding tasks
const SYSTEM_TASK_PREFIXES = [
  '\u{1F4AC} ',
  '\u{1F4C5} ',
  '\u{1F6A9} ',
  '\u{1F4AD} ',
  'Helpful hint:',
];

export function filterSystemTasks(tasks) {
  return tasks.filter(
    (t) => t.content && !SYSTEM_TASK_PREFIXES.some((prefix) => t.content.startsWith(prefix))
  );
}

// Check if a Todoist task is overdue
export function isTaskOverdue(task) {
  return task.due?.date && task.due.date < todayKey();
}

// Debounce helper
export function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
