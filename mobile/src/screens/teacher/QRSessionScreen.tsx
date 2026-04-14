import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography, shadowLg } from '../../utils/theme';
import { Button, Card } from '../../components';
import { api } from '../../api';
import { Subject, QRCodeData, AttendanceSession } from '../../types';

export default function QRSessionScreen({ navigation, route }: { navigation: any; route: { params: { subject: Subject } } }) {
  const { subject } = route.params;
  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [qrData, setQrData] = useState<QRCodeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnding, setIsEnding] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const qrRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    startSession();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (qrRefreshRef.current) clearInterval(qrRefreshRef.current);
    };
  }, []);

  useEffect(() => {
    if (session?.is_active) {
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [session?.is_active]);

  useEffect(() => {
    if (session?.is_active) {
      qrRefreshRef.current = setInterval(fetchQRCode, 2000);
    }
    return () => {
      if (qrRefreshRef.current) clearInterval(qrRefreshRef.current);
    };
  }, [session?.is_active]);

  const startSession = async () => {
    try {
      setIsLoading(true);
      const newSession = await api.startSession(subject.id);
      setSession(newSession);
      if (newSession.is_active) {
        await fetchQRCode();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to start session');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const fetchQRCode = async () => {
    if (!session || !session.is_active) return;
    try {
      const data = await api.getQRCode(session.id);
      setQrData(data);
    } catch (error: any) {
      // Silently handle "not active" - expected after ending session
      const detail = error?.response?.data?.detail;
      if (detail !== 'Session is not active') {
        console.error('Error fetching QR:', detail || error?.message || error);
      }
    }
  };

  const endSession = () => {
    if (!session) return;
    Alert.alert('End Session', 'Are you sure you want to end this attendance session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End',
        style: 'destructive',
        onPress: async () => {
          // Clear intervals immediately
          if (timerRef.current) clearInterval(timerRef.current);
          if (qrRefreshRef.current) clearInterval(qrRefreshRef.current);

          setIsEnding(true);
          try {
            await api.endSession(session.id);
            navigation.goBack();
          } catch (error) {
            // Restart intervals if end failed
            if (session.is_active) {
              timerRef.current = setInterval(() => {
                setElapsedTime((prev) => prev + 1);
              }, 1000);
              qrRefreshRef.current = setInterval(fetchQRCode, 2000);
            }
            Alert.alert('Error', 'Failed to end session');
          } finally {
            setIsEnding(false);
          }
        },
      },
    ]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Starting session...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>QR Attendance</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.content}>
        <Card variant="elevated" style={styles.subjectCard}>
          <Text style={styles.subjectName}>{subject.name}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.codeBadge}>
              <Text style={styles.codeText}>{subject.code}</Text>
            </View>
            <View style={[styles.statusBadge, session?.is_active && styles.activeBadge]}>
              <View style={[styles.statusDot, session?.is_active && styles.activeDot]} />
              <Text style={[styles.statusText, session?.is_active && styles.activeStatusText]}>
                {session?.is_active ? 'Live' : 'Ended'}
              </Text>
            </View>
          </View>
        </Card>

        <View style={styles.timerCard}>
          <Text style={styles.timerLabel}>Session Duration</Text>
          <Text style={styles.timer}>{formatTime(elapsedTime)}</Text>
        </View>

        <Card variant="elevated" style={styles.qrCard}>
          <Text style={styles.qrTitle}>Scan to Mark Attendance</Text>
          <View style={styles.qrContainer}>
            {qrData?.qr_image ? (
              <Image source={{ uri: qrData.qr_image }} style={styles.qrImage} />
            ) : (
              <View style={styles.qrPlaceholder}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            )}
          </View>
          <Text style={styles.qrNote}>QR refreshes every 2 seconds</Text>
        </Card>
      </View>

      <View style={styles.footer}>
        <Button
          title="End Session"
          variant="outline"
          onPress={endSession}
          loading={isEnding}
          style={styles.endButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.surface,
    ...shadowLg,
  },
  backButton: {
    padding: spacing.sm,
  },
  backText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  headerRight: {
    width: 60,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  subjectCard: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  subjectName: {
    ...typography.h2,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  codeBadge: {
    backgroundColor: colors.primaryLight + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  codeText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  activeBadge: {
    backgroundColor: colors.successLight,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textTertiary,
  },
  activeDot: {
    backgroundColor: colors.success,
  },
  statusText: {
    ...typography.caption,
    color: colors.textTertiary,
    fontWeight: '600',
  },
  activeStatusText: {
    color: colors.success,
  },
  timerCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadowLg,
  },
  timerLabel: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  timer: {
    fontSize: 56,
    fontWeight: '700',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  qrCard: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  qrTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  qrContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  qrImage: {
    width: 220,
    height: 220,
  },
  qrPlaceholder: {
    width: 220,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: borderRadius.md,
  },
  qrNote: {
    ...typography.caption,
    color: colors.textTertiary,
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  endButton: {
    borderColor: colors.error,
  },
});
