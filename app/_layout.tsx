// ─────────────────────────────────────────────────────────────
// app/_layout.tsx
// Root navigation layout for EarnForRetirement – Recycle & Earn
// ─────────────────────────────────────────────────────────────

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';
import { Theme } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function RootLayout() {
  const colors = useAppTheme();
  const colorScheme = useColorScheme();
  
  return (
    <SafeAreaProvider>
      <StatusBar 
        style={colorScheme === 'dark' ? 'light' : 'dark'} 
        backgroundColor={colors.background} 
      />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.primary,
          headerTitleStyle: {
            fontWeight: Theme.typography.fontWeightSemiBold,
            fontSize: Theme.typography.fontSizeLg,
            color: colors.textPrimary,
          },
          headerShadowVisible: false,
          headerBackTitle: 'Back',
          contentStyle: {
            backgroundColor: colors.background,
          },
          animation: Platform.OS === 'ios' ? 'default' : 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="verify-2fa" options={{ title: 'Verify Email', headerBackVisible: false }} />
        <Stack.Screen name="preview" options={{ title: 'Upload Configuration' }} />
        <Stack.Screen name="analyzing" options={{ title: 'Uploading...', headerBackVisible: false, gestureEnabled: false }} />
        <Stack.Screen name="result" options={{ title: 'Document Status' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
