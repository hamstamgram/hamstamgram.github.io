export * from './colors';
export * from './typography';

export const spacing = {
  0: 0,
  1: 4,
  1.5: 6,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export const borderRadius = {
  none: 0,
  sm: 4,
  DEFAULT: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  DEFAULT: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

// ─── Theme interface ──────────────────────────────────────────────────────────

export interface Theme {
  background: string;
  surface: string;
  elevated: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryLight: string;
  success: string;
  warning: string;
  destructive: string;
  border: string;
}

export const lightTheme: Theme = {
  background: '#FFFFFF',
  surface: '#F8FAFC',
  elevated: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  primary: '#3F51B5',
  primaryLight: '#E8EAF6',
  success: '#00C853',
  warning: '#F59E0B',
  destructive: '#EF4444',
  border: '#E2E8F0',
};

export const darkTheme: Theme = {
  background: '#0F172A',
  surface: '#1E293B',
  elevated: '#334155',
  text: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8',
  primary: '#3F51B5',
  primaryLight: '#1a1f3a',
  success: '#00C853',
  warning: '#F59E0B',
  destructive: '#EF4444',
  border: '#334155',
};
