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

  async getStudentDashboard(studentId: string) {
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

  async getTeacherDashboard(teacherId: string) {
    // Mock data for now - replace with actual database queries
    // This structure matches what the frontend TeacherDashboard expects
    return {
      classes: [
        {
          id: '1',
          name: 'Quran Memorization - Juz 1',
          description: 'Advanced Quran memorization course focusing on Juz 1',
          students: ['student1', 'student2', 'student3', 'student4', 'student5', 'student6', 'student7', 'student8'],
          schedule: [
            { day: 'Sunday', startTime: '4:00 PM', endTime: '6:00 PM' },
            { day: 'Wednesday', startTime: '4:00 PM', endTime: '6:00 PM' }
          ],
          sessionDuration: 120
        },
        {
          id: '2',
          name: 'Arabic Language Basics',
          description: 'Fundamental Arabic language skills for beginners',
          students: ['student9', 'student10', 'student11', 'student12', 'student13', 'student14', 'student15', 'student16'],
          schedule: [
            { day: 'Monday', startTime: '5:00 PM', endTime: '6:30 PM' },
            { day: 'Thursday', startTime: '5:00 PM', endTime: '6:30 PM' }
          ],
          sessionDuration: 90
        },
        {
          id: '3',
          name: 'Islamic Studies - Fiqh',
          description: 'Islamic jurisprudence and religious studies',
          students: ['student17', 'student18', 'student19', 'student20', 'student21', 'student22', 'student23', 'student24'],
          schedule: [
            { day: 'Tuesday', startTime: '6:00 PM', endTime: '7:30 PM' },
            { day: 'Saturday', startTime: '10:00 AM', endTime: '11:30 AM' }
          ],
          sessionDuration: 90
        }
      ],
      students: [
        { id: 'student1', name: 'Ahmad Al-Noor', email: 'ahmad@example.com' },
        { id: 'student2', name: 'Fatima Al-Zahra', email: 'fatima@example.com' },
        { id: 'student3', name: 'Omar Al-Rashid', email: 'omar@example.com' },
        { id: 'student4', name: 'Aisha Al-Mahmoud', email: 'aisha@example.com' },
        { id: 'student5', name: 'Khalid Al-Sabah', email: 'khalid@example.com' },
        { id: 'student6', name: 'Zainab Al-Qadir', email: 'zainab@example.com' },
        { id: 'student7', name: 'Yusuf Al-Hamdan', email: 'yusuf@example.com' },
        { id: 'student8', name: 'Mariam Al-Saadi', email: 'mariam@example.com' }
      ],
      upcomingSessions: [
        {
          id: 'session1',
          className: 'Quran Memorization - Juz 1',
          day: 'Sunday',
          time: '4:00 PM - 6:00 PM',
          studentCount: 8,
          duration: 120
        },
        {
          id: 'session2',
          className: 'Arabic Language Basics',
          day: 'Monday',
          time: '5:00 PM - 6:30 PM',
          studentCount: 8,
          duration: 90
        },
        {
          id: 'session3',
          className: 'Islamic Studies - Fiqh',
          day: 'Tuesday',
          time: '6:00 PM - 7:30 PM',
          studentCount: 8,
          duration: 90
        },
        {
          id: 'session4',
          className: 'Quran Memorization - Juz 1',
          day: 'Wednesday',
          time: '4:00 PM - 6:00 PM',
          studentCount: 8,
          duration: 120
        },
        {
          id: 'session5',
          className: 'Arabic Language Basics',
          day: 'Thursday',
          time: '5:00 PM - 6:30 PM',
          studentCount: 8,
          duration: 90
        }
      ],
      recentActivities: [
        {
          id: 'activity1',
          description: 'Class "Quran Memorization - Juz 1" completed successfully',
          timestamp: '2 hours ago',
          type: 'class_completion'
        },
        {
          id: 'activity2',
          description: 'New student enrolled in "Arabic Language Basics"',
          timestamp: '1 day ago',
          type: 'enrollment'
        },
        {
          id: 'activity3',
          description: 'Updated schedule for "Islamic Studies - Fiqh"',
          timestamp: '2 days ago',
          type: 'schedule_update'
        },
        {
          id: 'activity4',
          description: 'Attendance marked for "Quran Memorization - Juz 1"',
          timestamp: '3 days ago',
          type: 'attendance'
        },
        {
          id: 'activity5',
          description: 'Created new assignment in "Arabic Language Basics"',
          timestamp: '1 week ago',
          type: 'assignment'
        }
      ]
    };
  }

  async getParentDashboard(parentId: string) {
    // Return real data structure for parent dashboard
    // This will be populated with actual database queries
    return {
      children: [],
      classes: [],
      upcomingSessions: [],
      recentActivities: []
    };
  }

  async getAdminDashboard() {
    const totalUsers = await this.userRepository.count();
    const totalTeachers = await this.userRepository.count({ where: { role: Role.Teacher } });
    const totalStudents = await this.userRepository.count({ where: { role: Role.Student } });
    const totalParents = await this.userRepository.count({ where: { role: Role.Parent } });

    return {
      analytics: {
        totalUsers,
        totalTeachers,
        totalStudents,
        totalParents,
        totalClasses: 12,
        activeClasses: 12,
        revenue: 13250,
        monthlyGrowth: 15.2
      },
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
