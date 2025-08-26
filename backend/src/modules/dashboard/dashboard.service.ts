import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Role } from '../../common/enums/role.enum';
import { Parent } from '../parents/entities/parent.entity';
import { Student } from '../students/entities/student.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Parent)
    private readonly parentRepository: Repository<Parent>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
  ) {}

  async getTeacherDashboard(teacherId: string) {
    // Basic teacher dashboard data
    return {
      profile: {
        id: teacherId,
        role: 'teacher'
      },
      stats: {
        totalUsers: await this.userRepository.count(),
        totalTeachers: await this.userRepository.count({ where: { role: Role.Teacher } })
      }
    };
  }

  async getAdminDashboard() {
    const totalUsers = await this.userRepository.count();
    const totalTeachers = await this.userRepository.count({ where: { role: Role.Teacher } });

    return {
      analytics: {
        totalUsers,
        totalTeachers,
        timestamp: new Date().toISOString()
      }
    };
  }

  async getAnalytics(period: string) {
    const totalUsers = await this.userRepository.count();
    const totalTeachers = await this.userRepository.count({ where: { role: Role.Teacher } });

    return {
      period,
      userStats: {
        total: totalUsers,
        teachers: totalTeachers,
        admins: totalUsers - totalTeachers
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
        profile: { id: studentId, role: 'student' },
        stats: { totalClasses: 0, totalSessions: 0, attendanceRate: 0 },
        upcomingClasses: [],
        recentGrades: []
      };
    }

    // Get student data (placeholder for now)
    return {
      profile: {
        id: student.id,
        firstName: student.user.firstName,
        lastName: student.user.lastName,
        email: student.user.email,
        role: 'student',
        birthdate: student.birthDate, // Include birthdate from student entity
        age: student.age, // Use the age getter from student entity
        createdAt: student.user.createdAt // Include createdAt for join date
      },
      stats: {
        totalClasses: 0, // Will be calculated when enrollments are implemented
        totalSessions: 0, // Will be calculated when attendance is implemented
        attendanceRate: 0 // Will be calculated when attendance is implemented
      },
      upcomingClasses: [], // Will be populated when classes are implemented
      recentGrades: [] // Will be populated when grades are implemented
    };
  }
}
