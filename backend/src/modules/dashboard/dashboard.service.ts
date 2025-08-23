import { Injectable, NotFoundException } from '@nestjs/common';
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

  async getStudentDashboard(studentId: number) {
    // Mock data for now - replace with actual database queries
    return {
      enrolledClasses: 2,
      completedSessions: 18,
      upcomingSessions: 6,
      overallProgress: 85,
      attendance: 94,
      classProgress: [
        {
          class: 'Quran Memorization - Juz 1',
          progress: 85,
          grade: 'A',
          teacher: 'Sheikh Abdullah Al-Mahmoud'
        },
        {
          class: 'Arabic Language Basics',
          progress: 88,
          grade: 'A-',
          teacher: 'Ustadha Aisha Al-Zahra'
        }
      ],
      upcomingEvents: [
        {
          title: 'Quran Memorization - Juz 1',
          date: '2025-02-16',
          time: '4:00 PM',
          type: 'class'
        }
      ]
    };
  }

  async getTeacherDashboard(teacherId: number) {
    // Mock data for now - replace with actual database queries
    return {
      totalClasses: 3,
      totalStudents: 24,
      upcomingSessions: 8,
      pendingGrading: 5,
      recentAnnouncements: [
        {
          id: 1,
          title: 'Class Schedule Update',
          content: 'Next week\'s schedule has been updated',
          date: '2025-02-15'
        }
      ],
      classOverview: [
        {
          id: 1,
          name: 'Quran Memorization - Juz 1',
          students: 8,
          nextSession: '2025-02-16 16:00'
        }
      ]
    };
  }

  async getParentDashboard(parentId: number) {
    // Mock data for now - replace with actual database queries
    return {
      totalChildren: 2,
      totalClasses: 6,
      totalSessions: 48,
      totalCost: 2400,
      children: [
        {
          id: 1,
          name: 'Ahmad Al-Noor',
          classes: 3,
          progress: 85
        },
        {
          id: 2,
          name: 'Fatima Al-Zahra',
          classes: 3,
          progress: 92
        }
      ],
      upcomingClasses: [
        {
          title: 'Quran Memorization - Juz 1',
          childName: 'Ahmad Al-Noor',
          date: '2025-02-16',
          time: '4:00 PM'
        }
      ]
    };
  }

  async getAdminDashboard() {
    const totalUsers = await this.userRepository.count();
    const totalTeachers = await this.userRepository.count({ where: { role: Role.Teacher } });
    const totalStudents = await this.userRepository.count({ where: { role: Role.Student } });
    const totalParents = await this.userRepository.count({ where: { role: Role.Parent } });

    return {
      totalUsers,
      totalTeachers,
      totalStudents,
      totalParents,
      totalClasses: 12,
      activeClasses: 12,
      revenue: 13250,
      monthlyGrowth: 15.2,
      userGrowthData: [
        { month: 'Sep', users: 8 },
        { month: 'Oct', users: 12 },
        { month: 'Nov', users: 14 },
        { month: 'Dec', users: 15 },
        { month: 'Jan', users: 15 },
        { month: 'Feb', users: totalUsers }
      ],
      recentActivity: [
        {
          type: 'user_registration',
          description: 'New student registered',
          timestamp: new Date()
        }
      ]
    };
  }

  async getAnalytics(period: string) {
    // Mock analytics data - replace with actual database queries
    return {
      period,
      userGrowth: {
        students: 15,
        teachers: 8,
        parents: 12
      },
      classPerformance: {
        averageAttendance: 87,
        totalSessions: 156,
        completedClasses: 8
      },
      revenue: {
        total: 15600,
        monthly: 3200,
        growth: 12.5
      }
    };
  }
}
