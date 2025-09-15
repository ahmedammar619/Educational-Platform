import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { TeachersModule } from '../teachers/teachers.module';
import { StudentsModule } from '../students/students.module';
import { ParentsModule } from '../parents/parents.module';
import { EmailService } from '../../common/services/email.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    TeachersModule,
    StudentsModule,
    ParentsModule
  ],
  controllers: [UsersController],
  providers: [UsersService, EmailService],
  exports: [UsersService],
})
export class UsersModule {}