import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { UploadHistoryItem } from '@/types/models';

interface Props {
  item: UploadHistoryItem;
}

export function RecentUploadCard({ item }: Props) {
  const colors = useAppTheme();
  
  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const isFailed = item.status === 'Failed' || item.status === 'Error';

  return (
    <View style={[styles.card, { borderBottomColor: colors.borderLight }]}>
      <View style={[styles.iconWrapper, { backgroundColor: isFailed ? colors.errorLight : colors.primaryMuted }]}>
        <Ionicons name="document-text" size={24} color={isFailed ? colors.error : colors.primary} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.filename, { color: colors.textPrimary }]} numberOfLines={1}>
          {item.filename}
        </Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          {item.category} • {formatDate(item.date)}
        </Text>
        <Text style={[styles.template, { color: colors.textMuted }]} numberOfLines={1}>
          Template: {item.templateLabel}
        </Text>
      </View>
      <View style={styles.status}>
        <Text style={[
          styles.statusText, 
          { color: isFailed ? colors.error : colors.success }
        ]}>
          {item.status || 'Success'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 1,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: Theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.md,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  filename: {
    fontSize: Theme.typography.fontSizeMd,
    fontWeight: Theme.typography.fontWeightSemiBold,
    marginBottom: 2,
  },
  meta: {
    fontSize: Theme.typography.fontSizeXs,
    marginBottom: 2,
  },
  template: {
    fontSize: Theme.typography.fontSizeXs,
  },
  status: {
    paddingLeft: Theme.spacing.md,
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: Theme.typography.fontSizeSm,
    fontWeight: Theme.typography.fontWeightBold,
  }
});
