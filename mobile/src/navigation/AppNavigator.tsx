import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../utils/theme';
import { useAuth } from '../contexts/AuthContext';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import TeacherDashboard from '../screens/teacher/TeacherDashboard';
import StudentDetailScreen from '../screens/teacher/StudentDetailScreen';
import QRSessionScreen from '../screens/teacher/QRSessionScreen';
import CreateSubjectScreen from '../screens/teacher/CreateSubjectScreen';
import StudentDashboard from '../screens/student/StudentDashboard';
import StudentProfileScreen from '../screens/student/StudentProfileScreen';
import QRScannerScreen from '../screens/student/QRScannerScreen';
import AttendanceHistoryScreen from '../screens/student/AttendanceHistoryScreen';
import { Student, Subject } from '../types';

type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

type TeacherTabParamList = {
  Dashboard: undefined;
  CreateSubject: undefined;
};

type StudentTabParamList = {
  Dashboard: undefined;
  AttendanceHistory: undefined;
};

type TeacherStackParamList = {
  TeacherTabs: undefined;
  StudentDetail: { student: Student };
  QRSession: { subject: Subject };
};

type StudentStackParamList = {
  StudentTabs: undefined;
  StudentProfile: undefined;
  QRScanner: undefined;
};

type RootStackParamList = {
  Auth: undefined;
  Teacher: undefined;
  Student: undefined;
  StudentProfile: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStackNav = createNativeStackNavigator<AuthStackParamList>();
const TeacherStack = createNativeStackNavigator<TeacherStackParamList>();
const StudentStack = createNativeStackNavigator<StudentStackParamList>();
const TeacherTab = createBottomTabNavigator<TeacherTabParamList>();
const StudentTab = createBottomTabNavigator<StudentTabParamList>();

function AuthStack() {
  return (
    <AuthStackNav.Navigator screenOptions={{ headerShown: false }}>
      <AuthStackNav.Screen name="Login" component={LoginScreen} />
      <AuthStackNav.Screen name="Register" component={RegisterScreen} />
    </AuthStackNav.Navigator>
  );
}

function TabIcon({ icon, label, focused }: { icon: string; label: string; focused: boolean }) {
  return (
    <View style={styles.tabIconContainer}>
      <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>{icon}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
    </View>
  );
}

function TeacherTabs() {
  return (
    <TeacherTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <TeacherTab.Screen
        name="Dashboard"
        component={TeacherDashboard}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🏠" label="Home" focused={focused} />
          ),
        }}
      />
      <TeacherTab.Screen
        name="CreateSubject"
        component={CreateSubjectScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="➕" label="Add" focused={focused} />
          ),
        }}
      />
    </TeacherTab.Navigator>
  );
}

function StudentTabs() {
  return (
    <StudentTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <StudentTab.Screen
        name="Dashboard"
        component={StudentDashboard}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🏠" label="Home" focused={focused} />
          ),
        }}
      />
      <StudentTab.Screen
        name="AttendanceHistory"
        component={AttendanceHistoryScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="📋" label="History" focused={focused} />
          ),
        }}
      />
    </StudentTab.Navigator>
  );
}

function TeacherStackNavigator() {
  return (
    <TeacherStack.Navigator screenOptions={{ headerShown: false }}>
      <TeacherStack.Screen name="TeacherTabs" component={TeacherTabs} />
      <TeacherStack.Screen
        name="StudentDetail"
        component={StudentDetailScreen}
        options={{
          headerShown: true,
          title: 'Student Details',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.textPrimary,
          headerShadowVisible: false,
        }}
      />
      <TeacherStack.Screen
        name="QRSession"
        component={QRSessionScreen}
        options={{ headerShown: false }}
      />
    </TeacherStack.Navigator>
  );
}

function StudentStackNavigator() {
  return (
    <StudentStack.Navigator screenOptions={{ headerShown: false }}>
      <StudentStack.Screen name="StudentTabs" component={StudentTabs} />
      <StudentStack.Screen
        name="StudentProfile"
        component={StudentProfileScreen}
        options={{ headerShown: false }}
      />
      <StudentStack.Screen
        name="QRScanner"
        component={QRScannerScreen}
        options={{ presentation: 'fullScreenModal' }}
      />
    </StudentStack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, isLoading, isStudentProfileComplete } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        user.role === 'teacher' ? (
          <RootStack.Screen name="Teacher" component={TeacherStackNavigator} />
        ) : (
          // Student flow - check if profile is complete
          !isStudentProfileComplete ? (
            <RootStack.Screen name="StudentProfile" component={StudentProfileScreen} />
          ) : (
            <RootStack.Screen name="Student" component={StudentStackNavigator} />
          )
        )
      ) : (
        <RootStack.Screen name="Auth" component={AuthStack} />
      )}
    </RootStack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  tabBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: 80,
    paddingBottom: 20,
    paddingTop: 10,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 24,
    opacity: 0.5,
  },
  tabIconFocused: {
    opacity: 1,
  },
  tabLabel: {
    ...typography.caption,
    color: colors.textTertiary,
    marginTop: 4,
  },
  tabLabelFocused: {
    color: colors.primary,
    fontWeight: '600',
  },
});
