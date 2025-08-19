import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from './entities/group.entity';
import { GroupStudent } from './entities/group_student.entity';
import { User } from '../users/entities/user.entity';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Group, GroupStudent, User])],
  controllers: [GroupsController],
  providers: [GroupsService, RolesGuard],
  exports: [GroupsService],
})
export class GroupsModule {}
