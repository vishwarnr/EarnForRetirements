// -------------------------------------------------------------
// app/index.tsx
// Home - Upload Document
// -------------------------------------------------------------

import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { Theme } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { RecentUploadCard } from '@/components/domain/RecentUploadCard';
import { getUploadHistory } from '@/utils/storage';
import { UploadHistoryItem } from '@/types/models';
import { getAccessToken } from '@/services/authService';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useAppTheme();
  const [uploadHistory, setUploadHistory] = useState<UploadHistoryItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      const checkAuth = async () => {
        const token = await getAccessToken();
        if (!token) {
          router.replace('/login');
          return;
        }
        getUploadHistory().then(setUploadHistory);
      };
      checkAuth();
    }, [])
  );

  const handleTakePhoto = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera permissions to take a photo.');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        const fileName = asset.fileName ?? `photo_${Date.now()}.jpg`;
        router.push({ 
          pathname: '/preview', 
          params: {
            fileUri: asset.uri,
            fileName,
            imageWidth: asset.width?.toString() ?? '',
            imageHeight: asset.height?.toString() ?? '',
          }
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to launch camera.');
    }
  };

  const handlePickDocument = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'image/jpeg',
          'image/png'
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        const file = result.assets[0];
        router.push({ 
          pathname: '/preview', 
          params: { fileUri: file.uri, fileName: file.name } 
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document.');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + Theme.spacing.xl, paddingBottom: insets.bottom + Theme.spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: colors.textPrimary }]}>EarnForRetirement</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Upload documents to the pipeline.</Text>
        </View>

        <View style={styles.actionSection}>
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.primary }]} 
              activeOpacity={0.8}
              onPress={handleTakePhoto}
            >
              <Ionicons name="camera" size={36} color={colors.textOnPrimary} />
              <Text style={[styles.actionButtonText, { color: colors.textOnPrimary }]}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.primary }]} 
              activeOpacity={0.8}
              onPress={handlePickDocument}
            >
              <Ionicons name="document-text" size={36} color={colors.textOnPrimary} />
              <Text style={[styles.actionButtonText, { color: colors.textOnPrimary }]}>Upload File</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.supportedText, { color: colors.textMuted }]}>
            Supports PDF, Excel, and Images
          </Text>
        </View>

        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Text style={[styles.historyTitle, { color: colors.textPrimary }]}>Recent Uploads</Text>
            {uploadHistory.length > 0 && (
              <Text style={[styles.historyCount, { color: colors.textMuted, backgroundColor: colors.surfaceMuted }]}>
                {uploadHistory.length}
              </Text>
            )}
          </View>
          
          {uploadHistory.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={32} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>Your recent uploads will appear here.</Text>
            </View>
          ) : (
            <View style={[styles.historyList, { borderTopColor: colors.borderLight }]}>
              {uploadHistory.slice(0, 10).map(item => (
                <RecentUploadCard key={item.id} item={item} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: Theme.spacing.lg },
  header: { marginTop: Theme.spacing.md, marginBottom: Theme.spacing.hero },
  greeting: { fontSize: Theme.typography.fontSize3xl, fontWeight: Theme.typography.fontWeightExtraBold, letterSpacing: Theme.typography.letterSpacingTight, marginBottom: 4 },
  subtitle: { fontSize: Theme.typography.fontSizeMd, letterSpacing: -0.2 },
  actionSection: { alignItems: 'center', marginBottom: Theme.spacing.hero },
  buttonRow: { flexDirection: 'row', gap: 16, width: '100%', justifyContent: 'space-between' },
  actionButton: { flex: 1, height: 160, borderRadius: Theme.radius.xl, alignItems: 'center', justifyContent: 'center', gap: 12, ...Theme.shadow.float },
  actionButtonText: { fontSize: Theme.typography.fontSizeMd, fontWeight: Theme.typography.fontWeightBold, letterSpacing: -0.5 },
  supportedText: { marginTop: Theme.spacing.md, fontSize: Theme.typography.fontSizeSm },
  historySection: { flex: 1 },
  historyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Theme.spacing.md },
  historyTitle: { fontSize: Theme.typography.fontSizeLg, fontWeight: Theme.typography.fontWeightBold, letterSpacing: -0.5 },
  historyCount: { fontSize: Theme.typography.fontSizeSm, fontWeight: Theme.typography.fontWeightBold, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, overflow: 'hidden' },
  historyList: { borderTopWidth: 1 },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 12 },
  emptyText: { fontSize: Theme.typography.fontSizeSm },
});
