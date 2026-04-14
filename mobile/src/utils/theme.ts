import { Platform } from 'react-native';

const displayFont = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});

const monoFont = Platform.select({
  ios: 'Courier',
  android: 'monospace',
  default: 'monospace',
});

export const shadowSm = {
  shadowColor: '#10222A',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 4,
  elevation: 2,
};

export const shadowMd = {
  shadowColor: '#10222A',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.12,
  shadowRadius: 16,
  elevation: 6,
};

export const shadowLg = {
  shadowColor: '#10222A',
  shadowOffset: { width: 0, height: 16 },
  shadowOpacity: 0.18,
  shadowRadius: 28,
  elevation: 10,
};

export const colors = {
  primary: '#163B50',
  primaryLight: '#4F7082',
  primaryDark: '#0D2330',

  accent: '#C9862D',
  accentLight: '#F1D2A6',

  success: '#2E7C5A',
  successLight: '#DCEDE4',
  warning: '#B67B20',
  warningLight: '#F7E3BE',
  error: '#B54A40',
  errorLight: '#F6DAD6',

  background: '#F3EEE4',
  surface: '#FFFDF8',
  surfaceSecondary: '#EAE0D0',
  surfaceElevated: '#FFF8EE',
  border: '#D6C6AF',
  borderLight: '#E7DCCD',

  textPrimary: '#1E2A31',
  textSecondary: '#5E6A71',
  textTertiary: '#8A948E',
  textInverse: '#FFF8EF',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 30,
  full: 9999,
};

export const typography = {
  h1: {
    fontFamily: displayFont,
    fontSize: 36,
    fontWeight: '700' as const,
    lineHeight: 42,
    letterSpacing: -0.8,
  },
  h2: {
    fontFamily: displayFont,
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
    letterSpacing: -0.4,
  },
  h3: {
    fontFamily: displayFont,
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: 16,
    letterSpacing: 0.4,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
    letterSpacing: 0.2,
  },
  metric: {
    fontFamily: monoFont,
    fontSize: 18,
    fontWeight: '700' as const,
    lineHeight: 22,
  },
};

export const theme = {
  colors,
  spacing,
  borderRadius,
  typography,
  shadowSm,
  shadowMd,
  shadowLg,
};

export default theme;
