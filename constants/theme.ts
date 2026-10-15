// ─────────────────────────────────────────────────────────────
// constants/theme.ts
// Design system tokens for EarnForRetirement
// Dual Mode: Minimalist Light & Deep Slate Dark
// ─────────────────────────────────────────────────────────────

// Shared constants across both themes
const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  hero: 64,
};

const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999, // Pill shape
};

const typography = {
  fontSizeXs: 12,
  fontSizeSm: 14,
  fontSizeMd: 16,
  fontSizeLg: 18,
  fontSizeXl: 22,
  fontSize2xl: 28,
  fontSize3xl: 40,
  fontSize4xl: 56, 

  fontWeightRegular: '400' as const,
  fontWeightMedium: '500' as const,
  fontWeightSemiBold: '600' as const,
  fontWeightBold: '700' as const,
  fontWeightExtraBold: '800' as const,

  lineHeightTight: 1.1,
  lineHeightNormal: 1.5,
  lineHeightRelaxed: 1.7,

  letterSpacingTight: -1,
  letterSpacingNormal: 0,
  letterSpacingWide: 1,
};

// ── Color Palettes ──────────────────────────────────────────

const lightColors = {
  primary: '#059669',
  primaryLight: '#34D399',
  primaryDark: '#047857',
  primaryMuted: '#ECFDF5',

  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceMuted: '#F9FAFB',

  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textOnPrimary: '#FFFFFF',

  border: '#E2E8F0',
  borderLight: '#F1F5F9',

  success: '#059669',
  warning: '#D97706',
  error: '#DC2626',
  errorLight: '#FEF2F2',

  overlay: 'rgba(15, 23, 42, 0.4)',
  shimmer: '#F1F5F9',
};

const darkColors = {
  primary: '#10B981', // Slightly brighter green for dark mode contrast
  primaryLight: '#34D399',
  primaryDark: '#059669',
  primaryMuted: '#064E3B', // Deep green tinted background

  background: '#020617', // Very deep slate, near black
  surface: '#0F172A', // Slate 900
  surfaceElevated: '#1E293B', // Slate 800
  surfaceMuted: '#1E293B', // Slate 800

  textPrimary: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#64748B',
  textOnPrimary: '#020617', // Dark text on primary green button

  border: '#334155', // Slate 700
  borderLight: '#1E293B',

  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  errorLight: '#7F1D1D',

  overlay: 'rgba(2, 6, 23, 0.7)',
  shimmer: '#1E293B',
};

export const Theme = {
  light: lightColors,
  dark: darkColors,
  spacing,
  radius,
  typography,
  shadow: {
    float: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
      elevation: 8,
    },
    subtle: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 2,
    },
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    }
  },
} as const;

export type ThemeColors = typeof lightColors;

// Backward compat
export const Colors = {
  light: {
    text: lightColors.textPrimary,
    background: lightColors.background,
    tint: lightColors.primary,
    icon: lightColors.textSecondary,
    tabIconDefault: lightColors.textMuted,
    tabIconSelected: lightColors.primary,
  },
  dark: {
    text: darkColors.textPrimary,
    background: darkColors.background,
    tint: darkColors.primary,
    icon: darkColors.textSecondary,
    tabIconDefault: darkColors.textMuted,
    tabIconSelected: darkColors.primary,
  },
};
