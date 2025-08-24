// src/data-source.ts
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

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

// Environment validation
const requiredEnvVars = ['DB_HOST', 'DB_USERNAME', 'DB_PASSWORD', 'DB_DATABASE'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

const isProd = process.env.NODE_ENV === 'production';
const isTsRuntime = (__filename || '').endsWith('.ts');
const syncEnv = process.env.DB_SYNC;
const synchronize = syncEnv != null ? syncEnv === 'true' : !isProd; // default true in dev, false in prod
const loggingEnv = process.env.DB_LOGGING;
const logging = loggingEnv != null ? loggingEnv === 'true' : process.env.NODE_ENV === 'development';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
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
  // migrationsTableName: 'typeorm_migrations',
  // migrations: [isTsRuntime ? 'src/migrations/*.ts' : 'dist/migrations/*.js'],
  synchronize,
  logging,
  ssl: isProd ? { rejectUnauthorized: false } : false,
  extra: {
    // Connection pool settings for production
    max: isProd ? 20 : 10, // Maximum number of connections
    min: isProd ? 5 : 2,   // Minimum number of connections
    acquire: 30000,         // Maximum time to acquire connection
    idle: 10000,            // Maximum time connection can be idle
  },
});
