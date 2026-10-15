// -------------------------------------------------------------
// app/result.tsx
// Document Status Screen
// -------------------------------------------------------------

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Theme } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Button } from '@/components/ui/Button';
import { getDocumentStatus } from '@/services/dataCaptureService';
import { DocumentStatus } from '@/types/models';

export default function ResultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useAppTheme();
  const { documentId, companyId, filename } = useLocalSearchParams<{
    documentId: string;
    companyId: string;
    filename: string;
  }>();

  const [statusInfo, setStatusInfo] = useState<DocumentStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const info = await getDocumentStatus(documentId, companyId);
        setStatusInfo(info);
      } catch (e) {
        setStatusInfo({ status: 'Unknown (Check later)' });
      } finally {
        setLoading(false);
      }
    }
    if (documentId && companyId) {
      fetchStatus();
    } else {
      setLoading(false);
    }
  }, [documentId, companyId]);

  if (!documentId) {
    router.back();
    return null;
  }

  const hasErrors = statusInfo?.validation_errors && statusInfo.validation_errors.length > 0;
  const isAccepted = statusInfo?.status === 'accepted' || statusInfo?.document_no;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Theme.spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.thumbnailWrapper, { backgroundColor: colors.surfaceMuted }]}>
          <Ionicons name="document-text" size={64} color={colors.primary} />
          <Text style={{ marginTop: 12, color: colors.textPrimary, fontWeight: 'bold' }}>{filename}</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <>
            {/* Status Badge */}
            <View style={[styles.recycleBadge, {
              backgroundColor: hasErrors ? colors.errorLight : colors.primaryMuted
            }]}>
              <Ionicons
                name={hasErrors ? 'close-circle' : (isAccepted ? 'checkmark-circle' : 'time')}
                size={18}
                color={hasErrors ? colors.error : colors.primary}
              />
              <Text style={[styles.recycleBadgeText, {
                color: hasErrors ? colors.error : colors.primary
              }]}>
                {hasErrors ? 'Validation Failed' : (statusInfo?.status || 'Processing')}
              </Text>
            </View>

            <View style={styles.detailsSection}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Document No.</Text>
                <Text style={[styles.detailValue, { color: colors.textPrimary }]}>{statusInfo?.document_no || 'Pending'}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Document ID</Text>
                <Text style={[styles.detailValue, { color: colors.textMuted, fontSize: 12 }]} selectable>{documentId}</Text>
              </View>
            </View>

            {hasErrors && (
              <View style={[styles.infoBlock, { backgroundColor: colors.errorLight }]}>
                <Text style={[styles.infoTitle, { color: colors.error }]}>Validation Errors</Text>
                {statusInfo.validation_errors?.map((err, i) => (
                  <View key={i} style={styles.tipRow}>
                    <View style={[styles.tipDot, { backgroundColor: colors.error }]} />
                    <Text style={[styles.tipText, { color: colors.error }]}>{err}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Sticky Bottom Action */}
      <View style={[styles.stickyFooter, { 
        backgroundColor: colors.background, 
        borderTopColor: colors.borderLight,
        paddingBottom: insets.bottom || Theme.spacing.md 
      }]}>
        <Button
          label="Upload Another"
          size="lg"
          onPress={() => router.replace('/')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Theme.spacing.lg, paddingBottom: 120 },
  thumbnailWrapper: { height: 180, borderRadius: Theme.radius.lg, overflow: 'hidden', marginBottom: Theme.spacing.xl, alignItems: 'center', justifyContent: 'center' },
  recycleBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: Theme.radius.full, marginBottom: Theme.spacing.xl },
  recycleBadgeText: { fontSize: Theme.typography.fontSizeSm, fontWeight: Theme.typography.fontWeightBold },
  detailsSection: { gap: 12, marginBottom: Theme.spacing.xl },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { fontSize: Theme.typography.fontSizeMd },
  detailValue: { fontSize: Theme.typography.fontSizeMd, fontWeight: Theme.typography.fontWeightSemiBold },
  infoBlock: { padding: Theme.spacing.lg, borderRadius: Theme.radius.lg, marginBottom: Theme.spacing.md },
  infoTitle: { fontSize: Theme.typography.fontSizeSm, fontWeight: Theme.typography.fontWeightBold, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 8, gap: 8 },
  tipDot: { width: 6, height: 6, borderRadius: 3, marginTop: 8 },
  tipText: { flex: 1, fontSize: Theme.typography.fontSizeSm, lineHeight: 22 },
  stickyFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: Theme.spacing.lg, paddingTop: Theme.spacing.md, borderTopWidth: 1 },
});
