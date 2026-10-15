// -------------------------------------------------------------
// app/preview.tsx
// Upload Configuration Screen
// -------------------------------------------------------------

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Theme } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Button } from '@/components/ui/Button';
import { getTemplatesByCompany } from '@/services/dataCaptureService';
import { CustomerTemplate, DocumentCategory } from '@/types/models';
import { getCompanyId } from '@/utils/storage';

// Categories as defined by the backend (source: /document-categories API + Postman collection)
const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  'PurchaseOrder',
  'Invoice',
  'SalesOrder',
  'BankReconciliation',
];

export default function PreviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useAppTheme();
  const { fileUri, fileName, imageWidth, imageHeight } = useLocalSearchParams<{
    fileUri: string;
    fileName: string;
    imageWidth?: string;
    imageHeight?: string;
  }>();

  const [companyId, setCompanyId] = useState<number | null>(null);
  const [templates, setTemplates] = useState<CustomerTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedTemplate, setSelectedTemplate] = useState<CustomerTemplate | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | null>(null);

  if (!fileUri) {
    router.back();
    return null;
  }

  useEffect(() => {
    async function init() {
      try {
        let cid = await getCompanyId();
        if (!cid) {
          throw new Error("No company ID found for the logged-in user. Please log in again.");
        }
        setCompanyId(cid);
        const fetched = await getTemplatesByCompany(cid);
        setTemplates(fetched);
        if (fetched.length > 0) {
          setSelectedTemplate(fetched[0]);
        }
      } catch (err: any) {
        Alert.alert('Error', err.message);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleUpload = async () => {
    if (!selectedTemplate || !selectedCategory) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    router.replace({ 
      pathname: '/analyzing', 
      params: { 
        fileUri, 
        fileName,
        imageWidth: imageWidth ?? '',
        imageHeight: imageHeight ?? '',
        customerId: selectedTemplate.customerId,
        companyId: selectedTemplate.companyId,
        category: selectedCategory,
        templateLabel: selectedTemplate.label
      } 
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* File Info */}
        <View style={[styles.card, { backgroundColor: colors.surfaceMuted }]}>
          <Ionicons name="document-text" size={32} color={colors.primary} style={{ marginBottom: 12 }} />
          <Text style={[styles.fileLabel, { color: colors.textSecondary }]}>Selected File</Text>
          <Text style={[styles.fileName, { color: colors.textPrimary }]} numberOfLines={2}>
            {fileName}
          </Text>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
            <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Change file</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Category Selection */}
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Select Category</Text>
            <View style={styles.pillContainer}>
              {DOCUMENT_CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.pill,
                    { 
                      backgroundColor: selectedCategory === cat ? colors.primary : colors.surfaceMuted,
                      borderColor: selectedCategory === cat ? colors.primary : colors.border
                    }
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text style={[
                    styles.pillText,
                    { color: selectedCategory === cat ? colors.textOnPrimary : colors.textPrimary }
                  ]}>
                    {cat.replace(/([A-Z])/g, ' $1').trim()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Template Selection */}
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, marginTop: 24 }]}>Select Customer Template</Text>
            {templates.length === 0 ? (
              <Text style={{ color: colors.textSecondary }}>No templates found for this company.</Text>
            ) : (
              templates.map(tmpl => (
                <TouchableOpacity
                  key={tmpl.customerId}
                  style={[
                    styles.templateRow,
                    { 
                      backgroundColor: selectedTemplate?.customerId === tmpl.customerId ? colors.primaryMuted : colors.surfaceMuted,
                      borderColor: selectedTemplate?.customerId === tmpl.customerId ? colors.primary : 'transparent'
                    }
                  ]}
                  onPress={() => setSelectedTemplate(tmpl)}
                >
                  <Text style={{ color: selectedTemplate?.customerId === tmpl.customerId ? colors.primary : colors.textPrimary, fontWeight: '600' }}>
                    {tmpl.label}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.actions, { paddingBottom: insets.bottom + Theme.spacing.md, backgroundColor: colors.background }]}>
        <Button
          label="Start Upload"
          variant="primary"
          size="lg"
          leftIcon={<Ionicons name="cloud-upload" size={20} color={colors.textOnPrimary} />}
          onPress={handleUpload}
          disabled={!selectedTemplate || !selectedCategory || loading}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: Theme.spacing.lg, paddingBottom: 100 },
  card: { padding: Theme.spacing.lg, borderRadius: Theme.radius.lg, alignItems: 'center', marginBottom: Theme.spacing.xl },
  fileLabel: { fontSize: Theme.typography.fontSizeSm, fontWeight: '600', textTransform: 'uppercase' },
  fileName: { fontSize: Theme.typography.fontSizeMd, fontWeight: 'bold', textAlign: 'center', marginTop: 4 },
  sectionTitle: { fontSize: Theme.typography.fontSizeLg, fontWeight: 'bold', marginBottom: Theme.spacing.md },
  pillContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1 },
  pillText: { fontSize: Theme.typography.fontSizeSm, fontWeight: '600' },
  templateRow: { padding: 16, borderRadius: Theme.radius.md, borderWidth: 1, marginBottom: 8 },
  actions: { paddingHorizontal: Theme.spacing.lg, paddingTop: Theme.spacing.sm, borderTopWidth: 1, borderTopColor: '#E2E8F0', position: 'absolute', bottom: 0, left: 0, right: 0 },
});
