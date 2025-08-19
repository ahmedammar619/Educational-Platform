import { Controller, Post, Body, Param, Get, ParseIntPipe, UseGuards } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { Role } from '../../common/enums/role.enum';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('groups')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @Roles(Role.Admin)
  async createGroup(
    @Body('name') name: string,
    @Body('teacherId', ParseIntPipe) teacherId: number,
    @Body('studentIds') studentIds: number[],
  ) {
    return this.groupsService.createGroup(name, teacherId, studentIds);
  }

  @Post(':groupId/students')
  @Roles(Role.Admin)
  async assignStudentsToGroup(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Body('studentIds') studentIds: number[],
  ) {
    return this.groupsService.assignStudentsToGroup(groupId, studentIds);
  }

  @Get()
  @Roles(Role.Admin, Role.Teacher, Role.Parent)
  async findAll() {
    return this.groupsService.findAll();
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Teacher, Role.Student, Role.Parent)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.groupsService.findOne(id);
  }
}
