import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { runSeeds } from './seeds';

// Entities
import { User } from '../modules/users/entities/user.entity';
import { Course } from '../modules/courses/entities/course.entity';
import { Enrollment } from '../modules/students/entities/enrollment.entity';
import { Assignment } from '../modules/assignments/entities/assignment.entity';
import { Submission } from '../modules/assignments/entities/submission.entity';
import { ClassSession } from '../modules/sessions/entities/class-session.entity';
import { Attendance } from '../modules/sessions/entities/attendance.entity';
import { Content } from '../modules/content/entities/content.entity';
import { Notification } from '../modules/notifications/entities/notification.entity';
import { Group } from '../modules/groups/entities/group.entity';
import { GroupStudent } from '../modules/groups/entities/group_student.entity';
import { Parent } from '../modules/parents/entities/parent.entity';

// Load environment variables
config();

const configService = new ConfigService();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: configService.get<string>('DB_HOST', 'localhost'),
  port: Number(configService.get<number>('DB_PORT', 5432)),
  username: configService.get<string>('DB_USERNAME', 'postgres'),
  password: configService.get<string>('DB_PASSWORD', 'password'),
  database: configService.get<string>('DB_NAME', 'education_db'),
  entities: [
    User,
    Course,
    Enrollment,
    Assignment,
    Submission,
    ClassSession,
    Attendance,
    Content,
    Notification,
    Group,
    GroupStudent,
    Parent,
  ],
  synchronize: false, // don't auto-sync in seeding
  logging: false,
});

async function seed() {
  try {
    console.log('🔌 Connecting to database...');
    await AppDataSource.initialize();
    console.log('✅ Database connected successfully');

    await runSeeds(AppDataSource);

    console.log('🎉 Seeding process completed!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('🔌 Database connection closed');
    }
  }
}

seed();
