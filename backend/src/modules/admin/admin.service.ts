import { Injectable, ConflictException, BadRequestException, NotFoundException, Inject, forwardRef, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { AppConfig } from './entities/app-config.entity';
import { Role } from '../../common/enums/role.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateConfigDto, UpdateGoogleFormUrlDto } from './dto/update-config.dto';
import { EnrollStudentDto, BulkEnrollDto, ChangeCourseDto } from './dto/enroll-student.dto';
import { ConfigService } from './config.service';
import { NotificationsService } from '../notifications/notifications.service';
import { StudentSubscription } from '../payments/entities/student-subscription.entity';
import { SubscriptionPlan } from '../payments/entities/subscription-plan.entity';
import { Course } from '../courses/entities/course.entity';
import { Student } from '../students/entities/student.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AppConfig)
    private readonly configRepository: Repository<AppConfig>,
    @InjectRepository(StudentSubscription)
    private readonly studentSubscriptionRepository: Repository<StudentSubscription>,
    @InjectRepository(SubscriptionPlan)
    private readonly subscriptionPlanRepository: Repository<SubscriptionPlan>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}


  async getRecentUsers(limit: number = 10) {
    const recentUsers = await this.userRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.firstName', 'user.lastName', 'user.email', 'user.role', 'user.createdAt'])
      .orderBy('user.createdAt', 'DESC')
      .limit(limit)
      .getMany();

    return {
      users: recentUsers.map(user => ({
        ...user,
        status: 'active'
      }))
    };
  }

  async createUser(createUserDto: CreateUserDto) {
    const { email, password, role } = createUserDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists with this email');
    }

    // Hash password (optimized: 10 rounds for better performance while maintaining security)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = this.userRepository.create({
      ...createUserDto,
      passwordHash,
      // Set emailVerified to true for admin users created through admin panel
      emailVerified: createUserDto.role === Role.Admin ? true : false,
    });

    const savedUser = await this.userRepository.save(user);

    // Notify all admins about the new user
    try {
      const adminUsers = await this.userRepository.find({
        where: { role: Role.Admin }
      });
      
      if (adminUsers.length > 0) {
        const adminIds = adminUsers.map(admin => admin.id);
        await this.notificationsService.createNewUserJoinedNotification(
          adminIds,
          `${savedUser.firstName} ${savedUser.lastName}`,
          savedUser.role,
          {
            userId: savedUser.id,
            email: savedUser.email
          }
        );
        console.log('✅ New user notification sent to admins');
      }
    } catch (error) {
      console.error('❌ Failed to send new user notification:', error);
    }

    // Remove password hash from response
    const { passwordHash: _, ...userWithoutPassword } = savedUser;
    return {
      message: 'User created successfully',
      user: userWithoutPassword,
    };
  }

  async updateUser(userId: string, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Check if email is being changed and if it already exists
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    // Update user
    Object.assign(user, updateUserDto);
    const updatedUser = await this.userRepository.save(user);

    // Remove password hash from response
    const { passwordHash: _, ...userWithoutPassword } = updatedUser;
    return {
      message: 'User updated successfully',
      user: userWithoutPassword,
    };
  }

  async getAllUsers(page: number = 1, limit: number = 10, filters: any = {}) {
    const { role, search } = filters;
    const offset = (page - 1) * limit;

    let queryBuilder = this.userRepository
      .createQueryBuilder('user');

    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }

    if (search) {
      queryBuilder.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    const [users, total] = await queryBuilder
      .skip(offset)
      .take(limit)
      .orderBy('user.createdAt', 'DESC')
      .getManyAndCount();

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getAllTeachers(page: number = 1, limit: number = 10, search?: string) {
    const offset = (page - 1) * limit;

    let queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .where('user.role = :role', { role: Role.Teacher });

    if (search) {
      queryBuilder.andWhere(
        '(user.firstName ILIKE :search OR user.lastName ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    const [teachers, total] = await queryBuilder
      .skip(offset)
      .take(limit)
      .orderBy('user.createdAt', 'DESC')
      .getManyAndCount();

    return {
      teachers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async deleteUser(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    // Comprehensive cleanup of all user references before deletion
    await this.cleanupUserReferences(userId);
    
    // Delete the user
    await this.userRepository.delete(userId);
    return { message: 'User deleted successfully' };
  }

  private async cleanupUserReferences(userId: string): Promise<void> {
    console.log(`🧹 Admin cleanup: Cleaning up references for user: ${userId}`);
    
    try {
      // Use raw queries to avoid circular dependencies and ensure all references are cleaned up
      
      // 1. Unassign from courses (set teacherId to null)
      await this.userRepository.query(
        'UPDATE courses SET "teacherId" = NULL WHERE "teacherId" = $1',
        [userId]
      );
      
      // 2. Unassign from zoom meetings (set createdById to null)
      await this.userRepository.query(
        'UPDATE zoom_meetings SET "createdById" = NULL WHERE "createdById" = $1',
        [userId]
      );
      
      // 3. Unassign from announcement meetings (set createdById to null)
      await this.userRepository.query(
        'UPDATE announcement_meetings SET "createdById" = NULL WHERE "createdById" = $1',
        [userId]
      );
      
      // 4. Unassign from attendance records (set markedBy to null)
      await this.userRepository.query(
        'UPDATE attendance SET "markedBy" = NULL WHERE "markedBy" = $1',
        [userId]
      );
      
      // 5. Unassign from announcement posts (set authorId to null)
      await this.userRepository.query(
        'UPDATE announcement_posts SET "authorId" = NULL WHERE "authorId" = $1',
        [userId]
      );
      
      // 6. Unassign from files (set uploadedBy to null)
      await this.userRepository.query(
        'UPDATE files SET "uploadedBy" = NULL WHERE "uploadedBy" = $1',
        [userId]
      );
      
      // 7. Unassign from posts (set authorId to null)
      await this.userRepository.query(
        'UPDATE posts SET "authorId" = NULL WHERE "authorId" = $1',
        [userId]
      );
      
      // 8. Unassign from assignments (set createdBy to null)
      await this.userRepository.query(
        'UPDATE assignments SET "createdBy" = NULL WHERE "createdBy" = $1',
        [userId]
      );
      
      // 9. Unassign from folders (set createdBy to null)
      await this.userRepository.query(
        'UPDATE folders SET "createdBy" = NULL WHERE "createdBy" = $1',
        [userId]
      );
      
      // 10. Unassign from assignment submissions (set gradedBy to null)
      await this.userRepository.query(
        'UPDATE assignment_submissions SET "gradedBy" = NULL WHERE "gradedBy" = $1',
        [userId]
      );
      
      // 11. Clean up teacher courses array if user is a teacher
      await this.userRepository.query(
        'UPDATE teachers SET courses = $1 WHERE id = $2',
        [[], userId]
      );
      
      console.log(`✅ Admin cleanup: Successfully cleaned up all references for user: ${userId}`);
    } catch (error) {
      console.error(`❌ Admin cleanup: Error cleaning up references for user ${userId}:`, error);
      throw error;
    }
  }

  // Configuration management methods
  async getConfig(key: string): Promise<string | null> {
    return this.configService.getConfig(key);
  }

  async setConfig(updateConfigDto: UpdateConfigDto): Promise<AppConfig> {
    return this.configService.setConfig(
      updateConfigDto.key,
      updateConfigDto.value,
      updateConfigDto.description
    );
  }

  async getGoogleFormUrl(): Promise<string | null> {
    return this.configService.getGoogleFormUrl();
  }

  async setGoogleFormUrl(updateGoogleFormUrlDto: UpdateGoogleFormUrlDto): Promise<AppConfig> {
    return this.configService.setGoogleFormUrl(updateGoogleFormUrlDto.url);
  }

  async getAllConfigs(): Promise<AppConfig[]> {
    return this.configRepository.find({
      order: { key: 'ASC' }
    });
  }

  // Course Enrollment Management Methods
  async getPendingEnrollments(planId?: string) {
    const queryBuilder = this.studentSubscriptionRepository
      .createQueryBuilder('subscription')
      .leftJoinAndSelect('subscription.student', 'student')
      .leftJoinAndSelect('student.user', 'studentUser')
      .leftJoinAndSelect('subscription.plan', 'plan')
      .leftJoinAndSelect('subscription.user', 'user')
      .where('subscription.isEnrolled = :isEnrolled', { isEnrolled: false })
      .andWhere('subscription.status IN (:...statuses)', {
        statuses: ['active', 'trialing', 'past_due', 'canceled']
      });

    if (planId) {
      queryBuilder.andWhere('subscription.planId = :planId', { planId });
    }

    const subscriptions = await queryBuilder
      .orderBy('subscription.paidAt', 'DESC')
      .getMany();

    this.logger.log(`📋 Found ${subscriptions.length} pending enrollments (not enrolled, with active/trialing/past_due/canceled status)`);

    // Log any that are being filtered
    const allSubs = await this.studentSubscriptionRepository.count();
    const enrolledCount = await this.studentSubscriptionRepository.count({ where: { isEnrolled: true } });
    this.logger.log(`📊 Total subscriptions: ${allSubs}, Enrolled: ${enrolledCount}, Pending: ${subscriptions.length}`);

    return {
      pendingEnrollments: subscriptions.map(sub => ({
        subscriptionId: sub.id,
        studentId: sub.studentId,
        studentName: sub.studentName || (sub.student?.user ? `${sub.student.user.firstName} ${sub.student.user.lastName}` : 'N/A'),
        planId: sub.planId,
        planName: sub.planName,
        planType: sub.plan?.planType || 'one_time',
        amount: sub.amount,
        status: sub.status,
        isPaid: sub.isPaid,
        paidAt: sub.paidAt,
        enrollmentStatus: sub.enrollmentStatus,
        parentEmail: sub.user?.email,
        parentName: `${sub.user?.firstName} ${sub.user?.lastName}`,
      })),
      total: subscriptions.length
    };
  }

  async getEnrolledStudents(planId?: string) {
    const queryBuilder = this.studentSubscriptionRepository
      .createQueryBuilder('subscription')
      .leftJoinAndSelect('subscription.student', 'student')
      .leftJoinAndSelect('student.user', 'studentUser')
      .leftJoinAndSelect('subscription.plan', 'plan')
      .leftJoinAndSelect('subscription.course', 'course')
      .leftJoinAndSelect('subscription.user', 'user')
      .where('subscription.isEnrolled = :isEnrolled', { isEnrolled: true });

    if (planId) {
      queryBuilder.andWhere('subscription.planId = :planId', { planId });
    }

    const subscriptions = await queryBuilder
      .orderBy('subscription.enrolledAt', 'DESC')
      .getMany();

    return {
      enrolledStudents: subscriptions.map(sub => ({
        subscriptionId: sub.id,
        studentId: sub.studentId,
        studentName: sub.studentName || (sub.student?.user ? `${sub.student.user.firstName} ${sub.student.user.lastName}` : 'N/A'),
        planId: sub.planId,
        planName: sub.planName,
        planType: sub.plan?.planType || 'one_time',
        courseId: sub.courseId,
        courseName: sub.course?.name || 'N/A',
        amount: sub.amount,
        isPaid: sub.isPaid,
        status: sub.status,
        enrolledAt: sub.enrolledAt,
        enrollmentStatus: sub.enrollmentStatus,
        parentEmail: sub.user?.email,
        parentName: `${sub.user?.firstName} ${sub.user?.lastName}`,
      })),
      total: subscriptions.length
    };
  }

  async getMissingPayments() {
    // Get subscriptions that are enrolled but not fully paid or have payment issues
    const subscriptions = await this.studentSubscriptionRepository
      .createQueryBuilder('subscription')
      .leftJoinAndSelect('subscription.student', 'student')
      .leftJoinAndSelect('student.user', 'studentUser')
      .leftJoinAndSelect('subscription.plan', 'plan')
      .leftJoinAndSelect('subscription.user', 'user')
      .where('subscription.isEnrolled = :isEnrolled', { isEnrolled: true })
      .andWhere('(subscription.isPaid = :isPaid OR subscription.status IN (:...statuses))', {
        isPaid: false,
        statuses: ['past_due', 'incomplete', 'unpaid', 'incomplete_expired']
      })
      .orderBy('subscription.createdAt', 'DESC')
      .getMany();

    return {
      missingPayments: subscriptions.map(sub => ({
        subscriptionId: sub.id,
        studentId: sub.studentId,
        studentName: sub.studentName || (sub.student?.user ? `${sub.student.user.firstName} ${sub.student.user.lastName}` : 'N/A'),
        planName: sub.planName,
        amount: sub.amount,
        status: sub.status,
        enrolledAt: sub.enrolledAt,
        parentEmail: sub.user?.email,
        parentName: `${sub.user?.firstName} ${sub.user?.lastName}`,
        severity: sub.status === 'past_due' ? 'critical' : sub.status === 'incomplete' ? 'warning' : 'info',
      })),
      total: subscriptions.length
    };
  }

  async getCourseFinancialSummary(planId?: string, startDate?: string, endDate?: string) {
    const queryBuilder = this.studentSubscriptionRepository
      .createQueryBuilder('subscription')
      .leftJoinAndSelect('subscription.plan', 'plan')
      .where('subscription.isPaid = :isPaid', { isPaid: true });

    if (planId) {
      queryBuilder.andWhere('subscription.planId = :planId', { planId });
    }

    if (startDate) {
      queryBuilder.andWhere('subscription.paidAt >= :startDate', { startDate: new Date(startDate) });
    }

    if (endDate) {
      queryBuilder.andWhere('subscription.paidAt <= :endDate', { endDate: new Date(endDate) });
    }

    const subscriptions = await queryBuilder.getMany();

    // Group by plan
    const summaryByPlan = subscriptions.reduce((acc, sub) => {
      const planId = sub.planId;
      if (!acc[planId]) {
        acc[planId] = {
          planId: sub.planId,
          planName: sub.planName,
          totalRevenue: 0,
          totalStudents: 0,
          enrolledStudents: 0,
          pendingEnrollments: 0,
          fullyPaidStudents: 0,
        };
      }

      acc[planId].totalRevenue += Number(sub.amount);
      acc[planId].totalStudents += 1;

      if (sub.isEnrolled) {
        acc[planId].enrolledStudents += 1;
      } else {
        acc[planId].pendingEnrollments += 1;
      }

      if (sub.isPaid) {
        acc[planId].fullyPaidStudents += 1;
      }

      return acc;
    }, {} as Record<string, any>);

    return {
      summary: Object.values(summaryByPlan),
      totalRevenue: subscriptions.reduce((sum, sub) => sum + Number(sub.amount), 0),
      totalStudents: subscriptions.length,
    };
  }

  async enrollStudent(enrollStudentDto: EnrollStudentDto) {
    const { subscriptionId, courseId, notes } = enrollStudentDto;

    // Find the subscription
    const subscription = await this.studentSubscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: ['student', 'plan']
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    // Log payment status but allow enrollment regardless
    if (!subscription.isPaid) {
      this.logger.warn(`⚠️ Enrolling student without payment confirmation - Subscription: ${subscriptionId}, Student: ${subscription.studentName}`);
    }

    if (subscription.isEnrolled) {
      throw new BadRequestException('Student is already enrolled');
    }

    // Find the course
    const course = await this.courseRepository.findOne({
      where: { id: courseId }
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Add student to course students array
    const studentId = subscription.studentId;
    if (!course.students.includes(studentId)) {
      course.students.push(studentId);
      await this.courseRepository.save(course);
    }

    // Update subscription enrollment status
    subscription.isEnrolled = true;
    subscription.enrolledAt = new Date();
    subscription.courseId = courseId;
    subscription.enrollmentStatus = 'enrolled';
    if (notes) {
      subscription.notes = notes;
    }

    await this.studentSubscriptionRepository.save(subscription);

    return {
      message: 'Student enrolled successfully',
      subscription: {
        subscriptionId: subscription.id,
        studentName: subscription.studentName,
        planName: subscription.planName,
        courseName: course.name,
        enrolledAt: subscription.enrolledAt,
      }
    };
  }

  async bulkEnrollStudents(bulkEnrollDto: BulkEnrollDto) {
    const { subscriptionIds, courseId, notes } = bulkEnrollDto;

    // Find the course
    const course = await this.courseRepository.findOne({
      where: { id: courseId }
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Find all subscriptions
    const subscriptions = await this.studentSubscriptionRepository.find({
      where: { id: In(subscriptionIds) },
      relations: ['student', 'plan']
    });

    if (subscriptions.length !== subscriptionIds.length) {
      throw new NotFoundException('Some subscriptions were not found');
    }

    const results = {
      enrolled: [] as any[],
      failed: [] as any[],
    };

    for (const subscription of subscriptions) {
      try {
        // Log payment status but allow enrollment regardless
        if (!subscription.isPaid) {
          this.logger.warn(`⚠️ Bulk enrolling student without payment confirmation - Subscription: ${subscription.id}, Student: ${subscription.studentName}`);
        }

        if (subscription.isEnrolled) {
          results.failed.push({
            subscriptionId: subscription.id,
            studentName: subscription.studentName,
            reason: 'Already enrolled'
          });
          continue;
        }

        // Add student to course
        const studentId = subscription.studentId;
        if (!course.students.includes(studentId)) {
          course.students.push(studentId);
        }

        // Update subscription
        subscription.isEnrolled = true;
        subscription.enrolledAt = new Date();
        subscription.courseId = courseId;
        subscription.enrollmentStatus = 'enrolled';
        if (notes) {
          subscription.notes = notes;
        }

        await this.studentSubscriptionRepository.save(subscription);

        results.enrolled.push({
          subscriptionId: subscription.id,
          studentName: subscription.studentName,
          planName: subscription.planName,
        });
      } catch (error) {
        results.failed.push({
          subscriptionId: subscription.id,
          studentName: subscription.studentName,
          reason: error.message
        });
      }
    }

    // Save course with all new students
    await this.courseRepository.save(course);

    return {
      message: `Enrolled ${results.enrolled.length} students successfully`,
      courseName: course.name,
      enrolled: results.enrolled,
      failed: results.failed,
      total: subscriptions.length,
      successCount: results.enrolled.length,
      failedCount: results.failed.length,
    };
  }

  async changeCourse(changeCourseDto: ChangeCourseDto) {
    const { subscriptionId, courseId, notes } = changeCourseDto;

    // Find the subscription
    const subscription = await this.studentSubscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: ['student', 'course', 'plan']
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (!subscription.isEnrolled) {
      throw new BadRequestException('Student is not enrolled yet');
    }

    // Find the old and new courses
    const oldCourse = subscription.course;
    const newCourse = await this.courseRepository.findOne({
      where: { id: courseId }
    });

    if (!newCourse) {
      throw new NotFoundException('New course not found');
    }

    // Remove student from old course if it exists
    if (oldCourse && oldCourse.students) {
      const studentIndex = oldCourse.students.indexOf(subscription.studentId);
      if (studentIndex > -1) {
        oldCourse.students.splice(studentIndex, 1);
        await this.courseRepository.save(oldCourse);
      }
    }

    // Add student to new course
    if (!newCourse.students) {
      newCourse.students = [];
    }
    if (!newCourse.students.includes(subscription.studentId)) {
      newCourse.students.push(subscription.studentId);
      await this.courseRepository.save(newCourse);
    }

    // Update subscription
    subscription.courseId = courseId;
    if (notes) {
      subscription.notes = notes;
    }

    await this.studentSubscriptionRepository.save(subscription);

    return {
      message: 'Course changed successfully',
      subscription: {
        id: subscription.id,
        studentName: subscription.studentName,
        oldCourse: oldCourse?.name || 'N/A',
        newCourse: newCourse.name,
      }
    };
  }
}