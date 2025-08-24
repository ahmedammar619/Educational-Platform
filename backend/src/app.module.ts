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
import { StudentsModule } from './modules/students/students.module';
import { ParentsModule } from './modules/parents/parents.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { CoursesModule } from './modules/courses/courses.module';

// Guards and Interceptors
import { CustomThrottlerGuard } from './common/guards/custom-throttler.guard';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { RateLimitInterceptor } from './common/interceptors/rate-limit.interceptor';

// Entities
import { User } from './modules/users/entities/user.entity';
import { Parent } from './modules/parents/entities/parent.entity';
import { Course } from './modules/courses/entities/course.entity';
import { CourseSession } from './modules/courses/entities/course-session.entity';
import { CourseMaterial } from './modules/courses/entities/course-material.entity';
import { CourseFile } from './modules/courses/entities/course-file.entity';
import { CourseFolder } from './modules/courses/entities/course-folder.entity';
import { CourseEnrollment } from './modules/courses/entities/course-enrollment.entity';
import { SessionAttendance } from './modules/courses/entities/session-attendance.entity';
import { SessionMaterial } from './modules/courses/entities/session-material.entity';
import { MaterialAttachment } from './modules/courses/entities/material-attachment.entity';
import { CourseSchedule } from './modules/courses/entities/course-schedule.entity';

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
          Course,
          CourseSession,
          CourseMaterial,
          CourseFile,
          CourseFolder,
          CourseEnrollment,
          SessionAttendance,
          SessionMaterial,
          MaterialAttachment,
          CourseSchedule,
        ],
        synchronize: process.env.DB_SYNC === 'true',
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
    StudentsModule,
    ParentsModule,
    DashboardModule,
    CoursesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
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
