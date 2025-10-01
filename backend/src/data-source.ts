// src/data-source.ts
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

// Entities
import { User } from './modules/users/entities/user.entity';
import { Parent } from './modules/parents/entities/parent.entity';
import { Student } from './modules/students/entities/student.entity';
import { Teacher } from './modules/teachers/entities/teacher.entity';
import { Class } from './modules/classes/entities/class.entity';
import { Course } from './modules/courses/entities/course.entity';

import { Post } from './modules/materials/entities/post.entity';
import { PostAttachment } from './modules/materials/entities/post-attachment.entity';
import { Folder } from './modules/materials/entities/folder.entity';
import { File } from './modules/materials/entities/file.entity';
import { Assignment } from './modules/materials/entities/assignment.entity';
import { AssignmentSubmission } from './modules/materials/entities/assignment-submission.entity';
import { Attendance } from './modules/materials/entities/attendance.entity';
import { WebhookEvent } from './modules/payments/entities/webhook-event.entity';
import { Invoice } from './modules/payments/entities/invoice.entity';
import { Subscription } from './modules/payments/entities/subscription.entity';
import { SubscriptionPlan } from './modules/payments/entities/subscription-plan.entity';
import { StudentSubscription } from './modules/payments/entities/student-subscription.entity';
import { Payment } from './modules/payments/entities/payment.entity';
import { ZoomMeeting } from './modules/zoom/entities/zoom-meeting.entity';
import { AppConfig } from './modules/admin/entities/app-config.entity';
import { Notification } from './modules/notifications/entities/notification.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'education_dev_db',
  synchronize: process.env.NODE_ENV !== 'production' || process.env.DB_SYNC === 'true',
  logging: process.env.DB_LOGGING === 'true',
  entities: [
    User,
    Parent,
    Student,
    Teacher,
    Class,
    Course,
    Post,
    PostAttachment,
    Folder,
    File,
    Assignment,
    AssignmentSubmission,
    Attendance,
    WebhookEvent,
    Invoice,
    Subscription,
    SubscriptionPlan,
    StudentSubscription,
    Payment,
    ZoomMeeting,
    AppConfig,
    Notification
  ],
  migrations: process.env.NODE_ENV === 'production' ? ['dist/migrations/*.js'] : ['src/migrations/*.ts'],
  migrationsRun: process.env.NODE_ENV === 'production' && process.env.DB_SYNC !== 'true',
  subscribers: [],
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  extra: {
    // Connection pool settings
    max: parseInt(process.env.DB_POOL_MAX || '10', 10),
    min: parseInt(process.env.DB_POOL_MIN || '2', 10),
    acquire: 30000,
    idle: 10000,
  },
});
