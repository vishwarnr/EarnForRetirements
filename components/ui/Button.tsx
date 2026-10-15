// ─────────────────────────────────────────────────────────────
// components/ui/Button.tsx
// Universal button component with dynamic theme support
// ─────────────────────────────────────────────────────────────

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Theme } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = true,
  style,
}: ButtonProps) {
  const colors = useAppTheme();
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';

  const handlePress = async () => {
    if (disabled || loading) return;
    
    if (Platform.OS !== 'web') {
      if (isPrimary) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
    
    onPress();
  };

  // ── Dynamic Styles ─────────────────────────────────────────
  const getContainerStyle = (): ViewStyle => {
    const base: ViewStyle = {
      ...styles.baseContainer,
      width: fullWidth ? '100%' : 'auto',
      opacity: disabled ? 0.5 : 1,
    };

    if (isPrimary) {
      return {
        ...base,
        backgroundColor: colors.primary,
        borderWidth: 0,
      };
    }
    if (isSecondary) {
      return {
        ...base,
        backgroundColor: colors.surfaceMuted,
        borderWidth: 0,
      };
    }
    if (isOutline) {
      return {
        ...base,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.border,
      };
    }
    return {
      ...base,
      backgroundColor: 'transparent',
      borderWidth: 0,
    }; // ghost
  };

  const getTextStyle = (): TextStyle => {
    const base: TextStyle = { ...styles.baseText };

    if (size === 'sm') base.fontSize = Theme.typography.fontSizeSm;
    if (size === 'md') base.fontSize = Theme.typography.fontSizeMd;
    if (size === 'lg') {
      base.fontSize = Theme.typography.fontSizeLg;
      base.fontWeight = Theme.typography.fontWeightBold;
    }

    if (isPrimary) {
      return { ...base, color: colors.textOnPrimary };
    }
    if (isSecondary || isGhost) {
      return { ...base, color: colors.textPrimary };
    }
    return { ...base, color: colors.textPrimary }; // outline
  };

  const getSizeStyle = (): ViewStyle => {
    if (size === 'sm') return { paddingVertical: 8, paddingHorizontal: 16 };
    if (size === 'md') return { paddingVertical: 14, paddingHorizontal: 24 };
    return { paddingVertical: 18, paddingHorizontal: 32 }; // lg
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      disabled={disabled || loading}
      style={[getContainerStyle(), getSizeStyle(), style]}
    >
      {loading ? (
        <ActivityIndicator
          color={isPrimary ? colors.textOnPrimary : colors.textPrimary}
        />
      ) : (
        <>
          {leftIcon}
          <Text style={getTextStyle()}>{label}</Text>
          {rightIcon}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  baseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Theme.radius.full,
    gap: Theme.spacing.sm,
  },
  baseText: {
    fontWeight: Theme.typography.fontWeightSemiBold,
    letterSpacing: -0.2,
  },
});
