import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not, IsNull } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Role } from '../../common/enums/role.enum';
import { Parent } from '../parents/entities/parent.entity';
import { Student } from '../students/entities/student.entity';
import { Class } from '../classes/entities/class.entity';
import { Course } from '../courses/entities/course.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { ZoomMeeting } from '../zoom/entities/zoom-meeting.entity';
import { AssignmentSubmission } from '../materials/entities/assignment-submission.entity';
import { Attendance } from '../materials/entities/attendance.entity';
import { Assignment } from '../materials/entities/assignment.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Parent)
    private readonly parentRepository: Repository<Parent>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    @InjectRepository(ZoomMeeting)
    private readonly zoomMeetingRepository: Repository<ZoomMeeting>,
    @InjectRepository(AssignmentSubmission)
    private readonly assignmentSubmissionRepository: Repository<AssignmentSubmission>,
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    @InjectRepository(Assignment)
    private readonly assignmentRepository: Repository<Assignment>,
  ) {}

  async getTeacherDashboard(teacherId: string) {
    // Get teacher user data
    const teacher = await this.userRepository.findOne({
      where: { id: teacherId },
      select: ['id', 'firstName', 'lastName', 'email', 'phone', 'createdAt']
    });

    // Get teacher's courses
    const teacherCourses = await this.courseRepository.find({
      where: { teacherId: teacherId },
      relations: ['class']
    });

    // Get total students in teacher's classes
    let totalStudents = 0;
    for (const course of teacherCourses) {
      if (course.class) {
        const studentCount = await this.classRepository
          .createQueryBuilder('class')
          .leftJoin('class.students', 'student')
          .where('class.id = :classId', { classId: course.class.id })
          .getCount();
        totalStudents += studentCount;
      }
    }

    // Get total classes the teacher teaches
    const totalClasses = teacherCourses.length;

    // Get upcoming sessions (next 2 sessions from courses)
    const today = new Date();
    const upcomingSessions = [];
    
    for (const course of teacherCourses) {
      if (course.sessions && course.sessions.length > 0) {
        // Sort sessions by day and time
        const sortedSessions = course.sessions.sort((a, b) => {
          const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
          const dayA = dayOrder.indexOf(a.day);
          const dayB = dayOrder.indexOf(b.day);
          if (dayA !== dayB) return dayA - dayB;
          return a.startTime.localeCompare(b.startTime);
        });

        // Add course info to sessions
        const courseSessions = sortedSessions.slice(0, 2).map(session => ({
          id: `${course.id}-${session.day}`,
          title: `${course.name} - ${session.day}`,
          course_title: course.name,
          day: session.day,
          time: `${session.startTime} - ${session.endTime}`,
          scheduled_start: today.toISOString(),
          zoom_meeting_id: null,
          zoom_join_url: null
        }));

        upcomingSessions.push(...courseSessions);
      }
    }

    // Sort all sessions and take the first 2
    const nearestSessions = upcomingSessions
      .sort((a, b) => {
        const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const dayA = dayOrder.indexOf(a.day);
        const dayB = dayOrder.indexOf(b.day);
        if (dayA !== dayB) return dayA - dayB;
        return a.time.localeCompare(b.time);
      })
      .slice(0, 2);

    return {
      profile: {
        id: teacherId,
        firstName: teacher?.firstName,
        lastName: teacher?.lastName,
        email: teacher?.email,
        phone: teacher?.phone,
        role: 'teacher',
        joinDate: teacher?.createdAt ? new Date(teacher.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : 'Jan 2024'
      },
      stats: {
        myCourses: totalClasses,
        totalStudents: totalStudents,
        upcomingSessions: nearestSessions.length,
        totalClasses: totalClasses
      },
      courses: teacherCourses.map(course => ({
        id: course.id,
        name: course.name,
        classId: course.classId,
        students: course.class ? course.class.students || [] : [],
        sessions: course.sessions || []
      })),
      upcomingSessions: nearestSessions
    };
  }

  async getAdminDashboard() {
    const totalUsers = await this.userRepository.count();
    const totalTeachers = await this.userRepository.count({ where: { role: Role.Teacher } });
    const totalStudents = await this.userRepository.count({ where: { role: Role.Student } });
    const totalParents = await this.userRepository.count({ where: { role: Role.Parent } });
    const totalAdmins = await this.userRepository.count({ where: { role: Role.Admin } });
    const totalClasses = await this.classRepository.count();

    return {
      analytics: {
        totalUsers,
        totalTeachers,
        totalStudents,
        totalParents,
        totalAdmins,
        totalClasses,
        timestamp: new Date().toISOString()
      }
    };
  }

  async getAnalytics(period: string) {
    const totalUsers = await this.userRepository.count();
    const totalTeachers = await this.userRepository.count({ where: { role: Role.Teacher } });
    const totalStudents = await this.userRepository.count({ where: { role: Role.Student } });
    const totalParents = await this.userRepository.count({ where: { role: Role.Parent } });
    const totalAdmins = await this.userRepository.count({ where: { role: Role.Admin } });
    const totalClasses = await this.classRepository.count();

    return {
      period,
      userStats: {
        total: totalUsers,
        teachers: totalTeachers,
        students: totalStudents,
        parents: totalParents,
        admins: totalAdmins,
        classes: totalClasses
      }
    };
  }

  async getParentDashboard(parentId: string) {
    // Get children data
    const children = await this.studentRepository.find({
      where: { parentId: parentId },
      relations: ['user']
    });

    // Get parent user data to include createdAt
    const parentUser = await this.userRepository.findOne({
      where: { id: parentId },
      select: ['id', 'firstName', 'lastName', 'email', 'createdAt']
    });

    // Transform children data for the dashboard
    const transformedChildren = children.map(child => ({
      id: child.id,
      firstName: child.user.firstName,
      lastName: child.user.lastName,
      email: child.user.email,
      enrolledClasses: [] // Empty for now - will be implemented later
    }));

    // Calculate totals
    const totalChildren = children.length;
    const totalClasses = 0; // Will be calculated when enrollments are implemented
    const totalSessions = 0; // Will be calculated when enrollments are implemented

    return {
      parent: parentUser,
      children: transformedChildren,
      stats: {
        totalChildren,
        totalClasses,
        totalSessions
      }
    };
  }

  async getStudentDashboard(studentId: string) {
    // Get student information
    const student = await this.studentRepository.findOne({
      where: { id: studentId },
      relations: ['user']
    });

    if (!student) {
      return {
        profile: { 
          id: studentId, 
          role: 'student',
          firstName: 'Unknown',
          lastName: 'Student',
          email: 'unknown@example.com'
        },
        stats: { totalClasses: 0, totalSessions: 0, attendanceRate: 0, averageProgress: 0, averageGrade: 0 },
        enrolledCourses: [],
        upcomingClasses: [],
        recentGrades: [],
        classInfo: null
      };
    }

    // Get the class the student is enrolled in
    const studentClass = await this.classRepository.findOne({
      where: { id: student.classId },
      relations: ['courses']
    });

    // Get enrolled courses with teacher information
    let enrolledCourses = [];
    if (studentClass) {
      // Fetch courses with teacher details
      const coursesWithTeachers = await this.courseRepository.find({
        where: { classId: studentClass.id },
        relations: ['teacher']
      });

      enrolledCourses = coursesWithTeachers.map(course => ({
        id: course.id,
        name: course.name,
        teacher: {
          id: course.teacherId,
          name: course.teacher ? `${course.teacher.firstName} ${course.teacher.lastName}` : 'Unknown Teacher',
          firstName: course.teacher?.firstName,
          lastName: course.teacher?.lastName
        },
        sessions: course.sessions,
        classId: course.classId
      }));
    }

    // Calculate stats
    const totalClasses = enrolledCourses.length;
    const totalSessions = enrolledCourses.reduce((total, course) => 
      total + (course.sessions?.length || 0), 0
    );

    // Calculate attendance rate from attendance records
    const attendanceRate = await this.calculateAttendanceRate(studentId);

    // Calculate average progress from assignments
    const averageProgress = await this.calculateAverageProgress(studentId);

    // Calculate average grade from assignment submissions
    const averageGrade = await this.calculateAverageGrade(studentId);

    // Get recent grades from assignment submissions
    const recentGrades = await this.getRecentGrades(studentId);

    // Get student data
    return {
      profile: {
        id: student.id,
        firstName: student.user.firstName,
        lastName: student.user.lastName,
        email: student.user.email,
        role: 'student',
        birthdate: student.birthDate,
        age: student.age,
        createdAt: student.user.createdAt,
        parentId: student.parentId, // Include parentId to determine student type
        classId: student.classId // Include classId for progress calculation
      },
      stats: {
        totalClasses,
        totalSessions,
        attendanceRate,
        averageProgress,
        averageGrade
      },
      enrolledCourses,
      upcomingClasses: [], // Will be populated when classes are implemented
      recentGrades,
      classInfo: studentClass ? {
        id: studentClass.id,
        name: studentClass.name,
        startDate: studentClass.startDate,
        endDate: studentClass.endDate
      } : null
    };
  }

  private async calculateAttendanceRate(studentId: string): Promise<number> {
    // Get all attendance records for this student
    const attendanceRecords = await this.attendanceRepository.find({
      where: { studentId }
    });

    if (attendanceRecords.length === 0) {
      return 0;
    }

    // Calculate attendance rate based on present vs total sessions
    const presentCount = attendanceRecords.filter(record => 
      record.status === 'present'
    ).length;

    const totalCount = attendanceRecords.length;
    return Math.round((presentCount / totalCount) * 100);
  }

  private async calculateAverageProgress(studentId: string): Promise<number> {
    // Get student information
    const student = await this.studentRepository.findOne({
      where: { id: studentId }
    });

    if (!student || !student.classId) {
      return 0;
    }

    // Get the student's class with start and end dates
    const studentClass = await this.classRepository.findOne({
      where: { id: student.classId }
    });

    if (!studentClass) {
      return 0;
    }

    // Get all courses for this class
    const courses = await this.courseRepository.find({
      where: { classId: student.classId }
    });

    if (courses.length === 0) {
      return 0;
    }

    const today = new Date();
    let totalProgress = 0;
    let totalCourses = 0;

    for (const course of courses) {
      if (course.sessions && course.sessions.length > 0) {
        // Calculate total sessions for this course from start to end date
        const totalSessions = this.calculateTotalSessionsForCourse(
          course.sessions,
          studentClass.startDate,
          studentClass.endDate
        );

        // Calculate completed sessions up to today
        const completedSessions = this.calculateCompletedSessionsUpToDate(
          course.sessions,
          studentClass.startDate,
          today
        );

        if (totalSessions > 0) {
          const courseProgress = Math.round((completedSessions / totalSessions) * 100);
          totalProgress += courseProgress;
          totalCourses++;
        }
      }
    }

    return totalCourses > 0 ? Math.round(totalProgress / totalCourses) : 0;
  }

  private calculateTotalSessionsForCourse(
    sessions: any[],
    startDate: Date,
    endDate: Date
  ): number {
    if (!sessions || sessions.length === 0) {
      return 0;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    let totalSessions = 0;

    // Create a map of day names to their numeric values (0 = Sunday, 1 = Monday, etc.)
    const dayMap = {
      'Sunday': 0,
      'Monday': 1,
      'Tuesday': 2,
      'Wednesday': 3,
      'Thursday': 4,
      'Friday': 5,
      'Saturday': 6
    };

    // For each session day, calculate how many times it occurs between start and end date
    for (const session of sessions) {
      const dayOfWeek = dayMap[session.day];
      if (dayOfWeek !== undefined) {
        let currentDate = new Date(start);
        
        // Find the first occurrence of this day of week
        while (currentDate.getDay() !== dayOfWeek) {
          currentDate.setDate(currentDate.getDate() + 1);
        }

        // Count all occurrences of this day between start and end date
        while (currentDate <= end) {
          totalSessions++;
          currentDate.setDate(currentDate.getDate() + 7); // Move to next week
        }
      }
    }

    return totalSessions;
  }

  private calculateCompletedSessionsUpToDate(
    sessions: any[],
    startDate: Date,
    targetDate: Date
  ): number {
    if (!sessions || sessions.length === 0) {
      return 0;
    }

    const start = new Date(startDate);
    const target = new Date(targetDate);
    let completedSessions = 0;

    // Create a map of day names to their numeric values
    const dayMap = {
      'Sunday': 0,
      'Monday': 1,
      'Tuesday': 2,
      'Wednesday': 3,
      'Thursday': 4,
      'Friday': 5,
      'Saturday': 6
    };

    // For each session day, calculate how many times it occurred up to target date
    for (const session of sessions) {
      const dayOfWeek = dayMap[session.day];
      if (dayOfWeek !== undefined) {
        let currentDate = new Date(start);
        
        // Find the first occurrence of this day of week
        while (currentDate.getDay() !== dayOfWeek) {
          currentDate.setDate(currentDate.getDate() + 1);
        }

        // Count all occurrences of this day up to target date
        while (currentDate <= target) {
          completedSessions++;
          currentDate.setDate(currentDate.getDate() + 7); // Move to next week
        }
      }
    }

    return completedSessions;
  }

  private async calculateAverageGrade(studentId: string): Promise<number> {
    // Get all graded submissions for this student
    const gradedSubmissions = await this.assignmentSubmissionRepository.find({
      where: { 
        studentId,
        grade: Not(IsNull()) // Only submissions that have been graded
      }
    });

    if (gradedSubmissions.length === 0) {
      return 0;
    }

    // Calculate average grade
    const totalGrade = gradedSubmissions.reduce((sum, submission) => {
      return sum + (submission.grade || 0);
    }, 0);

    return Math.round(totalGrade / gradedSubmissions.length);
  }

  private async getRecentGrades(studentId: string): Promise<any[]> {
    // Get recent graded submissions with assignment details
    const recentSubmissions = await this.assignmentSubmissionRepository.find({
      where: { 
        studentId,
        grade: Not(IsNull())
      },
      relations: ['assignment'],
      order: { gradedAt: 'DESC' },
      take: 10
    });

    return recentSubmissions.map(submission => ({
      id: submission.id,
      assignment_title: submission.assignment?.name || 'Unknown Assignment',
      course_title: 'Unknown Course', // Would need to get from assignment's course
      grade: submission.grade,
      max_points: submission.assignment?.marks || 100,
      feedback: submission.feedback,
      graded_by: submission.gradedBy,
      graded_at: submission.gradedAt,
      assignment_type: 'Assignment'
    }));
  }

  private async getCourseIdsForClass(classId: string): Promise<string[]> {
    const courses = await this.courseRepository.find({
      where: { classId },
      select: ['id']
    });
    return courses.map(course => course.id);
  }
}
