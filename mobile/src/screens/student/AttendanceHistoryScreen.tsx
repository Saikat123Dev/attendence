import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, borderRadius, typography, shadowMd } from '../../utils/theme';
import { Card, Badge } from '../../components';
import { api } from '../../api';

interface HistoryItem {
  id: number;
  date: string;
  status: 'present' | 'absent' | 'late';
  subjectName?: string;
}

export default function AttendanceHistoryScreen({ navigation }: { navigation: any }) {
  const [records, setRecords] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const stats = await api.getMyStats();
      const historyItems: HistoryItem[] = [];
      let recordId = 0;

      Object.entries(stats.subject_wise || {}).forEach(([subjectId, data]: [string, any]) => {
        const total = data.total || 0;
        const present = data.present || 0;
        if (total > 0) {
          historyItems.push({
            id: recordId++,
            date: `Subject ${subjectId}`,
            status: present > 0 ? 'present' : 'absent',
            subjectName: `Subject ${subjectId}`,
          });
        }
      });

      historyItems.sort((a, b) => b.id - a.id);
      setRecords(historyItems);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const renderItem = ({ item }: { item: HistoryItem }) => (
    <Card variant="elevated" style={styles.card}>
      <View style={styles.cardLeft}>
        <View
          style={[
            styles.statusIcon,
            item.status === 'present' ? styles.presentIcon : styles.absentIcon,
          ]}
        >
          <Text style={styles.statusIconText}>
            {item.status === 'present' ? '✓' : '✗'}
          </Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{item.subjectName || 'Attendance'}</Text>
          <Text style={styles.cardDate}>{item.date}</Text>
        </View>
      </View>
      <Badge
        label={item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        variant={item.status === 'present' ? 'success' : 'error'}
        size="sm"
      />
    </Card>
  );

  const ListEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyTitle}>No Records Yet</Text>
      <Text style={styles.emptyText}>
        Your attendance history will appear here after you scan QR codes
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={records}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />
        }
        ListEmptyComponent={ListEmpty}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  presentIcon: {
    backgroundColor: colors.successLight,
  },
  absentIcon: {
    backgroundColor: colors.errorLight,
  },
  statusIconText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  cardDate: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
});
