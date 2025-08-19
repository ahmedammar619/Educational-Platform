// src/modules/students/students.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
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
import { StudentsService } from './students.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '../../common/enums/role.enum'; // ✅ updated
import { EnrollmentStatus } from '../../common/enums/enrollment-status.enum';

@ApiTags('Students')
@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Student) // ✅ updated
@ApiBearerAuth('JWT-auth')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get('courses')
  @ApiOperation({ summary: "Get student's enrolled courses" })
  @ApiQuery({
    name: 'status',
    enum: EnrollmentStatus,
    required: false,
    description: 'Filter courses by enrollment status',
  })
  @ApiResponse({
    status: 200,
    description: 'Enrolled courses retrieved successfully',
  })
  async getCourses(
    @CurrentUser('id') studentId: number,
    @Query('status') status?: EnrollmentStatus,
  ) {
    const courses = await this.studentsService.getEnrolledCourses(
      studentId,
      status || EnrollmentStatus.ACTIVE,
    );
    return { courses };
  }

  @Get('available-courses')
  @ApiOperation({ summary: 'Get available courses for enrollment' })
  @ApiQuery({ name: 'search', required: false, description: 'Search courses by title or description' })
  @ApiQuery({ name: 'instructorId', required: false, description: 'Filter by instructor ID' })
  @ApiQuery({ name: 'priceMax', required: false, description: 'Maximum price filter' })
  @ApiResponse({
    status: 200,
    description: 'Available courses retrieved successfully',
  })
  async getAvailableCourses(
    @CurrentUser('id') studentId: number,
    @Query('search') search?: string,
    @Query('instructorId') instructorId?: number,
    @Query('priceMax') priceMax?: number,
  ) {
    const courses = await this.studentsService.getAvailableCourses(studentId, {
      search,
      instructorId,
      priceMax,
    });
    return { courses };
  }

  // Enrollment is managed by Admin; students cannot self-enroll

  @Get('assignments')
  @ApiOperation({ summary: "Get student's assignments" })
  @ApiQuery({ name: 'courseId', required: false, description: 'Filter by course ID' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['submitted', 'not_submitted', 'graded', 'overdue'],
    description: 'Filter by submission status',
  })
  @ApiQuery({
    name: 'dueDateFilter',
    required: false,
    enum: ['upcoming', 'overdue'],
    description: 'Filter by due date',
  })
  @ApiResponse({ status: 200, description: 'Assignments retrieved successfully' })
  async getAssignments(
    @CurrentUser('id') studentId: number,
    @Query('courseId') courseId?: number,
    @Query('status') status?: string,
    @Query('dueDateFilter') dueDateFilter?: string,
  ) {
    const assignments = await this.studentsService.getStudentAssignments(studentId, {
      courseId,
      status,
      dueDateFilter,
    });
    return { assignments };
  }

  @Post('assignments/:assignmentId/submit')
  @ApiOperation({ summary: 'Submit assignment' })
  @ApiResponse({ status: 201, description: 'Assignment submitted successfully' })
  @ApiResponse({ status: 404, description: 'Assignment not found or not enrolled in course' })
  async submitAssignment(
    @CurrentUser('id') studentId: number,
    @Param('assignmentId') assignmentId: string,
    @Body() submissionData: { submissionText?: string; fileUrl?: string },
  ) {
    return this.studentsService.submitAssignment(studentId, +assignmentId, submissionData);
  }

  @Get('grades')
  @ApiOperation({ summary: "Get student's grades" })
  @ApiQuery({ name: 'courseId', required: false, description: 'Filter by course ID' })
  @ApiQuery({ name: 'assignmentType', required: false, description: 'Filter by assignment type' })
  @ApiResponse({ status: 200, description: 'Grades retrieved successfully' })
  async getGrades(
    @CurrentUser('id') studentId: number,
    @Query('courseId') courseId?: number,
    @Query('assignmentType') assignmentType?: string,
  ) {
    return this.studentsService.getStudentGrades(studentId, { courseId, assignmentType });
  }

  @Get('schedule')
  @ApiOperation({ summary: "Get student's schedule" })
  @ApiQuery({ name: 'start_date', required: false, description: 'Start date filter' })
  @ApiQuery({ name: 'end_date', required: false, description: 'End date filter' })
  @ApiResponse({ status: 200, description: 'Schedule retrieved successfully' })
  async getSchedule(
    @CurrentUser('id') studentId: number,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ) {
    return this.studentsService.getSchedule(studentId, { startDate, endDate });
  }

  @Get('enrolled-courses')
  @ApiOperation({ summary: "Get student's enrolled courses (alias)" })
  @ApiResponse({ status: 200, description: 'Enrolled courses retrieved successfully' })
  async getEnrolledCourses(@CurrentUser('id') studentId: number) {
    const courses = await this.studentsService.getEnrolledCourses(studentId, EnrollmentStatus.ACTIVE);
    return { courses };
  }

  @Get('waitlist')
  @ApiOperation({ summary: "Get student's waitlisted courses" })
  @ApiResponse({ status: 200, description: 'Waitlisted courses retrieved successfully' })
  async getWaitlist(@CurrentUser('id') studentId: number) {
    return this.studentsService.getWaitlist(studentId);
  }

  // Enrollment is managed by Admin; students cannot self-enroll

  // Dropping is managed by Admin; students cannot drop themselves

  @Get('courses/:courseId')
  @ApiOperation({ summary: 'Get specific course details for student' })
  @ApiResponse({ status: 200, description: 'Course details retrieved successfully' })
  async getCourseDetails(
    @CurrentUser('id') studentId: number,
    @Param('courseId') courseId: string,
  ) {
    return this.studentsService.getCourseDetails(studentId, +courseId);
  }
}
