export type UserRole = 'teacher' | 'student';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface Student {
  id: number;
  user_id: number;
  roll_number: string;
  registration_number: string;
  branch: string;
  semester: number;
  full_name?: string;
  email?: string;
  attendance_percentage: number;
}

export interface StudentDetail extends Student {
  subject_wise_attendance: Record<number, SubjectAttendance>;
}

export interface Subject {
  id: number;
  name: string;
  code: string;
  teacher_id: number;
  teacher_name?: string;
}

export interface AttendanceSession {
  id: number;
  subject_id: number;
  teacher_id: number;
  start_time: string;
  end_time?: string;
  is_active: boolean;
  current_token?: string;
  token_timestamp?: number;
}

export interface QRCodeData {
  session_id: number;
  token: string;
  timestamp: number;
  qr_data: string;
  qr_image: string;
}

export interface AttendanceRecord {
  id: number;
  session_id: number;
  student_id: number;
  subject_id: number;
  subject_name?: string;
  status: 'present' | 'absent' | 'late';
  marked_at: string;
}

export interface AttendanceStats {
  total_classes: number;
  total_present: number;
  total_absent: number;
  attendance_percentage: number;
  subject_wise: Record<number, SubjectAttendance>;
}

export interface SubjectAttendance {
  subject_id?: number;
  subject_name?: string;
  present: number;
  absent: number;
  total: number;
  percentage: number;
}

export interface SessionAttendanceStudent {
  student_id: number;
  student_name: string;
  roll_number: string;
  status: string;
  marked_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface ApiError {
  detail: string;
}
