import axios, { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import {
  User,
  Student,
  Subject,
  AttendanceSession,
  QRCodeData,
  AttendanceRecord,
  AttendanceStats,
  TokenResponse,
  UserRole,
  StudentDetail,
  SessionAttendanceStudent,
} from '../types';

const API_BASE_URL = 'https://8700-2409-40e1-344f-e179-3705-4431-c50b-d4e.ngrok-free.app';

class ApiService {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use(
      async (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          this.token = null;
        }
        return Promise.reject(error);
      }
    );
  }

  async loadToken(): Promise<string | null> {
    try {
      this.token = await SecureStore.getItemAsync('auth_token');
      return this.token;
    } catch {
      return null;
    }
  }

  async setToken(token: string): Promise<void> {
    if (!token) return;
    this.token = token;
    try {
      await SecureStore.setItemAsync('auth_token', token);
    } catch (e) {
      console.error('SecureStore error:', e);
    }
  }

  async clearToken(): Promise<void> {
    this.token = null;
    await SecureStore.deleteItemAsync('auth_token');
  }

  getToken(): string | null {
    return this.token;
  }

  // Auth
  async register(
    email: string,
    password: string,
    fullName: string,
    role: UserRole
  ): Promise<TokenResponse> {
    const response = await this.client.post<TokenResponse>('/auth/register', {
      email,
      password,
      full_name: fullName,
      role,
    });
    return response.data;
  }

  async login(email: string, password: string): Promise<TokenResponse> {
    const response = await this.client.post<TokenResponse>('/auth/login', {
      email,
      password,
    });
    return response.data;
  }

  async getMe(): Promise<User> {
    const response = await this.client.get<User>('/auth/me');
    return response.data;
  }

  // Students
  async createStudent(data: {
    roll_number: string;
    registration_number: string;
    branch: string;
    semester: number;
  }): Promise<Student> {
    const response = await this.client.post<Student>('/students/me', data);
    return response.data;
  }

  async getStudents(): Promise<Student[]> {
    const response = await this.client.get<Student[]>('/students/');
    return response.data;
  }

  async getStudent(studentId: number): Promise<StudentDetail> {
    const response = await this.client.get<StudentDetail>(`/students/${studentId}`);
    return response.data;
  }

  async getMyDashboard(): Promise<StudentDetail> {
    const response = await this.client.get<StudentDetail>('/students/me/dashboard');
    return response.data;
  }

  // Subjects
  async createSubject(data: { name: string; code: string }): Promise<Subject> {
    const response = await this.client.post<Subject>('/subjects/', data);
    return response.data;
  }

  async getSubjects(): Promise<Subject[]> {
    const response = await this.client.get<Subject[]>('/subjects/');
    return response.data;
  }

  async getSubject(subjectId: number): Promise<Subject> {
    const response = await this.client.get<Subject>(`/subjects/${subjectId}`);
    return response.data;
  }

  // Attendance Sessions
  async startSession(subjectId: number): Promise<AttendanceSession> {
    const response = await this.client.post<AttendanceSession>(
      '/attendance/session/start',
      { subject_id: subjectId }
    );
    return response.data;
  }

  async getQRCode(sessionId: number): Promise<QRCodeData> {
    const response = await this.client.get<QRCodeData>(
      `/attendance/session/${sessionId}/qr`
    );
    return response.data;
  }

  async endSession(sessionId: number): Promise<AttendanceSession> {
    const response = await this.client.post<AttendanceSession>(
      `/attendance/session/${sessionId}/end`
    );
    return response.data;
  }

  async getSessionStudents(
    sessionId: number
  ): Promise<SessionAttendanceStudent[]> {
    const response = await this.client.get<SessionAttendanceStudent[]>(
      `/attendance/session/${sessionId}/students`
    );
    return response.data;
  }

  async markAttendance(
    sessionId: number,
    token: string,
    timestamp: number
  ): Promise<{ message: string }> {
    const response = await this.client.post<{ message: string }>(
      '/attendance/mark',
      {
        session_id: sessionId,
        token,
        timestamp,
      }
    );
    return response.data;
  }

  async getMyStats(): Promise<AttendanceStats> {
    const response = await this.client.get<AttendanceStats>('/attendance/stats/me');
    return response.data;
  }

  async getMyAttendanceHistory(): Promise<AttendanceRecord[]> {
    const response = await this.client.get<AttendanceRecord[]>('/attendance/history/me');
    return response.data;
  }
}

export const api = new ApiService();
