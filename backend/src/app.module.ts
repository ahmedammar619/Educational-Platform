import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { securityConfig } from './config/security.config';
import { validate, validateRequiredEnvVars, validateProductionEnvVars, getEnvironmentConfig } from './config/env.validation';

// Feature modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { StudentsModule } from './modules/students/students.module';
import { TeachersModule } from './modules/teachers/teachers.module';
import { AdminModule } from './modules/admin/admin.module';
import { ParentsModule } from './modules/parents/parents.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { CoursesModule } from './modules/courses/courses.module';
import { CommonModule } from './common/common.module';

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
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate,
      cache: true,
    }),

    // Rate Limiting Configuration
    ThrottlerModule.forRoot([{
      ttl: securityConfig.rateLimit.ttl,
      limit: securityConfig.rateLimit.limit,
    }]),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const envConfig = getEnvironmentConfig();
        const isProd = envConfig.isProduction;
        const syncEnv = configService.get('DB_SYNC');
        const synchronize = syncEnv != null ? syncEnv === 'true' : !isProd;
        const loggingEnv = configService.get('DB_LOGGING');
        const logging = loggingEnv != null ? loggingEnv === 'true' : envConfig.isDevelopment;

        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST', 'localhost'),
          port: Number(configService.get<number>('DB_PORT', 5432)),
          username: configService.get<string>('DB_USERNAME', 'postgres'),
          password: configService.get<string>('DB_PASSWORD', 'password'),
          database: configService.get<string>('DB_DATABASE', 'education_db'),
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
          synchronize,
          logging,
          ssl: isProd ? { rejectUnauthorized: false } : false,
          extra: {
            // Connection pool settings
            max: configService.get<number>('DB_POOL_MAX', isProd ? 20 : 10),
            min: configService.get<number>('DB_POOL_MIN', isProd ? 5 : 2),
            acquire: 30000,
            idle: 10000,
          },
        };
      },
      inject: [ConfigService],
    }),

    CommonModule, // Added for global security services
    AuthModule,
    UsersModule,
    StudentsModule,
    TeachersModule,
    AdminModule,
    ParentsModule,
    DashboardModule,
    CoursesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: 'APP_INTERCEPTOR',
      useFactory: () => {
        // Validate environment variables on app startup
        validateRequiredEnvVars();
        validateProductionEnvVars();
        return null;
      },
    },
  ],
})
export class AppModule {}
