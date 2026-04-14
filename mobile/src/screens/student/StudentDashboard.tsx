import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, borderRadius, typography, shadowMd, shadowLg } from '../../utils/theme';
import { Button, Card, Badge, ProgressBar } from '../../components';
import { api } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { AttendanceStats } from '../../types';

export default function StudentDashboard({ navigation }: { navigation: any }) {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const data = await api.getMyStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [])
  );

  const handleLogout = () => {
    logout();
  };

  const percentage = stats?.attendance_percentage || 0;
  const isGood = percentage >= 75;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Hello,</Text>
          <Text style={styles.name}>{user?.full_name}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => navigation.navigate('QRScanner')}
          activeOpacity={0.9}
        >
          <View style={styles.scanIconContainer}>
            <Text style={styles.scanIcon}>📷</Text>
          </View>
          <Text style={styles.scanTitle}>Scan QR Code</Text>
          <Text style={styles.scanSubtitle}>Mark your attendance</Text>
          <View style={styles.scanArrow}>
            <Text style={styles.scanArrowText}>→</Text>
          </View>
        </TouchableOpacity>

        <Card variant="elevated" style={styles.statsCard}>
          <View style={styles.statsHeader}>
            <Text style={styles.statsTitle}>Your Attendance</Text>
            <Badge
              label={isGood ? 'Good' : 'Needs Improvement'}
              variant={isGood ? 'success' : 'warning'}
              size="sm"
            />
          </View>

          <View style={styles.percentageContainer}>
            <Text style={[styles.percentage, isGood ? styles.goodText : styles.warningText]}>
              {percentage}%
            </Text>
            <Text style={styles.percentageLabel}>Overall</Text>
          </View>

          <ProgressBar
            progress={percentage}
            color={isGood ? colors.success : colors.warning}
            height={8}
            style={styles.progressBar}
          />

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: colors.successLight }]}>
                <Text style={styles.statIconText}>✓</Text>
              </View>
              <Text style={styles.statValue}>{stats?.total_present || 0}</Text>
              <Text style={styles.statLabel}>Present</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: colors.errorLight }]}>
                <Text style={styles.statIconText}>✗</Text>
              </View>
              <Text style={styles.statValue}>{stats?.total_absent || 0}</Text>
              <Text style={styles.statLabel}>Absent</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: colors.primaryLight + '30' }]}>
                <Text style={styles.statIconText}>📊</Text>
              </View>
              <Text style={styles.statValue}>{stats?.total_classes || 0}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
        </Card>

        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => navigation.navigate('AttendanceHistory')}
          activeOpacity={0.8}
        >
          <View style={styles.historyLeft}>
            <Text style={styles.historyIcon}>📋</Text>
            <View>
              <Text style={styles.historyTitle}>Attendance History</Text>
              <Text style={styles.historySubtitle}>View past records</Text>
            </View>
          </View>
          <Text style={styles.historyArrow}>→</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    ...shadowMd,
  },
  headerLeft: {
    gap: spacing.xs,
  },
  greeting: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  name: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  logoutButton: {
    padding: spacing.sm,
  },
  logoutText: {
    ...typography.body,
    color: colors.error,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  scanButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    ...shadowLg,
  },
  scanIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  scanIcon: {
    fontSize: 32,
  },
  scanTitle: {
    ...typography.h2,
    color: colors.textInverse,
    marginBottom: spacing.xs,
  },
  scanSubtitle: {
    ...typography.body,
    color: 'rgba(255,255,255,0.8)',
  },
  scanArrow: {
    position: 'absolute',
    right: spacing.lg,
    top: '50%',
  },
  scanArrowText: {
    fontSize: 24,
    color: 'rgba(255,255,255,0.6)',
  },
  statsCard: {
    marginBottom: spacing.lg,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statsTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  percentageContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  percentage: {
    fontSize: 56,
    fontWeight: '700',
  },
  goodText: {
    color: colors.success,
  },
  warningText: {
    color: colors.warning,
  },
  percentageLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  progressBar: {
    marginBottom: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statIconText: {
    fontSize: 18,
  },
  statValue: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  historyButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadowMd,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  historyIcon: {
    fontSize: 32,
  },
  historyTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  historySubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  historyArrow: {
    fontSize: 24,
    color: colors.primary,
  },
});
