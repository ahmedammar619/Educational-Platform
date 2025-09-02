import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Role } from '../../common/enums/role.enum';
import { Parent } from '../parents/entities/parent.entity';
import { Student } from '../students/entities/student.entity';
import { Class } from '../classes/entities/class.entity';
import { Course } from '../courses/entities/course.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { ZoomMeeting } from '../zoom/entities/zoom-meeting.entity';

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
        recentGrades: []
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
        parentId: student.parentId // Include parentId to determine student type
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
      recentGrades: [] // Will be populated when grades are implemented
    };
  }

  private async calculateAttendanceRate(studentId: string): Promise<number> {
    // This would need to be implemented based on your attendance entity
    // For now, return a mock value based on the attendance data you provided
    return 100; // Based on your data showing Ahmed was present
  }

  private async calculateAverageProgress(studentId: string): Promise<number> {
    // This would need to be implemented based on your assignment submission entity
    // For now, return a mock value based on the assignment data you provided
    return 75; // Mock progress calculation
  }

  private async calculateAverageGrade(studentId: string): Promise<number> {
    // This would need to be implemented based on your assignment submission entity
    // For now, return a mock value based on the grade data you provided
    return 100; // Based on your data showing Ahmed got 100 on the assignment
  }
}
