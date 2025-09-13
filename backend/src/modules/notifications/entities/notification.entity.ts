import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum NotificationType {
  // Student notifications
  ASSIGNMENT_PUBLISHED = 'assignment_published',
  ASSIGNMENT_GRADED = 'assignment_graded',
  ZOOM_SESSION_PUBLISHED = 'zoom_session_published',
  ZOOM_SESSION_STARTED = 'zoom_session_started',
  NEW_POST = 'new_post',
  ADDED_TO_CLASS = 'added_to_class',
  MARKED_ABSENT = 'marked_absent',

  // Parent notifications
  CHILD_ABSENT = 'child_absent',
  CHILD_ADDED_TO_CLASS = 'child_added_to_class',

  // Teacher notifications
  ASSIGNMENT_SUBMITTED = 'assignment_submitted',
  ADDED_TO_COURSE = 'added_to_course',

  // Admin notifications
  NEW_USER_JOINED = 'new_user_joined',
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({
    type: 'enum',
    enum: NotificationPriority,
    default: NotificationPriority.MEDIUM,
  })
  priority: NotificationPriority;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @Column({ default: false })
  isRead: boolean;

  @Column({ default: false })
  isArchived: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  readAt: Date;

  // Relationships
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
