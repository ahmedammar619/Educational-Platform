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
      children: transformedChildren,
      stats: {
        totalChildren,
        totalClasses,
        totalSessions
      }
    };
  }
}
