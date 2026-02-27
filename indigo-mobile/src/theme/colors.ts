/**
 * Indigo Yield Design System Colors
 * Matches web application design tokens
 */

export const colors = {
  // Primary brand color - Deep Indigo
  primary: {
    DEFAULT: '#3F51B5',
    50: '#E8EAF6',
    100: '#C5CAE9',
    200: '#9FA8DA',
    300: '#7986CB',
    400: '#5C6BC0',
    500: '#3F51B5',
    600: '#3949AB',
    700: '#303F9F',
    800: '#283593',
    900: '#1A237E',
  },

  // Success - Neon Mint
  success: {
    DEFAULT: '#00C853',
    light: '#E8F5E9',
    dark: '#00A843',
  },

  // Warning - Amber
  warning: {
    DEFAULT: '#F59E0B',
    light: '#FEF3C7',
    dark: '#D97706',
  },

  // Error - Red
  error: {
    DEFAULT: '#EF4444',
    light: '#FEE2E2',
    dark: '#DC2626',
  },

  // Neutrals
  background: {
    DEFAULT: '#FFFFFF',
    secondary: '#F8FAFC',
    tertiary: '#F1F5F9',
  },

  foreground: {
    DEFAULT: '#0F172A',
    muted: '#64748B',
    light: '#94A3B8',
  },

  border: {
    DEFAULT: '#E2E8F0',
    dark: '#CBD5E1',
  },

  card: {
    DEFAULT: '#FFFFFF',
    elevated: '#FFFFFF',
  },
} as const;

// Dark mode variants
export const darkColors = {
  primary: colors.primary,
  success: colors.success,
  warning: colors.warning,
  error: colors.error,

  background: {
    DEFAULT: '#0F172A',
    secondary: '#1E293B',
    tertiary: '#334155',
  },

  foreground: {
    DEFAULT: '#F8FAFC',
    muted: '#94A3B8',
    light: '#64748B',
  },

  border: {
    DEFAULT: '#334155',
    dark: '#475569',
  },

  card: {
    DEFAULT: '#1E293B',
    elevated: '#334155',
  },
} as const;

export type ColorScheme = typeof colors;
