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
import { EnrollStudentDto, BulkEnrollDto, ChangeCourseDto } from './dto/enroll-student.dto';
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

  // Course Enrollment Management Endpoints
  @Get('course-enrollment/pending')
  @ApiOperation({ summary: 'Get students who paid but are not enrolled' })
  @ApiQuery({ name: 'planId', required: false, description: 'Filter by subscription plan ID' })
  @ApiResponse({
    status: 200,
    description: 'Pending enrollments retrieved successfully',
  })
  async getPendingEnrollments(@Query('planId') planId?: string) {
    return this.adminService.getPendingEnrollments(planId);
  }

  @Get('course-enrollment/enrolled')
  @ApiOperation({ summary: 'Get all enrolled students with their courses' })
  @ApiQuery({ name: 'planId', required: false, description: 'Filter by subscription plan ID' })
  @ApiResponse({
    status: 200,
    description: 'Enrolled students retrieved successfully',
  })
  async getEnrolledStudents(@Query('planId') planId?: string) {
    return this.adminService.getEnrolledStudents(planId);
  }

  @Get('course-enrollment/missing-payments')
  @ApiOperation({ summary: 'Get students with missing or overdue payments' })
  @ApiResponse({
    status: 200,
    description: 'Missing payments retrieved successfully',
  })
  async getMissingPayments() {
    return this.adminService.getMissingPayments();
  }

  @Get('course-enrollment/summary')
  @ApiOperation({ summary: 'Get financial summary for courses' })
  @ApiQuery({ name: 'planId', required: false, description: 'Filter by subscription plan ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date for filtering' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date for filtering' })
  @ApiResponse({
    status: 200,
    description: 'Course financial summary retrieved successfully',
  })
  async getCourseFinancialSummary(
    @Query('planId') planId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.adminService.getCourseFinancialSummary(planId, startDate, endDate);
  }

  @Post('course-enrollment/enroll')
  @ApiOperation({ summary: 'Enroll a student to a course' })
  @ApiBody({ type: EnrollStudentDto })
  @ApiResponse({
    status: 200,
    description: 'Student enrolled successfully',
  })
  async enrollStudent(@Body() enrollStudentDto: EnrollStudentDto) {
    return this.adminService.enrollStudent(enrollStudentDto);
  }

  @Post('course-enrollment/bulk-enroll')
  @ApiOperation({ summary: 'Bulk enroll multiple students to a course' })
  @ApiBody({ type: BulkEnrollDto })
  @ApiResponse({
    status: 200,
    description: 'Students enrolled successfully',
  })
  async bulkEnrollStudents(@Body() bulkEnrollDto: BulkEnrollDto) {
    return this.adminService.bulkEnrollStudents(bulkEnrollDto);
  }

  @Put('course-enrollment/change-course')
  @ApiOperation({ summary: 'Change the course for an enrolled student' })
  @ApiBody({ type: ChangeCourseDto })
  @ApiResponse({
    status: 200,
    description: 'Course changed successfully',
  })
  async changeCourse(@Body() changeCourseDto: ChangeCourseDto) {
    return this.adminService.changeCourse(changeCourseDto);
  }
}
