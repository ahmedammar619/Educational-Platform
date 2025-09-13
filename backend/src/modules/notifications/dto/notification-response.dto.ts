import { NotificationType, NotificationPriority } from '../entities/notification.entity';

export class NotificationResponseDto {
  id: string;
  userId: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  isRead: boolean;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  readAt?: Date;
}
