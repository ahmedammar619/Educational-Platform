// src/data-source.ts
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

// Entities
import { User } from './modules/users/entities/user.entity';
import { Group } from './modules/groups/entities/group.entity';
import { GroupStudent } from './modules/groups/entities/group_student.entity';
import { Course } from './modules/courses/entities/course.entity';
import { Enrollment } from './modules/students/entities/enrollment.entity';
import { Assignment } from './modules/assignments/entities/assignment.entity';
import { Submission } from './modules/assignments/entities/submission.entity';
import { Attendance } from './modules/sessions/entities/attendance.entity';
import { ClassSession } from './modules/sessions/entities/class-session.entity';
import { Notification } from './modules/notifications/entities/notification.entity';
import { Parent } from './modules/parents/entities/parent.entity';
import { Content } from './modules/content/entities/content.entity';

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
    Group,
    GroupStudent,
    Course,
    Enrollment,
    Assignment,
    Submission,
    Attendance,
    ClassSession,
    Notification,
    Parent,
    Content,
  ],
  migrationsTableName: 'typeorm_migrations',
  migrations: [isTsRuntime ? 'src/migrations/*.ts' : 'dist/migrations/*.js'],
  synchronize,
  logging,
});
