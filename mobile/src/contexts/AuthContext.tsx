import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { api } from '../api';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isStudentProfileComplete: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    fullName: string,
    role: UserRole
  ) => Promise<{ needsProfile: boolean }>;
  completeStudentProfile: (data: {
    roll_number: string;
    registration_number: string;
    branch: string;
    semester: number;
  }) => Promise<void>;
  logout: () => Promise<void>;
  checkStudentProfile: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStudentProfileComplete, setIsStudentProfileComplete] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await api.loadToken();
      if (token) {
        const userData = await api.getMe();
        setUser(userData);
        if (userData.role === 'student') {
          await checkStudentProfile();
        }
      }
    } catch (error) {
      await api.clearToken();
    } finally {
      setIsLoading(false);
    }
  };

  const checkStudentProfile = useCallback(async (): Promise<boolean> => {
    try {
      await api.getMyDashboard();
      setIsStudentProfileComplete(true);
      return true;
    } catch {
      setIsStudentProfileComplete(false);
      return false;
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.login(email, password);
    await api.setToken(response.access_token);
    setUser(response.user);
    if (response.user.role === 'student') {
      await checkStudentProfile();
    }
  };

  const register = async (
    email: string,
    password: string,
    fullName: string,
    role: UserRole
  ): Promise<{ needsProfile: boolean }> => {
    const response = await api.register(email, password, fullName, role);
    await api.setToken(response.access_token);
    setUser(response.user);

    if (role === 'student') {
      try {
        await api.getMyDashboard();
        setIsStudentProfileComplete(true);
        return { needsProfile: false };
      } catch {
        setIsStudentProfileComplete(false);
        return { needsProfile: true };
      }
    }
    return { needsProfile: false };
  };

  const completeStudentProfile = async (data: {
    roll_number: string;
    registration_number: string;
    branch: string;
    semester: number;
  }) => {
    await api.createStudent(data);
    setIsStudentProfileComplete(true);
  };

  const logout = async () => {
    await api.clearToken();
    setUser(null);
    setIsStudentProfileComplete(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isStudentProfileComplete,
        login,
        register,
        completeStudentProfile,
        logout,
        checkStudentProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
