// src/data-source.ts
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

// Entities
import { User } from './modules/users/entities/user.entity';
import { Parent } from './modules/parents/entities/parent.entity';

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
  ],
  migrationsTableName: 'typeorm_migrations',
  migrations: [isTsRuntime ? 'src/migrations/*.ts' : 'dist/migrations/*.js'],
  synchronize,
  logging,
});
