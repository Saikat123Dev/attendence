import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, borderRadius, typography, shadowMd } from '../../utils/theme';
import { Button, Card, Badge, Avatar } from '../../components';
import { api } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { Subject, Student } from '../../types';

export default function TeacherDashboard({ navigation }: { navigation: any }) {
  const { user, logout } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'subjects' | 'students'>('subjects');

  const fetchData = async () => {
    try {
      const [subjectsData, studentsData] = await Promise.all([
        api.getSubjects(),
        api.getStudents(),
      ]);
      setSubjects(subjectsData);
      setStudents(studentsData);
    } catch (error) {
      console.error('Error fetching data:', error);
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

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const renderSubjectItem = ({ item }: { item: Subject }) => (
    <Card variant="elevated" style={styles.card} onPress={() => navigation.navigate('QRSession', { subject: item })}>
      <View style={styles.cardHeader}>
        <View style={styles.subjectIcon}>
          <Text style={styles.subjectIconText}>📚</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Badge label={item.code} variant="primary" size="sm" />
        </View>
      </View>
      <View style={styles.cardActions}>
        <Button
          title="Start QR"
          size="sm"
          onPress={() => navigation.navigate('QRSession', { subject: item })}
        />
      </View>
    </Card>
  );

  const renderStudentItem = ({ item }: { item: Student }) => (
    <Card variant="elevated" style={styles.card} onPress={() => navigation.navigate('StudentDetail', { student: item })}>
      <View style={styles.cardHeader}>
        <Avatar name={item.full_name} size="md" />
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{item.full_name}</Text>
          <Text style={styles.cardSubtitle}>Roll: {item.roll_number}</Text>
          <Text style={styles.cardSubtitle}>{item.branch} • Sem {item.semester}</Text>
        </View>
        <View
          style={[
            styles.percentageBadge,
            item.attendance_percentage >= 75 ? styles.goodBadge : styles.warningBadge,
          ]}
        >
          <Text
            style={[
              styles.percentageText,
              item.attendance_percentage >= 75 ? styles.goodText : styles.warningText,
            ]}
          >
            {item.attendance_percentage}%
          </Text>
        </View>
      </View>
    </Card>
  );

  const ListEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📭</Text>
      <Text style={styles.emptyTitle}>
        {activeTab === 'subjects' ? 'No subjects yet' : 'No students yet'}
      </Text>
      <Text style={styles.emptyText}>
        {activeTab === 'subjects'
          ? 'Create a subject to start taking attendance'
          : 'Students will appear here when they register'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Hello, {user?.full_name}</Text>
          <Badge label="Teacher" variant="primary" size="sm" />
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'subjects' && styles.activeTab]}
          onPress={() => setActiveTab('subjects')}
        >
          <Text style={[styles.tabText, activeTab === 'subjects' && styles.activeTabText]}>
            Subjects
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'students' && styles.activeTab]}
          onPress={() => setActiveTab('students')}
        >
          <Text style={[styles.tabText, activeTab === 'students' && styles.activeTabText]}>
            Students
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'subjects' ? (
        <FlatList
          data={subjects}
          renderItem={renderSubjectItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />
          }
          ListEmptyComponent={ListEmpty}
        />
      ) : (
        <FlatList
          data={students}
          renderItem={renderStudentItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />
          }
          ListEmptyComponent={ListEmpty}
        />
      )}

      {activeTab === 'subjects' && (
        <View style={styles.fabContainer}>
          <TouchableOpacity
            style={styles.fab}
            onPress={() => navigation.navigate('CreateSubject')}
          >
            <Text style={styles.fabText}>+</Text>
          </TouchableOpacity>
        </View>
      )}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  greeting: {
    ...typography.h3,
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: colors.primary,
  },
  tabText: {
    ...typography.body,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600',
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  card: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subjectIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  subjectIconText: {
    fontSize: 24,
  },
  cardInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  cardTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  cardSubtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  cardActions: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  percentageBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  goodBadge: {
    backgroundColor: colors.successLight,
  },
  warningBadge: {
    backgroundColor: colors.warningLight,
  },
  percentageText: {
    ...typography.bodySmall,
    fontWeight: '700',
  },
  goodText: {
    color: colors.success,
  },
  warningText: {
    color: colors.warning,
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
  fabContainer: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadowMd,
  },
  fabText: {
    fontSize: 32,
    color: colors.textInverse,
    lineHeight: 36,
  },
});
