// Design tokens — single source of truth for all styling
export const colors = {
  // Core
  bg: '#121110',
  bgCard: 'rgba(255,255,255,0.04)',
  bgCardHover: 'rgba(255,255,255,0.06)',
  bgElevated: '#1A1917',
  text: '#F0EDE6',
  textMuted: 'rgba(240,237,230,0.6)',
  textDim: 'rgba(240,237,230,0.4)',
  textFaint: 'rgba(240,237,230,0.3)',
  textGhost: 'rgba(240,237,230,0.15)',
  border: 'rgba(240,237,230,0.08)',
  borderLight: 'rgba(240,237,230,0.06)',
  borderActive: 'rgba(240,237,230,0.1)',

  // Brand
  primary: '#6C9BFF',
  primaryBg: 'rgba(108,155,255,0.1)',
  primaryBorder: 'rgba(108,155,255,0.3)',
  secondary: '#8B6CFF',
  secondaryBg: 'rgba(139,108,255,0.06)',
  secondaryBorder: 'rgba(139,108,255,0.15)',
  gradient: 'linear-gradient(135deg, #6C9BFF, #8B6CFF)',

  // Semantic
  success: '#6CFFB8',
  successBg: 'rgba(108,255,184,0.08)',
  successBorder: 'rgba(108,255,184,0.3)',
  danger: '#FF6B6B',
  dangerBg: 'rgba(255,107,107,0.08)',
  dangerBorder: 'rgba(255,107,107,0.2)',
  warning: '#FFD76C',
  warningBg: 'rgba(255,215,108,0.08)',
  orange: '#FFB86C',
  accent1: '#FF8F6C',
  accent2: '#FF6B9D',
  accent3: '#6CFFF0',

  // Priority
  p1: '#FF6B6B',
  p2: '#FFB86C',
  p3: '#6C9BFF',
  p4: 'rgba(240,237,230,0.3)',

  // Event colors
  events: ['#6C9BFF', '#FF8F6C', '#8B6CFF', '#6CFFB8', '#FFD76C', '#FF6B9D', '#6CFFF0'],

  // Momentum levels
  momentum: {
    high: '#6CFFB8',
    medium: '#FFD76C',
    low: '#FF8F6C',
    critical: '#FF6B6B',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 24,
  full: 100,
  circle: '50%',
};

export const fonts = {
  body: "'DM Sans', -apple-system, sans-serif",
  heading: "'Playfair Display', Georgia, serif",
};

export const typography = {
  h1: { fontFamily: fonts.heading, fontSize: 26, fontWeight: 700, letterSpacing: -0.5 },
  h2: { fontFamily: fonts.heading, fontSize: 20, fontWeight: 700 },
  h3: { fontSize: 18, fontWeight: 600 },
  body: { fontSize: 15, lineHeight: 1.4 },
  small: { fontSize: 13 },
  caption: { fontSize: 12 },
  label: { fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.textFaint },
  sub: { fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: colors.textMuted },
};
