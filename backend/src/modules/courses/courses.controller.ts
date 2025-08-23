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
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { CoursesService } from './courses.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CreateSessionDto } from './dto/create-session.dto';
import { CreateMaterialDto } from './dto/create-material.dto';
import { MarkAttendanceDto, BulkMarkAttendanceDto } from './dto/mark-attendance.dto';
import { CreateScheduleDto, UpdateScheduleDto, BulkCreateScheduleDto } from './dto/create-schedule.dto';

@ApiTags('Courses')
@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  // ================= Course Management =================

  @Post()
  @Roles(Role.Teacher, Role.Admin)
  @ApiOperation({ summary: 'Create a new course (Teacher/Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Course created successfully',
  })
  async createCourse(
    @Body() createCourseDto: CreateCourseDto,
    @CurrentUser() user: User,
  ) {
    return this.coursesService.createCourse(createCourseDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all courses with filters' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
  @ApiQuery({ name: 'level', required: false, description: 'Filter by level' })
  @ApiQuery({ name: 'isPublished', required: false, description: 'Filter by publication status' })
  @ApiQuery({ name: 'teacherId', required: false, description: 'Filter by teacher' })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name or description' })
  @ApiResponse({
    status: 200,
    description: 'Courses retrieved successfully',
  })
  async findAllCourses(
    @Query('category') category?: string,
    @Query('level') level?: string,
    @Query('isPublished') isPublished?: boolean,
    @Query('teacherId') teacherId?: number,
    @Query('search') search?: string,
  ) {
    const filters = { category, level, isPublished, teacherId, search };
    return this.coursesService.findAllCourses(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get course by ID' })
  @ApiResponse({
    status: 200,
    description: 'Course retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Course not found',
  })
  async findCourseById(@Param('id') id: string) {
    return this.coursesService.findCourseById(+id);
  }

  @Put(':id')
  @Roles(Role.Teacher, Role.Admin)
  @ApiOperation({ summary: 'Update course (Teacher/Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Course updated successfully',
  })
  async updateCourse(
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
    @CurrentUser() user: User,
  ) {
    return this.coursesService.updateCourse(+id, updateCourseDto, user.id, user.role);
  }

  @Delete(':id')
  @Roles(Role.Teacher, Role.Admin)
  @ApiOperation({ summary: 'Delete course (Teacher/Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Course deleted successfully',
  })
  async deleteCourse(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.coursesService.deleteCourse(+id, user.id, user.role);
  }

  // ================= Session Management =================

  @Post(':courseId/sessions')
  @Roles(Role.Teacher, Role.Admin)
  @ApiOperation({ summary: 'Create a new session (Teacher/Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Session created successfully',
  })
  async createSession(
    @Param('courseId') courseId: string,
    @Body() createSessionDto: CreateSessionDto,
    @CurrentUser() user: User,
  ) {
    return this.coursesService.createSession(+courseId, createSessionDto, user.id);
  }

  @Get(':courseId/sessions')
  @ApiOperation({ summary: 'Get all sessions for a course' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by type' })
  @ApiQuery({ name: 'date', required: false, description: 'Filter by date' })
  @ApiResponse({
    status: 200,
    description: 'Sessions retrieved successfully',
  })
  async findSessionsByCourse(
    @Param('courseId') courseId: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('date') date?: string,
  ) {
    const filters = { status, type, date };
    return this.coursesService.findSessionsByCourse(+courseId, filters);
  }

  @Put('sessions/:sessionId')
  @Roles(Role.Teacher, Role.Admin)
  @ApiOperation({ summary: 'Update session (Teacher/Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Session updated successfully',
  })
  async updateSession(
    @Param('sessionId') sessionId: string,
    @Body() updateData: Partial<CreateSessionDto>,
    @CurrentUser() user: User,
  ) {
    return this.coursesService.updateSession(+sessionId, updateData, user.id);
  }

  @Delete('sessions/:sessionId')
  @Roles(Role.Teacher, Role.Admin)
  @ApiOperation({ summary: 'Delete session (Teacher/Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Session deleted successfully',
  })
  async deleteSession(
    @Param('sessionId') sessionId: string,
    @CurrentUser() user: User,
  ) {
    return this.coursesService.deleteSession(+sessionId, user.id);
  }

  // ================= Material Management =================

  @Post(':courseId/materials')
  @Roles(Role.Teacher, Role.Admin)
  @ApiOperation({ summary: 'Create a new material (Teacher/Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Material created successfully',
  })
  async createMaterial(
    @Param('courseId') courseId: string,
    @Body() createMaterialDto: CreateMaterialDto,
    @CurrentUser() user: User,
  ) {
    return this.coursesService.createMaterial(+courseId, createMaterialDto, user.id);
  }

  @Get(':courseId/materials')
  @ApiOperation({ summary: 'Get all materials for a course' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by type' })
  @ApiQuery({ name: 'isPublished', required: false, description: 'Filter by publication status' })
  @ApiResponse({
    status: 200,
    description: 'Materials retrieved successfully',
  })
  async findMaterialsByCourse(
    @Param('courseId') courseId: string,
    @Query('type') type?: string,
    @Query('isPublished') isPublished?: boolean,
  ) {
    const filters = { type, isPublished };
    return this.coursesService.findMaterialsByCourse(+courseId, filters);
  }

  @Put('materials/:materialId')
  @Roles(Role.Teacher, Role.Admin)
  @ApiOperation({ summary: 'Update material (Teacher/Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Material updated successfully',
  })
  async updateMaterial(
    @Param('materialId') materialId: string,
    @Body() updateData: Partial<CreateMaterialDto>,
    @CurrentUser() user: User,
  ) {
    return this.coursesService.updateMaterial(+materialId, updateData, user.id);
  }

  @Delete('materials/:materialId')
  @Roles(Role.Teacher, Role.Admin)
  @ApiOperation({ summary: 'Delete material (Teacher/Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Material deleted successfully',
  })
  async deleteMaterial(
    @Param('materialId') materialId: string,
    @CurrentUser() user: User,
  ) {
    return this.coursesService.deleteMaterial(+materialId, user.id);
  }

  // ================= Attendance Management =================

  @Post('sessions/:sessionId/attendance')
  @Roles(Role.Teacher, Role.Admin)
  @ApiOperation({ summary: 'Mark attendance for a session (Teacher/Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Attendance marked successfully',
  })
  async markAttendance(
    @Param('sessionId') sessionId: string,
    @Body() markAttendanceDto: MarkAttendanceDto,
    @CurrentUser() user: User,
  ) {
    return this.coursesService.markAttendance(+sessionId, markAttendanceDto, user.id);
  }

  @Post('sessions/:sessionId/attendance/bulk')
  @Roles(Role.Teacher, Role.Admin)
  @ApiOperation({ summary: 'Mark attendance for multiple students (Teacher/Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Attendance marked successfully',
  })
  async bulkMarkAttendance(
    @Param('sessionId') sessionId: string,
    @Body() bulkMarkAttendanceDto: BulkMarkAttendanceDto,
    @CurrentUser() user: User,
  ) {
    return this.coursesService.bulkMarkAttendance(+sessionId, bulkMarkAttendanceDto, user.id);
  }

  @Get('sessions/:sessionId/attendance')
  @ApiOperation({ summary: 'Get attendance for a session' })
  @ApiResponse({
    status: 200,
    description: 'Attendance retrieved successfully',
  })
  async getSessionAttendance(@Param('sessionId') sessionId: string) {
    return this.coursesService.getSessionAttendance(+sessionId);
  }

  // ================= Enrollment Management =================

  @Post(':courseId/enroll')
  @Roles(Role.Student)
  @ApiOperation({ summary: 'Enroll in a course (Student only)' })
  @ApiResponse({
    status: 201,
    description: 'Enrolled successfully',
  })
  async enrollStudent(
    @Param('courseId') courseId: string,
    @CurrentUser() user: User,
  ) {
    return this.coursesService.enrollStudent(+courseId, user.id);
  }

  @Delete(':courseId/enroll')
  @Roles(Role.Student)
  @ApiOperation({ summary: 'Unenroll from a course (Student only)' })
  @ApiResponse({
    status: 200,
    description: 'Unenrolled successfully',
  })
  async unenrollStudent(
    @Param('courseId') courseId: string,
    @CurrentUser() user: User,
  ) {
    return this.coursesService.unenrollStudent(+courseId, user.id);
  }

  // ================= File Management =================

  @Post(':courseId/folders')
  @Roles(Role.Teacher, Role.Admin)
  @ApiOperation({ summary: 'Create a new folder (Teacher/Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Folder created successfully',
  })
  async createFolder(
    @Param('courseId') courseId: string,
    @Body() body: { name: string; description?: string; parentFolderId?: number },
    @CurrentUser() user: User,
  ) {
    return this.coursesService.createFolder(+courseId, body.name, body.description, body.parentFolderId, user.id);
  }

  @Get(':courseId/folders')
  @ApiOperation({ summary: 'Get folders for a course' })
  @ApiQuery({ name: 'parentFolderId', required: false, description: 'Parent folder ID for nested folders' })
  @ApiResponse({
    status: 200,
    description: 'Folders retrieved successfully',
  })
  async findFoldersByCourse(
    @Param('courseId') courseId: string,
    @Query('parentFolderId') parentFolderId?: number,
  ) {
    return this.coursesService.findFoldersByCourse(+courseId, parentFolderId);
  }

  // ================= Schedule Management =================

  @Post(':courseId/schedules')
  @Roles(Role.Teacher, Role.Admin)
  @ApiOperation({ summary: 'Create a new schedule for a course (Teacher/Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Schedule created successfully',
  })
  async createSchedule(
    @Param('courseId') courseId: string,
    @Body() createScheduleDto: CreateScheduleDto,
    @CurrentUser() user: User,
  ) {
    return this.coursesService.createSchedule(+courseId, createScheduleDto, user.id);
  }

  @Post(':courseId/schedules/bulk')
  @Roles(Role.Teacher, Role.Admin)
  @ApiOperation({ summary: 'Create multiple schedules for a course (Teacher/Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Schedules created successfully',
  })
  async bulkCreateSchedules(
    @Param('courseId') courseId: string,
    @Body() bulkCreateScheduleDto: BulkCreateScheduleDto,
    @CurrentUser() user: User,
  ) {
    return this.coursesService.bulkCreateSchedules(+courseId, bulkCreateScheduleDto, user.id);
  }

  @Get(':courseId/schedules')
  @ApiOperation({ summary: 'Get all schedules for a course' })
  @ApiResponse({
    status: 200,
    description: 'Schedules retrieved successfully',
  })
  async findSchedulesByCourse(@Param('courseId') courseId: string) {
    return this.coursesService.findSchedulesByCourse(+courseId);
  }

  @Put('schedules/:scheduleId')
  @Roles(Role.Teacher, Role.Admin)
  @ApiOperation({ summary: 'Update schedule (Teacher/Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Schedule updated successfully',
  })
  async updateSchedule(
    @Param('scheduleId') scheduleId: string,
    @Body() updateScheduleDto: UpdateScheduleDto,
    @CurrentUser() user: User,
  ) {
    return this.coursesService.updateSchedule(+scheduleId, updateScheduleDto, user.id);
  }

  @Delete('schedules/:scheduleId')
  @Roles(Role.Teacher, Role.Admin)
  @ApiOperation({ summary: 'Delete schedule (Teacher/Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Schedule deleted successfully',
  })
  async deleteSchedule(
    @Param('scheduleId') scheduleId: string,
    @CurrentUser() user: User,
  ) {
    return this.coursesService.deleteSchedule(+scheduleId, user.id);
  }

  @Patch('schedules/:scheduleId/toggle')
  @Roles(Role.Teacher, Role.Admin)
  @ApiOperation({ summary: 'Toggle schedule active status (Teacher/Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Schedule status toggled successfully',
  })
  async toggleScheduleStatus(
    @Param('scheduleId') scheduleId: string,
    @CurrentUser() user: User,
  ) {
    return this.coursesService.toggleScheduleStatus(+scheduleId, user.id);
  }

  // ================= Analytics & Reports =================

  @Get(':courseId/stats')
  @ApiOperation({ summary: 'Get course statistics' })
  @ApiResponse({
    status: 200,
    description: 'Course statistics retrieved successfully',
  })
  async getCourseStats(@Param('courseId') courseId: string) {
    return this.coursesService.getCourseStats(+courseId);
  }

  @Get(':courseId/attendance-report')
  @ApiOperation({ summary: 'Get attendance report for a course' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date for report (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date for report (YYYY-MM-DD)' })
  @ApiResponse({
    status: 200,
    description: 'Attendance report retrieved successfully',
  })
  async getAttendanceReport(
    @Param('courseId') courseId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.coursesService.getAttendanceReport(+courseId, start, end);
  }
}
