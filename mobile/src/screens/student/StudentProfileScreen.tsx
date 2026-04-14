import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography, shadowLg } from '../../utils/theme';
import { Button, Input } from '../../components';
import { useAuth } from '../../contexts/AuthContext';

export default function StudentProfileScreen() {
  const { completeStudentProfile, logout } = useAuth();
  const [rollNumber, setRollNumber] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [branch, setBranch] = useState('');
  const [semester, setSemester] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!rollNumber.trim() || !registrationNumber.trim() || !branch.trim() || !semester.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all fields');
      return;
    }

    const semesterNum = parseInt(semester, 10);
    if (isNaN(semesterNum) || semesterNum < 1 || semesterNum > 8) {
      Alert.alert('Invalid Semester', 'Semester must be between 1 and 8');
      return;
    }

    setIsLoading(true);
    try {
      await completeStudentProfile({
        roll_number: rollNumber.trim().toUpperCase(),
        registration_number: registrationNumber.trim().toUpperCase(),
        branch: branch.trim().toUpperCase(),
        semester: semesterNum,
      });
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Failed to create profile';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarIcon}>🎓</Text>
            </View>
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>
              Students need to set up their details before using the app
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Roll Number"
              placeholder="e.g., 21CS101"
              value={rollNumber}
              onChangeText={setRollNumber}
              autoCapitalize="characters"
            />
            <Input
              label="Registration Number"
              placeholder="e.g., 2021/CS/101"
              value={registrationNumber}
              onChangeText={setRegistrationNumber}
              autoCapitalize="characters"
            />
            <Input
              label="Branch"
              placeholder="e.g., Computer Science"
              value={branch}
              onChangeText={setBranch}
              autoCapitalize="words"
            />
            <Input
              label="Semester"
              placeholder="e.g., 3"
              value={semester}
              onChangeText={setSemester}
              keyboardType="number-pad"
              maxLength={1}
            />

            <Button
              title="Complete Setup"
              onPress={handleSubmit}
              loading={isLoading}
              disabled={!rollNumber.trim() || !registrationNumber.trim() || !branch.trim() || !semester.trim()}
              style={styles.button}
            />

            <Button
              title="Logout"
              variant="ghost"
              onPress={handleLogout}
              style={styles.logoutButton}
              textStyle={styles.logoutText}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadowLg,
  },
  avatarIcon: {
    fontSize: 48,
  },
  title: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  form: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    ...shadowLg,
  },
  button: {
    marginTop: spacing.sm,
  },
  logoutButton: {
    marginTop: spacing.md,
  },
  logoutText: {
    color: colors.error,
  },
});
