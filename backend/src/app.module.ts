import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { securityConfig } from './config/security.config';

// Feature modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { StudentsModule } from './modules/students/students.module';
import { TeachersModule } from './modules/teachers/teachers.module';
import { AdminModule } from './modules/admin/admin.module';
import { ParentsModule } from './modules/parents/parents.module';

// Entities
import { User } from './modules/users/entities/user.entity';
import { Parent } from './modules/parents/entities/parent.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Rate Limiting Configuration
    ThrottlerModule.forRoot([{
      ttl: securityConfig.rateLimit.ttl,
      limit: securityConfig.rateLimit.limit,
    }]),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const isProd = configService.get('NODE_ENV') === 'production';
        const syncEnv = configService.get('DB_SYNC');
        const synchronize = syncEnv != null ? syncEnv === 'true' : !isProd;
        const loggingEnv = configService.get('DB_LOGGING');
        const logging = loggingEnv != null ? loggingEnv === 'true' : configService.get('NODE_ENV') === 'development';

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
          ],
          synchronize,
          logging,
          ssl: isProd ? { rejectUnauthorized: false } : false,
        };
      },
      inject: [ConfigService],
    }),

    AuthModule,
    UsersModule,
    StudentsModule,
    TeachersModule,
    AdminModule,
    ParentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
