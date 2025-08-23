# Frontend Summary for Backend Implementation

## Project Overview
**Baraem Al-Nour** - An Islamic Educational Platform Management System built with React + Vite, using Tailwind CSS for styling. The platform manages Islamic education classes, students, teachers, parents, and administrators.

## Technology Stack
- **Frontend**: React 18 + Vite, Tailwind CSS, Lucide React icons
- **State Management**: React hooks (useState, useEffect)
- **Routing**: Custom router implementation
- **Styling**: Tailwind CSS (no separate CSS files)
- **Authentication**: Currently mock-based with localStorage

## User Roles & Access Control
The system supports **4 distinct user roles** with role-based routing:

1. **Students** - Access to enrolled classes, schedules, progress tracking
2. **Teachers** - Class management, student progress, session scheduling
3. **Parents** - Child account management, communication, schedules
4. **Administrators** - User management, class oversight, analytics

## Core Data Models

### Users
```typescript
interface User {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'student' | 'teacher' | 'parent' | 'admin';
  joinDate: string;
  status: 'active' | 'inactive';
  avatar?: string;
}
```

### Students (extends User)
```typescript
interface Student extends User {
  age: number;
  parentId: number;
  courseIds: number[];
}
```

### Teachers (extends User)
```typescript
interface Teacher extends User {
  specialization: string;
  courseIds: number[];
}
```

### Parents (extends User)
```typescript
interface Parent extends User {
  children: number[]; // Array of student IDs
}
```

### Classes/Courses
```typescript
interface Class {
  id: number;
  name: string;
  teacherId: number;
  numberOfSessions: number;
  sessionDuration: number; // minutes
  price: number; // USD currency
  students: number[]; // Array of student IDs
  description: string;
  startDate: string;
  endDate: string;
  schedule: ScheduleItem[];
  materials: CourseMaterial[];
  files: CourseFile[];
  folders: CourseFolder[];
}

interface ScheduleItem {
  day: string; // "Sunday", "Monday", etc.
  startTime: string; // "16:00" (24-hour format)
  endTime: string; // "18:00"
}

interface Session {
  id: number;
  classId: number;
  title: string;
  description?: string;
  scheduledDate: string; // ISO date string
  startTime: string; // "16:00" (24-hour format)
  endTime: string; // "18:00"
  location?: string; // Room number or Zoom link
  type: 'regular' | 'custom' | 'makeup' | 'exam';
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  teacherId: number;
  attendees: number[]; // Array of student IDs
  materials?: number[]; // Array of material IDs
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface SessionAttendance {
  id: number;
  sessionId: number;
  studentId: number;
  status: 'present' | 'absent' | 'late' | 'not_marked';
  checkInTime?: string; // ISO timestamp
  checkOutTime?: string; // ISO timestamp
  notes?: string; // Teacher notes about attendance
  markedBy: number; // User ID who marked attendance
  markedAt: string; // ISO timestamp
  updatedAt: string;
}

interface AttendanceReport {
  studentId: number;
  studentName: string;
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  attendanceRate: number; // Percentage
  lastAttendance: string; // ISO date
  consecutiveAbsences: number;
}

interface CourseMaterial {
  id: number;
  classId: number;
  title: string;
  description?: string;
  type: 'post' | 'assignment' | 'announcement' | 'resource';
  content: string; // Rich text content
  attachments: number[]; // Array of file IDs
  authorId: number; // Teacher who created the material
  isPublished: boolean;
  publishDate?: string;
  dueDate?: string; // For assignments
  createdAt: string;
  updatedAt: string;
}

interface CourseFile {
  id: number;
  classId: number;
  fileName: string;
  originalName: string;
  fileSize: number; // in bytes
  mimeType: string;
  filePath: string;
  uploadedBy: number; // User ID
  uploadedAt: string;
  isPublic: boolean;
  tags?: string[];
  description?: string;
}

interface CourseFolder {
  id: number;
  classId: number;
  name: string;
  description?: string;
  parentFolderId?: number; // For nested folders
  createdBy: number; // User ID
  createdAt: string;
  updatedAt: string;
  files: number[]; // Array of file IDs
  subFolders: number[]; // Array of sub-folder IDs
}
```

## Key Features & API Endpoints Needed

### Authentication & Authorization
- `POST /auth/login` - User login with email/password
- `POST /auth/register` - User registration
- `POST /auth/logout` - User logout
- JWT token management
- Role-based access control middleware

### User Management
- `GET /users/profile` - Get current user profile
- `PUT /users/profile` - Update user profile
- `GET /admin/users` - Admin: List all users
- `POST /admin/users` - Admin: Create new user
- `PUT /admin/users/:id` - Admin: Update user
- `DELETE /admin/users/:id` - Admin: Delete user

### Class Management
- `GET /classes` - List all classes (with filtering)
- `GET /classes/:id` - Get class details
- `POST /admin/classes` - Admin: Create new class
- `PUT /admin/classes/:id` - Admin: Update class
- `DELETE /admin/classes/:id` - Admin: Delete class
- `POST /classes/:id/enroll` - Student: Enroll in class
- `DELETE /classes/:id/enroll` - Student: Unenroll from class

### Dashboard Data
- `GET /dashboard/student` - Student dashboard data
- `GET /dashboard/teacher` - Teacher dashboard data
- `GET /dashboard/parent` - Parent dashboard data
- `GET /dashboard/admin` - Admin analytics and overview

### Schedule & Sessions
- `GET /schedule/student/:id` - Get student schedule
- `GET /schedule/teacher/:id` - Get teacher schedule
- `GET /schedule/class/:id` - Get class schedule
- `GET /sessions` - List all sessions (with filtering)
- `GET /sessions/:id` - Get session details
- `POST /admin/sessions` - Admin: Create custom session
- `POST /teacher/sessions` - Teacher: Create custom session
- `PUT /admin/sessions/:id` - Admin: Update session
- `PUT /teacher/sessions/:id` - Teacher: Update session
- `DELETE /admin/sessions/:id` - Admin: Delete session
- `DELETE /teacher/sessions/:id` - Teacher: Delete session
- `POST /sessions/:id/cancel` - Cancel specific session
- `POST /sessions/:id/reschedule` - Reschedule session
- `GET /sessions/week/:date` - Get sessions for specific week
- `POST /sessions/bulk-cancel` - Cancel multiple sessions in a week

### Attendance Management
- `GET /sessions/:id/attendance` - Get attendance for specific session
- `POST /sessions/:id/attendance` - Mark attendance for session
- `PUT /sessions/:id/attendance/:studentId` - Update student attendance
- `POST /sessions/:id/attendance/bulk` - Mark attendance for multiple students
- `GET /classes/:id/attendance` - Get attendance summary for class
- `GET /students/:id/attendance` - Get student attendance history
- `GET /attendance/reports/class/:classId` - Generate class attendance report
- `GET /attendance/reports/student/:studentId` - Generate student attendance report
- `GET /attendance/reports/teacher/:teacherId` - Generate teacher's class attendance reports

### Parent-Child Management
- `GET /parents/:id/children` - Get parent's children
- `POST /parents/children` - Add child to parent account
- `PUT /parents/children/:id` - Update child information

### Course Materials & Files
- `GET /classes/:id/materials` - Get class materials
- `GET /materials/:id` - Get material details
- `POST /teacher/materials` - Teacher: Create course material
- `PUT /teacher/materials/:id` - Teacher: Update material
- `DELETE /teacher/materials/:id` - Teacher: Delete material
- `POST /materials/:id/publish` - Publish/unpublish material
- `GET /classes/:id/files` - Get class files
- `POST /teacher/upload` - Teacher: Upload file to class
- `DELETE /teacher/files/:id` - Teacher: Delete file
- `GET /classes/:id/folders` - Get class folders
- `POST /teacher/folders` - Teacher: Create folder
- `PUT /teacher/folders/:id` - Teacher: Update folder
- `DELETE /teacher/folders/:id` - Teacher: Delete folder
- `POST /files/:id/move` - Move file to different folder
- `GET /files/search` - Search files by name/tags
- `POST /materials/:id/attachments` - Add attachments to material
- `DELETE /materials/:id/attachments/:fileId` - Remove attachment from material

## Current Mock Implementation Details

### Demo Accounts (for testing)
- **Admin**: admin@education.com / password123
- **Teacher**: jane.teacher@education.com / password123
- **Student**: john.student@education.com / password123
- **Parent**: mary.parent@education.com / password123

### Data Relationships
- Students are linked to parents via `parentId`
- Classes have `teacherId` and `students[]` arrays
- Teachers have `courseIds[]` array
- All entities use numeric IDs for relationships

## Frontend State Management
- User authentication state stored in localStorage
- Mock data functions for data fetching simulation
- Role-based component rendering
- Responsive design with mobile-first approach

## Key Business Logic to Implement
1. **Class Enrollment System** - Students enrolling/unenrolling from classes
2. **Schedule Management** - Weekly class schedules with day/time slots
3. **Progress Tracking** - Student progress in courses
4. **Payment System** - Class pricing and payment tracking
5. **Communication System** - Between teachers, parents, and students
6. **Attendance Tracking** - Session attendance records with status tracking
7. **File Management** - Course materials and assignments
8. **Session Management** - Custom session creation, cancellation, and rescheduling
9. **Course Material System** - Posts, assignments, announcements, and resources
10. **File Upload & Organization** - File uploads, folder management, and file organization
11. **Material Publishing** - Control over when materials are visible to students
12. **Week-specific Session Control** - Ability to modify sessions for specific weeks
13. **Attendance Management** - Mark, track, and report student attendance
14. **Attendance Reports** - Generate comprehensive attendance analytics

## Database Considerations
- **Users table** with role-based access
- **Classes table** with teacher and student relationships
- **Schedules table** for class timing
- **Enrollments table** for student-class relationships
- **Sessions table** for individual class meetings (regular + custom)
- **Progress table** for student advancement tracking
- **CourseMaterials table** for posts, assignments, announcements
- **CourseFiles table** for uploaded files with metadata
- **CourseFolders table** for file organization structure
- **SessionMaterials table** for linking materials to specific sessions
- **FileAttachments table** for linking files to course materials
- **SessionAttendance table** for tracking student attendance

## Security Requirements
- JWT-based authentication
- Role-based authorization
- Input validation and sanitization
- Secure password hashing
- API rate limiting
- CORS configuration
- File upload security (file type validation, size limits)
- Secure file storage and access control
- Role-based file access permissions
- Session validation and security

## File Structure Overview
```
frontend/
├── src/
│   ├── components/
│   │   ├── common/           # Shared components
│   │   ├── layout/           # Layout components
│   │   └── ui/              # UI components (Button, Card, etc.)
│   ├── pages/
│   │   ├── admin/           # Admin-specific pages
│   │   ├── auth/            # Authentication pages
│   │   ├── home/            # Landing page
│   │   ├── parent/          # Parent-specific pages
│   │   ├── student/         # Student-specific pages
│   │   └── teacher/         # Teacher-specific pages
│   ├── data/
│   │   └── mockData.js      # Comprehensive mock data
│   └── routers/
│       └── AppRouter.jsx    # Role-based routing
```

## Notes for Backend Implementation
- This frontend is production-ready with comprehensive mock data
- Can be easily connected to a backend API by replacing mock functions
- All data structures are well-defined in mockData.js
- Role-based access control is already implemented in the frontend
- Responsive design supports mobile and desktop usage
- Uses modern React patterns and hooks for state management

## Detailed Frontend Features

### Session Management Features
- **Regular Sessions**: Automatically generated based on class schedule
- **Custom Sessions**: Teachers and admins can create additional sessions
- **Session Types**: Regular, custom, makeup, and exam sessions
- **Week-specific Control**: Ability to cancel/modify sessions for specific weeks
- **Session Status**: Scheduled, completed, cancelled, rescheduled
- **Location Support**: Room numbers or Zoom meeting links
- **Material Linking**: Sessions can be linked to course materials

### Attendance Management Features
- **Attendance Statuses**: Present, absent, late, not marked
- **Check-in/Check-out**: Track student arrival and departure times
- **Bulk Attendance Marking**: Mark attendance for multiple students at once
- **Attendance Reports**: Comprehensive analytics and reporting
- **Attendance History**: Complete record of student attendance
- **Real-time Tracking**: Live attendance updates during sessions
- **Notification System**: Alerts for attendance issues

### Course Material System
- **Material Types**: Posts, assignments, announcements, and resources
- **Rich Content**: Support for formatted text content
- **File Attachments**: Materials can have multiple file attachments
- **Publishing Control**: Teachers control when materials are visible
- **Due Dates**: Support for assignment deadlines
- **Author Tracking**: All materials track who created them

### File Management System
- **File Upload**: Teachers can upload various file types
- **Folder Organization**: Hierarchical folder structure for files
- **File Metadata**: File size, type, upload date, and tags
- **Search Functionality**: Search files by name, tags, or content
- **Access Control**: Public/private file visibility
- **File Movement**: Move files between folders
- **Bulk Operations**: Support for multiple file operations

### Teacher Dashboard Features
- **Class Overview**: View all classes being taught
- **Session Management**: Create, edit, and cancel sessions
- **Material Creation**: Create and manage course materials
- **File Organization**: Upload and organize class files
- **Student Progress**: Track student performance and attendance
- **Communication**: Send announcements and updates
- **Attendance Management**: Mark and track student attendance
- **Attendance Reports**: Generate attendance analytics for classes

### Admin Dashboard Features
- **User Management**: Create, edit, and manage all users
- **Class Oversight**: Monitor all classes and sessions
- **System Analytics**: Revenue, user growth, and class distribution
- **Session Control**: Override and manage any session
- **Content Moderation**: Oversee course materials and files
- **System Configuration**: Platform settings and policies

### Student Dashboard Features
- **Enrolled Classes**: View all enrolled courses
- **Session Schedule**: See upcoming class sessions
- **Course Materials**: Access published materials and resources
- **Progress Tracking**: Monitor performance in each class
- **File Downloads**: Access class files and resources
- **Attendance History**: View session attendance records
- **Attendance Status**: Check-in/check-out for sessions

### Parent Dashboard Features
- **Child Management**: Overview of all children's accounts
- **Class Schedules**: View children's class schedules
- **Progress Monitoring**: Track children's academic progress
- **Communication**: Receive updates from teachers
- **Payment Tracking**: Monitor class fees and payments
- **File Access**: Access children's course materials
- **Attendance Monitoring**: Track children's attendance records

### Responsive Design Features
- **Mobile-First**: Optimized for mobile devices
- **Tablet Support**: Responsive layouts for tablets
- **Desktop Experience**: Full-featured desktop interface
- **Touch-Friendly**: Optimized for touch interactions
- **Cross-Platform**: Works on all modern browsers
