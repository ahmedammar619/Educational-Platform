// src/modules/admin/admin.controller.ts
import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
@ApiBearerAuth('JWT-auth')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics retrieved successfully',
  })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users with pagination' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'role', required: false, enum: Role, description: 'Filter by role' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name or email' })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
  })
  async getAllUsers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('role') role?: Role,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllUsers(page || 1, limit || 10, { role, search });
  }

  @Get('students')
  @ApiOperation({ summary: 'Get all students with pagination' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name or username' })
  @ApiResponse({
    status: 200,
    description: 'Students retrieved successfully',
  })
  async getAllStudents(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllStudents(page || 1, limit || 10, search);
  }

  @Put('users/:id/deactivate')
  @ApiOperation({ summary: 'Deactivate a user' })
  @ApiResponse({
    status: 200,
    description: 'User deactivated successfully',
  })
  async deactivateUser(@Param('id') id: string) {
    return this.adminService.deactivateUser(+id);
  }

  @Put('users/:id/reactivate')
  @ApiOperation({ summary: 'Reactivate a user' })
  @ApiResponse({
    status: 200,
    description: 'User reactivated successfully',
  })
  async reactivateUser(@Param('id') id: string) {
    return this.adminService.reactivateUser(+id);
  }

  @Put('users/:id/unlock')
  @ApiOperation({ summary: 'Unlock a user account (reset failed login attempts)' })
  @ApiResponse({
    status: 200,
    description: 'User account unlocked successfully',
  })
  async unlockUser(@Param('id') id: string) {
    return this.adminService.unlockUser(+id);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete a user permanently' })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully',
  })
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(+id);
  }
}
