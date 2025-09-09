// src/modules/admin/admin.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateConfigDto, UpdateGoogleFormUrlDto } from './dto/update-config.dto';
import { Role } from '../../common/enums/role.enum';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
@ApiBearerAuth('JWT-auth')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}


  @Get('users/recent')
  @ApiOperation({ summary: 'Get recent users' })
  @ApiResponse({
    status: 200,
    description: 'Recent users retrieved successfully',
  })
  async getRecentUsers() {
    return this.adminService.getRecentUsers();
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users with pagination' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'role', required: false, enum: Role, description: 'Filter by role' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by first name, last name, or email' })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
  })
  async getAllUsers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('role') role?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllUsers(page || 1, limit || 10, { role, search });
  }

  @Post('users')
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
  })
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.adminService.createUser(createUserDto);
  }

  @Put('users/:id')
  @ApiOperation({ summary: 'Update a user' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
  })
  async updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.adminService.updateUser(id, updateUserDto);
  }

  @Get('teachers')
  @ApiOperation({ summary: 'Get all teachers with pagination' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by first name, last name, or email' })
  @ApiResponse({
    status: 200,
    description: 'Teachers retrieved successfully',
  })
  async getAllTeachers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllTeachers(page || 1, limit || 10, search);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete a user permanently' })
  @ApiResponse({
    status: 200,
    description: 'User deleted successfully',
  })
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  // Configuration endpoints
  @Get('config')
  @ApiOperation({ summary: 'Get all configuration settings' })
  @ApiResponse({
    status: 200,
    description: 'Configuration settings retrieved successfully',
  })
  async getAllConfigs() {
    return this.adminService.getAllConfigs();
  }

  @Get('config/google-form-url')
  @ApiOperation({ summary: 'Get Google Form URL for student registration' })
  @ApiResponse({
    status: 200,
    description: 'Google Form URL retrieved successfully',
  })
  async getGoogleFormUrl() {
    const url = await this.adminService.getGoogleFormUrl();
    return { googleFormUrl: url };
  }

  @Put('config/google-form-url')
  @ApiOperation({ summary: 'Set Google Form URL for student registration' })
  @ApiBody({ type: UpdateGoogleFormUrlDto })
  @ApiResponse({
    status: 200,
    description: 'Google Form URL updated successfully',
  })
  async setGoogleFormUrl(@Body() updateGoogleFormUrlDto: UpdateGoogleFormUrlDto) {
    return this.adminService.setGoogleFormUrl(updateGoogleFormUrlDto);
  }

  @Put('config')
  @ApiOperation({ summary: 'Update a configuration setting' })
  @ApiBody({ type: UpdateConfigDto })
  @ApiResponse({
    status: 200,
    description: 'Configuration updated successfully',
  })
  async setConfig(@Body() updateConfigDto: UpdateConfigDto) {
    return this.adminService.setConfig(updateConfigDto);
  }
}
