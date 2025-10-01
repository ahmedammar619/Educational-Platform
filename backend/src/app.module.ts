import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { AppController } from './app.controller';
import { AppService } from './app.service';

// Configuration
import { rateLimitConfig, getCurrentEnvironmentLimits } from './config/rate-limit.config';

// Common modules
import { CommonModule } from './common/common.module';

// Feature modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AdminModule } from './modules/admin/admin.module';
import { TeachersModule } from './modules/teachers/teachers.module';
import { ParentsModule } from './modules/parents/parents.module';
import { StudentsModule } from './modules/students/students.module';
import { ClassesModule } from './modules/classes/classes.module';
import { CoursesModule } from './modules/courses/courses.module';
import { MaterialsModule } from './modules/materials/materials.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ZoomModule } from './modules/zoom/zoom.module';
import { AnnouncementsModule } from './modules/announcements/announcements.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

// Guards and Interceptors
import { CustomThrottlerGuard } from './common/guards/custom-throttler.guard';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { RateLimitInterceptor } from './common/interceptors/rate-limit.interceptor';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { EmailVerificationGuard } from './common/guards/email-verification.guard';

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
import { AnnouncementPost } from './modules/announcements/entities/announcement-post.entity';
import { AnnouncementPostAttachment } from './modules/announcements/entities/announcement-post-attachment.entity';
import { AnnouncementMeeting } from './modules/announcements/entities/announcement-meeting.entity';
import { Notification } from './modules/notifications/entities/notification.entity';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local', '.env.development'],
      cache: true,
    }),

    // Database
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_DATABASE || 'education_dev_db',
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
          AnnouncementPost,
          AnnouncementPostAttachment,
          AnnouncementMeeting,
          Notification
        ],
        synchronize: process.env.NODE_ENV !== 'production' || process.env.DB_SYNC === 'true',
        migrationsRun: process.env.NODE_ENV === 'production' && process.env.DB_SYNC !== 'true',
        migrations: process.env.NODE_ENV === 'production' ? ['dist/migrations/*.js'] : [],
        logging: process.env.DB_LOGGING === 'true',
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        extra: {
          // Connection pool settings
          max: parseInt(process.env.DB_POOL_MAX || '10', 10),
          min: parseInt(process.env.DB_POOL_MIN || '2', 10),
          acquire: 30000,
          idle: 10000,
        },
      }),
    }),

    // Rate Limiting - More generous limits for development
    ThrottlerModule.forRoot(getCurrentEnvironmentLimits()),

    // Feature modules
    CommonModule,
    AuthModule,
    UsersModule,
    AdminModule,
    TeachersModule,
    ParentsModule,
    StudentsModule,
    ClassesModule,
    CoursesModule,
    MaterialsModule,
    PaymentsModule,
    ZoomModule,
    AnnouncementsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global Guards - Centralized here to avoid conflicts
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: EmailVerificationGuard,
    },
    // Global Interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RateLimitInterceptor,
    },
  ],
})
export class AppModule {}
