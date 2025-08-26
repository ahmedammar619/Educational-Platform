import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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
}
