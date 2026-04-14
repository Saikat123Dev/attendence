import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography, shadowMd } from '../../utils/theme';
import { Avatar, Badge, Card, ProgressBar } from '../../components';
import { Student } from '../../types';

interface Props {
  navigation: any;
  route: { params: { student: Student } };
}

export default function StudentDetailScreen({ navigation, route }: Props) {
  const { student } = route.params;
  const percentage = student.attendance_percentage || 0;
  const isGood = percentage >= 75;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <Card variant="elevated" style={styles.profileCard}>
          <Avatar name={student.full_name} size="xl" style={styles.avatar} />
          <Text style={styles.name}>{student.full_name}</Text>
          <Text style={styles.email}>{student.email}</Text>
          <Badge
            label={isGood ? 'Good Attendance' : 'Low Attendance'}
            variant={isGood ? 'success' : 'warning'}
            style={styles.badge}
          />
        </Card>

        <Card variant="elevated" style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Student Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Roll Number</Text>
            <Text style={styles.infoValue}>{student.roll_number}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Registration</Text>
            <Text style={styles.infoValue}>{student.registration_number}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Branch</Text>
            <Text style={styles.infoValue}>{student.branch}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Semester</Text>
            <Text style={styles.infoValue}>{student.semester}</Text>
          </View>
        </Card>

        <Card variant="elevated" style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Attendance Overview</Text>
          <View style={styles.percentageContainer}>
            <Text style={[styles.percentage, isGood ? styles.goodText : styles.warningText]}>
              {percentage}%
            </Text>
            <Text style={styles.percentageLabel}>Overall Attendance</Text>
          </View>
          <ProgressBar
            progress={percentage}
            color={isGood ? colors.success : colors.warning}
            height={10}
            style={styles.progressBar}
          />
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{Math.round(percentage)}</Text>
              <Text style={styles.statLabel}>Classes Attended</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{100 - Math.round(percentage)}</Text>
              <Text style={styles.statLabel}>Classes Missed</Text>
            </View>
          </View>
        </Card>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  profileCard: {
    alignItems: 'center',
    padding: spacing.xl,
    marginBottom: spacing.md,
  },
  avatar: {
    marginBottom: spacing.md,
  },
  name: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  email: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  badge: {
    marginTop: spacing.xs,
  },
  infoCard: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  infoLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  infoValue: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  statsCard: {
    padding: spacing.lg,
  },
  percentageContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  percentage: {
    fontSize: 48,
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
    marginTop: spacing.xs,
  },
  progressBar: {
    marginBottom: spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
