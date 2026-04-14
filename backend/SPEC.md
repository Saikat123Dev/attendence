# Attendance Management System - Full Stack Specification

## Overview
Smart attendance management system with dynamic QR-based attendance tracking for educational institutions.

## Project Structure
```
attendence-project/
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── api/         # Route handlers
│   │   ├── core/        # Config, database, security
│   │   ├── models/      # SQLAlchemy models
│   │   ├── schemas/     # Pydantic schemas
│   │   └── services/    # Business logic
│   └── ...
├── mobile/              # React Native Expo app
│   ├── src/
│   │   ├── api/         # API client
│   │   ├── contexts/    # React contexts (Auth)
│   │   ├── navigation/  # Navigation setup
│   │   ├── screens/     # UI screens
│   │   │   ├── auth/    # Login, Register
│   │   │   ├── teacher/ # Teacher screens
│   │   │   └── student/ # Student screens
│   │   └── types/       # TypeScript types
│   └── ...
└── manual.md           # Project requirements
```

## Tech Stack

### Backend
- **Framework**: FastAPI 0.115+
- **Database**: PostgreSQL with SQLAlchemy 2.0 (async)
- **Authentication**: JWT (python-jose)
- **Password Hashing**: bcrypt (passlib)
- **QR Generation**: qrcode + pillow

### Mobile (Frontend)
- **Framework**: React Native Expo SDK 52
- **Navigation**: React Navigation 7
- **Camera/QR**: expo-camera
- **Storage**: expo-secure-store
- **HTTP Client**: Axios

## Database Schema

### Users Table
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY |
| email | VARCHAR(255) | UNIQUE, NOT NULL |
| hashed_password | VARCHAR(255) | NOT NULL |
| full_name | VARCHAR(255) | NOT NULL |
| role | ENUM(teacher, student) | NOT NULL |
| is_active | BOOLEAN | DEFAULT TRUE |
| created_at | TIMESTAMP | DEFAULT NOW() |

### Students Table
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY |
| user_id | INTEGER | FOREIGN KEY → users.id, UNIQUE |
| roll_number | VARCHAR(50) | UNIQUE, NOT NULL |
| registration_number | VARCHAR(100) | UNIQUE, NOT NULL |
| branch | VARCHAR(100) | NOT NULL |
| semester | INTEGER | NOT NULL |

### Subjects Table
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY |
| name | VARCHAR(255) | NOT NULL |
| code | VARCHAR(50) | UNIQUE, NOT NULL |
| teacher_id | INTEGER | FOREIGN KEY → users.id |
| created_at | TIMESTAMP | DEFAULT NOW() |

### Attendance Sessions Table
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY |
| subject_id | INTEGER | FOREIGN KEY → subjects.id |
| teacher_id | INTEGER | FOREIGN KEY → users.id |
| start_time | TIMESTAMP | NOT NULL |
| end_time | TIMESTAMP | NULLABLE |
| is_active | BOOLEAN | DEFAULT TRUE |
| current_token | VARCHAR(64) | NULLABLE |
| token_timestamp | INTEGER | NULLABLE |

### Attendance Records Table
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY |
| session_id | INTEGER | FOREIGN KEY → attendance_sessions.id |
| student_id | INTEGER | FOREIGN KEY → students.id |
| subject_id | INTEGER | FOREIGN KEY → subjects.id |
| status | ENUM(present, absent, late) | DEFAULT present |
| marked_at | TIMESTAMP | DEFAULT NOW() |
| token_used | VARCHAR(64) | NOT NULL |

### Attendance Stats Table
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY |
| student_id | INTEGER | FOREIGN KEY → students.id, UNIQUE |
| total_classes | INTEGER | DEFAULT 0 |
| total_present | INTEGER | DEFAULT 0 |
| total_absent | INTEGER | DEFAULT 0 |
| attendance_percentage | FLOAT | DEFAULT 0.0 |

## API Endpoints

### Authentication (`/auth`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login and get JWT | No |
| GET | `/auth/me` | Get current user | Yes |

### Students (`/students`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/students/` | Create student profile | Teacher |
| GET | `/students/` | List all students | Yes |
| GET | `/students/{id}` | Get student details | Yes |
| GET | `/students/me/dashboard` | Get own dashboard | Student |

### Subjects (`/subjects`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/subjects/` | Create subject | Teacher |
| GET | `/subjects/` | List subjects | Yes |
| GET | `/subjects/{id}` | Get subject | Yes |

### Attendance (`/attendance`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/attendance/session/start` | Start session | Teacher |
| GET | `/attendance/session/{id}/qr` | Get QR code | Teacher |
| POST | `/attendance/session/{id}/end` | End session | Teacher |
| GET | `/attendance/session/{id}/students` | Get session attendees | Teacher |
| POST | `/attendance/mark` | Mark attendance | Student |
| GET | `/attendance/stats/me` | Get my stats | Student |

## Security Features

### Dynamic QR Token System
- Token generates using: `SHA256(f"{session_id}:{timestamp}:{secret_key}")`
- Timestamp changes every **2 seconds**
- Token validity window: current ± 1 time window
- Each QR code contains: `session_id:token:timestamp`
- One scan per student per session enforced

### JWT Authentication
- Token expiry: 24 hours
- Algorithm: HS256
- Contains: user_id, role, email

## Mobile App Screens

### Authentication
- **Login Screen**: Email/password login
- **Register Screen**: New account creation with role selection

### Teacher Screens
- **Dashboard**: Subject list, student overview
- **QRSession**: Live QR code display with timer
- **CreateSubject**: Add new subjects
- **StudentDetail**: Individual student attendance view

### Student Screens
- **Dashboard**: Attendance stats, QR scan button
- **QRScanner**: Camera-based QR code scanner
- **AttendanceHistory**: Past attendance records

## Running the Project

### Backend
```bash
cd backend
pip install -r requirements.txt
# Create .env with DATABASE_URL
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Mobile
```bash
cd mobile
npm install
npx expo start
```

## Backend Project Structure
```
backend/
├── app/
│   ├── api/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── attendance.py
│   │   ├── students.py
│   │   └── subjects.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── database.py
│   │   └── security.py
│   ├── models/
│   │   ├── __init__.py
│   │   └── models.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── schemas.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── attendance_service.py
│   │   └── student_service.py
│   ├── __init__.py
│   └── main.py
├── requirements.txt
├── pyproject.toml
└── SPEC.md
```

## Mobile Project Structure
```
mobile/
├── src/
│   ├── api/
│   │   └── index.ts           # API client
│   ├── contexts/
│   │   └── AuthContext.tsx   # Auth provider
│   ├── navigation/
│   │   └── AppNavigator.tsx  # Navigation setup
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── RegisterScreen.tsx
│   │   ├── teacher/
│   │   │   ├── TeacherDashboard.tsx
│   │   │   ├── QRSessionScreen.tsx
│   │   │   ├── CreateSubjectScreen.tsx
│   │   │   └── StudentDetailScreen.tsx
│   │   └── student/
│   │       ├── StudentDashboard.tsx
│   │       ├── QRScannerScreen.tsx
│   │       └── AttendanceHistoryScreen.tsx
│   └── types/
│       └── index.ts           # TypeScript types
├── App.tsx
├── app.json
├── package.json
└── tsconfig.json
```

## TODO
- [x] Backend: Authentication (register, login, JWT)
- [x] Backend: Student CRUD
- [x] Backend: Subject management
- [x] Backend: Attendance session management
- [x] Backend: Dynamic QR generation
- [x] Backend: Token validation
- [x] Backend: Attendance marking
- [x] Backend: Pre-calculated attendance stats
- [x] Mobile: Authentication screens
- [x] Mobile: Teacher dashboard & QR display
- [x] Mobile: Student dashboard & QR scanner
- [ ] Add Alembic migrations
- [ ] Add unit tests
