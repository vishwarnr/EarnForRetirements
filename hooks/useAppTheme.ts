// ─────────────────────────────────────────────────────────────
// hooks/useAppTheme.ts
// Hook to access the current theme colors based on system mode
// ─────────────────────────────────────────────────────────────

import { useColorScheme } from 'react-native';
import { Theme, ThemeColors } from '@/constants/theme';

export function useAppTheme(): ThemeColors {
  const colorScheme = useColorScheme();
  
  // Default to light mode if the system scheme is not determined
  const isDark = colorScheme === 'dark';
  
  return isDark ? Theme.dark : Theme.light;
}
