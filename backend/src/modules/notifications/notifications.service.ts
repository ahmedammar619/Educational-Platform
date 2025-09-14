import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, Between } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Notification, NotificationType, NotificationPriority } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { MarkAllReadDto } from './dto/mark-all-read.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  private gateway: any;

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly configService: ConfigService,
  ) {}

  // Set gateway reference (called by the gateway itself)
  setGateway(gateway: any) {
    this.gateway = gateway;
  }

  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    // Check if notifications are disabled
    const notificationsDisabled = this.configService.get<boolean>('DISABLE_NOTIFICATIONS', false);
    if (notificationsDisabled) {
      this.logger.log('Notifications are disabled - skipping notification creation');
      return null;
    }

    const notification = this.notificationRepository.create(createNotificationDto);
    const savedNotification = await this.notificationRepository.save(notification);
    
    this.logger.log(`Created notification ${savedNotification.id} for user ${savedNotification.userId}`);
    
    // Send real-time notification if gateway is available
    try {
      if (this.gateway) {
        await this.gateway.sendNotificationToUser(savedNotification.userId, savedNotification);
        this.logger.log(`Sent real-time notification to user ${savedNotification.userId}`);
      }
    } catch (error) {
      this.logger.warn(`Failed to send real-time notification: ${error.message}`);
    }
    
    return savedNotification;
  }

  async findAll(
    userId: string,
    options?: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
      type?: NotificationType;
      archived?: boolean;
    }
  ): Promise<{ notifications: Notification[]; total: number }> {
    const {
      limit = 20,
      offset = 0,
      unreadOnly = false,
      type,
      archived = false,
    } = options || {};

    console.log('🔍 findAll called with:', { userId, options });

    // Build where conditions
    const whereConditions: any = {
      userId: userId,
      isArchived: archived
    };

    if (unreadOnly) {
      whereConditions.isRead = false;
    }

    if (type) {
      whereConditions.type = type;
    }

    console.log('🔍 Where conditions:', whereConditions);

    // Use simple repository query instead of query builder
    const [notifications, total] = await this.notificationRepository.findAndCount({
      where: whereConditions,
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset
    });

    console.log('🔍 Query result:', { notificationsCount: notifications.length, total });

    return { notifications, total };
  }

  async findOne(id: string, userId: string): Promise<Notification> {
    return this.notificationRepository.findOne({
      where: { id, userId },
    });
  }

  async update(id: string, userId: string, updateNotificationDto: UpdateNotificationDto): Promise<Notification> {
    const notification = await this.findOne(id, userId);
    if (!notification) {
      throw new Error('Notification not found');
    }

    // If marking as read, delete the notification instead of updating it
    if (updateNotificationDto.isRead && !notification.isRead) {
      await this.notificationRepository.remove(notification);
      this.logger.log(`Deleted notification ${id} for user ${userId} after marking as read`);
      return notification; // Return the deleted notification for response
    }

    // For other updates (not marking as read), update normally
    Object.assign(notification, updateNotificationDto);
    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: string, markAllReadDto?: MarkAllReadDto): Promise<{ count: number }> {
    // Delete all unread notifications instead of marking them as read
    const queryBuilder = this.notificationRepository
      .createQueryBuilder()
      .delete()
      .from(Notification)
      .where('userId = :userId', { userId })
      .andWhere('isRead = :isRead', { isRead: false });

    if (markAllReadDto?.type) {
      queryBuilder.andWhere('type = :type', { type: markAllReadDto.type });
    }

    const result = await queryBuilder.execute();
    
    this.logger.log(`Deleted ${result.affected} unread notifications for user ${userId}`);
    return { count: result.affected || 0 };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, isRead: false, isArchived: false },
    });
  }

  async delete(id: string, userId: string): Promise<void> {
    const result = await this.notificationRepository.delete({ id, userId });
    if (result.affected === 0) {
      throw new Error('Notification not found');
    }
  }

  async archive(id: string, userId: string): Promise<Notification> {
    return this.update(id, userId, { isArchived: true });
  }

  // Business logic methods for creating specific notification types
  async createAssignmentPublishedNotification(
    studentIds: string[],
    assignmentTitle: string,
    courseName: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    // Check if notifications are disabled
    const notificationsDisabled = this.configService.get<boolean>('DISABLE_NOTIFICATIONS', false);
    if (notificationsDisabled) {
      this.logger.log('Notifications are disabled - skipping assignment published notifications');
      return;
    }

    console.log('🔔 Creating assignment published notifications:', {
      studentIds,
      assignmentTitle,
      courseName,
      metadata
    });

    const notifications = studentIds.map(studentId => ({
      userId: studentId,
      type: NotificationType.ASSIGNMENT_PUBLISHED,
      priority: NotificationPriority.MEDIUM,
      title: 'New Assignment Published',
      message: `A new assignment "${assignmentTitle}" has been published in ${courseName}`,
      metadata: { assignmentTitle, courseName, ...metadata },
    }));

    console.log('📝 Notifications to create:', notifications);

    try {
      // Create notifications one by one to trigger real-time updates
      const savedNotifications = [];
      for (const notificationData of notifications) {
        const savedNotification = await this.create(notificationData);
        if (savedNotification) {
          savedNotifications.push(savedNotification);
        }
      }
      console.log('✅ Successfully created notifications:', savedNotifications.length);
      this.logger.log(`Created assignment published notifications for ${studentIds.length} students`);
    } catch (error) {
      console.error('❌ Failed to save notifications:', error);
      throw error;
    }
  }

  async createAssignmentGradedNotification(
    studentId: string,
    assignmentTitle: string,
    grade: number,
    courseName: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    // Check if notifications are disabled
    const notificationsDisabled = this.configService.get<boolean>('DISABLE_NOTIFICATIONS', false);
    if (notificationsDisabled) {
      this.logger.log('Notifications are disabled - skipping assignment graded notification');
      return;
    }

    await this.create({
      userId: studentId,
      type: NotificationType.ASSIGNMENT_GRADED,
      priority: NotificationPriority.MEDIUM,
      title: 'Assignment Graded',
      message: `Your assignment "${assignmentTitle}" in ${courseName} has been graded: ${grade}`,
      metadata: { assignmentTitle, grade, courseName, ...metadata },
    });
  }

  async createZoomSessionNotification(
    userIds: string[],
    sessionTitle: string,
    sessionType: 'published' | 'started',
    startTime?: Date,
    metadata?: Record<string, any>
  ): Promise<void> {
    // Check if notifications are disabled
    const notificationsDisabled = this.configService.get<boolean>('DISABLE_NOTIFICATIONS', false);
    if (notificationsDisabled) {
      this.logger.log('Notifications are disabled - skipping zoom session notification');
      return;
    }

    const type = sessionType === 'published' 
      ? NotificationType.ZOOM_SESSION_PUBLISHED 
      : NotificationType.ZOOM_SESSION_STARTED;

    const notifications = userIds.map(userId => ({
      userId,
      type,
      priority: sessionType === 'started' ? NotificationPriority.HIGH : NotificationPriority.MEDIUM,
      title: sessionType === 'published' ? 'New Zoom Session' : 'Zoom Session Started',
      message: sessionType === 'published' 
        ? `A new zoom session "${sessionTitle}" has been scheduled`
        : `The zoom session "${sessionTitle}" has started`,
      metadata: { sessionTitle, startTime, ...metadata },
    }));

    // Create notifications one by one to trigger real-time updates
    for (const notificationData of notifications) {
      await this.create(notificationData);
    }
    this.logger.log(`Created zoom session ${sessionType} notifications for ${userIds.length} users`);
  }

  async createNewPostNotification(
    userIds: string[],
    postTitle: string,
    authorName: string,
    courseName?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    // Check if notifications are disabled
    const notificationsDisabled = this.configService.get<boolean>('DISABLE_NOTIFICATIONS', false);
    if (notificationsDisabled) {
      this.logger.log('Notifications are disabled - skipping new post notification');
      return;
    }

    const notifications = userIds.map(userId => ({
      userId,
      type: NotificationType.NEW_POST,
      priority: NotificationPriority.LOW,
      title: 'New Post',
      message: courseName 
        ? `${authorName} posted "${postTitle}" in ${courseName}`
        : `${authorName} posted "${postTitle}"`,
      metadata: { postTitle, authorName, courseName, ...metadata },
    }));

    // Create notifications one by one to trigger real-time updates
    for (const notificationData of notifications) {
      await this.create(notificationData);
    }
    this.logger.log(`Created new post notifications for ${userIds.length} users`);
  }

  async createAddedToClassNotification(
    userId: string,
    className: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    // Check if notifications are disabled
    const notificationsDisabled = this.configService.get<boolean>('DISABLE_NOTIFICATIONS', false);
    if (notificationsDisabled) {
      this.logger.log('Notifications are disabled - skipping added to class notification');
      return;
    }

    await this.create({
      userId,
      type: NotificationType.ADDED_TO_CLASS,
      priority: NotificationPriority.MEDIUM,
      title: 'Added to Class',
      message: `You have been added to the class "${className}"`,
      metadata: { className, ...metadata },
    });
  }

  async createAbsentNotification(
    userId: string,
    sessionTitle: string,
    isParent: boolean = false,
    childName?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    // Check if notifications are disabled
    const notificationsDisabled = this.configService.get<boolean>('DISABLE_NOTIFICATIONS', false);
    if (notificationsDisabled) {
      this.logger.log('Notifications are disabled - skipping absent notification');
      return;
    }

    // Check if user already has an absent notification for this session
    // Use raw query to properly compare JSON metadata
    const existingAbsentNotification = await this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId })
      .andWhere('notification.type = :type', { 
        type: isParent ? NotificationType.CHILD_ABSENT : NotificationType.MARKED_ABSENT 
      })
      .andWhere('notification.metadata->>:sessionTitleKey = :sessionTitle', { 
        sessionTitleKey: 'sessionTitle',
        sessionTitle: metadata?.sessionTitle || sessionTitle 
      })
      .andWhere('notification.metadata->>:meetingIdKey = :meetingId', { 
        meetingIdKey: 'meetingId',
        meetingId: metadata?.meetingId 
      })
      .getOne();

    if (existingAbsentNotification) {
      console.log(`⚠️ User ${userId} already has an absent notification for session "${sessionTitle}" - skipping duplicate notification`);
      return;
    }

    const type = isParent ? NotificationType.CHILD_ABSENT : NotificationType.MARKED_ABSENT;
    const title = isParent ? 'Child Absent' : 'Marked Absent';
    const message = isParent 
      ? `Your child ${childName} was marked absent for the session "${sessionTitle}"`
      : `You were marked absent for the session "${sessionTitle}"`;

    await this.create({
      userId,
      type,
      priority: NotificationPriority.HIGH,
      title,
      message,
      metadata: { sessionTitle, childName, ...metadata },
    });
  }

  async createAssignmentSubmittedNotification(
    teacherId: string,
    studentName: string,
    assignmentTitle: string,
    courseName: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    // Check if notifications are disabled
    const notificationsDisabled = this.configService.get<boolean>('DISABLE_NOTIFICATIONS', false);
    if (notificationsDisabled) {
      this.logger.log('Notifications are disabled - skipping assignment submitted notification');
      return;
    }

    await this.create({
      userId: teacherId,
      type: NotificationType.ASSIGNMENT_SUBMITTED,
      priority: NotificationPriority.MEDIUM,
      title: 'Assignment Submitted',
      message: `${studentName} submitted the assignment "${assignmentTitle}" in ${courseName}`,
      metadata: { studentName, assignmentTitle, courseName, ...metadata },
    });
  }

  async createNewUserJoinedNotification(
    adminIds: string[],
    userName: string,
    userRole: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    // Check if notifications are disabled
    const notificationsDisabled = this.configService.get<boolean>('DISABLE_NOTIFICATIONS', false);
    if (notificationsDisabled) {
      this.logger.log('Notifications are disabled - skipping new user joined notification');
      return;
    }

    const notifications = adminIds.map(adminId => ({
      userId: adminId,
      type: NotificationType.NEW_USER_JOINED,
      priority: NotificationPriority.LOW,
      title: 'New User Joined',
      message: `A new ${userRole} "${userName}" has joined the platform`,
      metadata: { userName, userRole, ...metadata },
    }));

    // Create notifications one by one to trigger real-time updates
    for (const notificationData of notifications) {
      await this.create(notificationData);
    }
    this.logger.log(`Created new user joined notifications for ${adminIds.length} admins`);
  }

  async createChildAddedToClassNotification(
    parentId: string,
    childName: string,
    className: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    // Check if notifications are disabled
    const notificationsDisabled = this.configService.get<boolean>('DISABLE_NOTIFICATIONS', false);
    if (notificationsDisabled) {
      this.logger.log('Notifications are disabled - skipping child added to class notification');
      return;
    }

    await this.create({
      userId: parentId,
      type: NotificationType.CHILD_ADDED_TO_CLASS,
      priority: NotificationPriority.MEDIUM,
      title: 'Child Added to Class',
      message: `Your child ${childName} has been added to the class "${className}"`,
      metadata: { childName, className, ...metadata },
    });
  }

  async createAddedToCourseNotification(
    teacherId: string,
    courseName: string,
    className: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    // Check if notifications are disabled
    const notificationsDisabled = this.configService.get<boolean>('DISABLE_NOTIFICATIONS', false);
    if (notificationsDisabled) {
      this.logger.log('Notifications are disabled - skipping added to course notification');
      return;
    }

    await this.create({
      userId: teacherId,
      type: NotificationType.ADDED_TO_COURSE,
      priority: NotificationPriority.MEDIUM,
      title: 'Added to Course',
      message: `You have been added as a teacher to the course "${courseName}" in class "${className}"`,
      metadata: { courseName, className, ...metadata },
    });
  }

  // Cleanup method for old notifications
  async cleanupOldNotifications(daysOld: number = 30): Promise<{ count: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.notificationRepository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoffDate', { cutoffDate })
      .andWhere('isArchived = :archived', { archived: true })
      .execute();

    this.logger.log(`Cleaned up ${result.affected} old notifications`);
    return { count: result.affected || 0 };
  }
}
