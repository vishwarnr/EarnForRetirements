// -------------------------------------------------------------
// app/analyzing.tsx
// Upload Progress Screen
// -------------------------------------------------------------

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Theme } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { uploadDocument, checkHealth } from '@/services/dataCaptureService';
import { saveUploadToHistory } from '@/utils/storage';

const LOADING_MESSAGES = [
  'Checking server connection...',
  'Uploading document securely...',
  'Processing file content...',
  'Extracting data...',
  'Validating results...'
];

export default function AnalyzingScreen() {
  const router = useRouter();
  const colors = useAppTheme();
  const { fileUri, fileName, customerId, companyId, category, templateLabel, imageWidth, imageHeight } = useLocalSearchParams<{
    fileUri: string;
    fileName: string;
    customerId: string;
    companyId: string;
    category: string;
    templateLabel: string;
    imageWidth?: string;
    imageHeight?: string;
  }>();

  const [messageIndex, setMessageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const spinValue = useRef(new Animated.Value(0)).current;
  const fadeValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, { toValue: 1, duration: 3000, easing: Easing.linear, useNativeDriver: true })
    ).start();

    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(fadeValue, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(fadeValue, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start();

      setMessageIndex((prev) => {
        if (prev < LOADING_MESSAGES.length - 1) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          return prev + 1;
        }
        return prev;
      });
    }, 4000); // Slower interval since PDF can take 30s

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Parse dimensions passed from camera picker (undefined for gallery files)
    const parsedWidth = imageWidth ? parseInt(imageWidth, 10) : undefined;
    const parsedHeight = imageHeight ? parseInt(imageHeight, 10) : undefined;

    async function runUpload() {
      try {
        const isHealthy = await checkHealth();
        if (!isHealthy) {
          throw new Error('Data Capture API is currently unreachable. Please try again later.');
        }

        const result = await uploadDocument(fileUri, fileName, customerId, companyId, category, 'frontend-user', parsedWidth, parsedHeight);

        if (isMounted) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          
          await saveUploadToHistory({
            id: Date.now().toString(),
            documentId: result.documentId,
            filename: fileName,
            date: new Date().toISOString(),
            category,
            templateLabel,
            status: 'Processing' // Or we can fetch final status here if we want
          });

          router.replace({
            pathname: '/result',
            params: {
              documentId: result.documentId,
              companyId,
              filename: fileName
            },
          });
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message ?? 'Unknown error occurred.');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          
          await saveUploadToHistory({
            id: Date.now().toString(),
            documentId: 'N/A',
            filename: fileName,
            date: new Date().toISOString(),
            category,
            templateLabel,
            status: 'Failed'
          });
        }
      }
    }

    runUpload();

    return () => { isMounted = false; };
  }, []);

  const spin = spinValue.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  if (error) {
    return (
      <SafeAreaView style={[styles.errorContainer, { backgroundColor: colors.background }]} edges={['bottom']}>
        <View style={[styles.errorIcon, { backgroundColor: colors.errorLight }]}>
          <Ionicons name="warning-outline" size={36} color={colors.error} />
        </View>
        <Text style={[styles.errorTitle, { color: colors.textPrimary }]}>Upload Failed</Text>
        <Text style={[styles.errorMessage, { color: colors.textSecondary }]}>{error}</Text>
        <View style={{ height: Theme.spacing.xl }} />
        <Text style={[styles.retryLink, { color: colors.primary }]} onPress={() => router.back()}>
          ? Go Back and Try Again
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.centerContent}>
        <View style={styles.spinnerContainer}>
          <Animated.View
            style={[
              styles.ring,
              { borderColor: colors.primaryLight, borderTopColor: colors.primary },
              { transform: [{ rotate: spin }] },
            ]}
          />
          <View style={[styles.thumbnailWrapper, { backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' }]}>
            <Ionicons name="cloud-upload" size={40} color={colors.primary} />
          </View>
        </View>

        <View style={styles.textContainer}>
          <Animated.Text style={[styles.loadingText, { color: colors.textPrimary, opacity: fadeValue }]}>
            {LOADING_MESSAGES[messageIndex]}
          </Animated.Text>
        </View>
      </View>

      <Text style={[styles.footerText, { color: colors.textMuted }]}>
        PDF processing may take up to 30 seconds
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  centerContent: { alignItems: 'center', justifyContent: 'center' },
  spinnerContainer: { width: 140, height: 140, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 140, height: 140, borderRadius: 70, borderWidth: 4 },
  thumbnailWrapper: { width: 100, height: 100, borderRadius: 50, overflow: 'hidden' },
  textContainer: { marginTop: Theme.spacing.xl, height: 30, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: Theme.typography.fontSizeMd, fontWeight: Theme.typography.fontWeightMedium },
  footerText: { position: 'absolute', bottom: 48, fontSize: Theme.typography.fontSizeXs },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Theme.spacing.xl },
  errorIcon: { width: 72, height: 72, borderRadius: Theme.radius.xl, alignItems: 'center', justifyContent: 'center', marginBottom: Theme.spacing.lg },
  errorTitle: { fontSize: Theme.typography.fontSizeXl, fontWeight: Theme.typography.fontWeightBold, marginBottom: Theme.spacing.sm, textAlign: 'center' },
  errorMessage: { fontSize: Theme.typography.fontSizeMd, textAlign: 'center', lineHeight: 22 },
  retryLink: { fontSize: Theme.typography.fontSizeMd, fontWeight: Theme.typography.fontWeightSemiBold },
});
