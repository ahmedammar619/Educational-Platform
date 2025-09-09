import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { ConfigService } from './config.service';
import { User } from '../users/entities/user.entity';
import { AppConfig } from './entities/app-config.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, AppConfig]),
    AuthModule
  ],
  controllers: [AdminController],
  providers: [AdminService, ConfigService],
  exports: [AdminService, ConfigService],
})
export class AdminModule {}