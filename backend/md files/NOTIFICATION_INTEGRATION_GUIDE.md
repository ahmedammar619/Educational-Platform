# Notification System Integration Guide

## Overview
This document outlines where and how to integrate notification triggers throughout the application.

## ✅ Already Implemented

### Student Notifications
1. **Assignment Published** ✅ - `materials.service.ts` → `createAssignment()`
2. **Assignment Graded** ✅ - `materials.service.ts` → `gradeAssignment()`
3. **Zoom Session Published/Started** ✅ - `zoom.service.ts` → `createMeeting()` / `startMeeting()`
4. **New Post** ✅ - `materials.service.ts` → `createPost()`
5. **Added to Class** ✅ - `classes.service.ts` → `addStudentToClass()`
6. **Marked Absent** ✅ - `materials.service.ts` → `markAttendance()` / `markBulkAttendance()`

### Parent Notifications
1. **Child Absent** ✅ - `materials.service.ts` → `sendAbsentNotification()`
2. **Child Added to Class** ✅ - `classes.service.ts` → `addStudentToClass()`

### Teacher Notifications
1. **Assignment Submitted** ✅ - `materials.service.ts` → `submitAssignment()`
2. **Added to Course** ✅ - `courses.service.ts` → `createCourse()` / `assignTeacherToCourse()`

### Admin Notifications
1. **New User Joined** ✅ - `auth.service.ts` → `register()` / `createUser()`

## 🔧 Integration Points Needed

### 1. Classes Service Integration
**File**: `backend/src/modules/classes/classes.service.ts`

```typescript
// When adding a student to a class
async addStudentToClass(classId: string, studentId: string): Promise<void> {
  // ... existing logic ...
  
  // Send notification to student
  await this.notificationsService.createAddedToClassNotification(
    studentId,
    className,
    { classId, studentId }
  );
  
  // Send notification to parents
  const parents = await this.getParentsOfStudent(studentId);
  for (const parent of parents) {
    await this.notificationsService.createChildAddedToClassNotification(
      parent.id,
      `${student.firstName} ${student.lastName}`,
      className,
      { classId, studentId, childId: studentId }
    );
  }
}
```

### 2. Courses Service Integration
**File**: `backend/src/modules/courses/courses.service.ts`

```typescript
// When assigning a teacher to a course
async assignTeacherToCourse(courseId: string, teacherId: string): Promise<void> {
  // ... existing logic ...
  
  // Send notification to teacher
  await this.notificationsService.createAddedToCourseNotification(
    teacherId,
    course.name,
    course.class.name,
    { courseId, teacherId, classId: course.classId }
  );
}
```

### 3. Auth Service Integration
**File**: `backend/src/modules/auth/auth.service.ts`

```typescript
// When a new user registers
async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
  // ... existing logic ...
  
  // Send notification to admins
  const admins = await this.userRepository.find({ where: { role: Role.Admin } });
  const adminIds = admins.map(admin => admin.id);
  
  await this.notificationsService.createNewUserJoinedNotification(
    adminIds,
    `${user.firstName} ${user.lastName}`,
    user.role,
    { userId: user.id, email: user.email }
  );
}
```

### 4. Zoom Service Integration
**File**: `backend/src/modules/zoom/zoom.service.ts`

```typescript
// When creating a zoom meeting
async createMeeting(createMeetingDto: CreateZoomMeetingDto, userId: string): Promise<ZoomMeeting> {
  // ... existing logic ...
  
  // Get students in the course
  const students = await this.getStudentsInCourse(courseId);
  const studentIds = students.map(student => student.id);
  
  // Send notification to students
  await this.notificationsService.createZoomSessionNotification(
    studentIds,
    meeting.title,
    'published',
    meeting.startTime,
    { meetingId: meeting.id, courseId }
  );
}

// When starting a zoom meeting
async startMeeting(meetingId: string): Promise<ZoomMeeting> {
  // ... existing logic ...
  
  // Get students in the course
  const students = await this.getStudentsInCourse(meeting.courseId);
  const studentIds = students.map(student => student.id);
  
  // Send notification to students
  await this.notificationsService.createZoomSessionNotification(
    studentIds,
    meeting.title,
    'started',
    meeting.startTime,
    { meetingId: meeting.id, courseId: meeting.courseId }
  );
}
```

## 🚨 Absent Check Logic

The absent notification system now includes duplicate prevention:

```typescript
// In materials.service.ts - sendAbsentNotification method
private async sendAbsentNotification(attendance: Attendance, course: Course): Promise<void> {
  // Check if student is actually absent
  if (attendance.status !== 'absent') {
    console.log(`⚠️ Student ${attendance.studentId} is not absent (status: ${attendance.status}) - skipping notification`);
    return;
  }
  
  // Send notification to student
  await this.notificationsService.createAbsentNotification(
    attendance.studentId,
    course.name, // or session title
    false, // isParent = false
    undefined, // childName not needed for student
    { courseId: course.id, attendanceId: attendance.id }
  );
  
  // Send notification to parents
  const parents = await this.getParentsOfStudent(attendance.studentId);
  for (const parent of parents) {
    await this.notificationsService.createAbsentNotification(
      parent.id,
      course.name,
      true, // isParent = true
      `${student.firstName} ${student.lastName}`, // childName
      { courseId: course.id, attendanceId: attendance.id, studentId: attendance.studentId }
    );
  }
}
```

## 📋 Priority Levels

- **URGENT**: Critical system issues
- **HIGH**: Absent notifications, assignment deadlines
- **MEDIUM**: Assignment published/graded, added to class/course
- **LOW**: New posts, new users joined

## 🎨 Frontend Icons

- **Assignment related**: `CheckCircle` (green)
- **Zoom sessions**: `AlertCircle` (blue)
- **Absent notifications**: `AlertTriangle` (red/warning)
- **General info**: `Info` (blue)
- **Default**: `Bell` (gray)

## 🔄 Real-time Updates

All notifications are sent via WebSocket in real-time using the `NotificationsGateway`. The `create()` method in `NotificationsService` automatically triggers WebSocket events.

## 🧪 Testing

To test notifications:

1. **Assignment notifications**: Create an assignment
2. **Grade notifications**: Grade a submitted assignment
3. **Zoom notifications**: Create/start a zoom meeting
4. **Post notifications**: Create a post in a course
5. **Class notifications**: Add a student to a class
6. **Absent notifications**: Mark a student absent
7. **User notifications**: Register a new user

## 📝 Notes

- All notification methods check `DISABLE_NOTIFICATIONS` environment variable
- Duplicate absent notifications are prevented
- Notifications include relevant metadata for context
- Real-time WebSocket updates ensure immediate delivery
- Frontend displays appropriate icons and metadata for each notification type
