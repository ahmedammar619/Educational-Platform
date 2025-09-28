import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Role } from '../../common/enums/role.enum';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '../admin/config.service';

@ApiTags('Students')
@Controller('students')
@ApiBearerAuth('JWT-auth')
export class StudentsController {
  constructor(
    private readonly studentsService: StudentsService,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  @Public()
  @ApiOperation({ summary: 'Create a new student account (Public)' })
  @ApiBody({ type: CreateStudentDto })
  @ApiResponse({
    status: 201,
    description: 'Student created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid data',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Student with this email already exists',
  })
  async createStudent(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.createStudent(createStudentDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.Teacher)
  @ApiOperation({ summary: 'Get all students (Admin/Teacher only)' })
  @ApiResponse({
    status: 200,
    description: 'Students retrieved successfully',
  })
  async findAll() {
    const students = await this.studentsService.findAll();
    return { students };
  }

  @Get('google-form-url')
  @Public()
  @ApiOperation({ summary: 'Get Google Form URL for student registration' })
  @ApiResponse({
    status: 200,
    description: 'Google Form URL retrieved successfully',
  })
  async getGoogleFormUrl() {
    const url = await this.configService.getGoogleFormUrl();
    return { googleFormUrl: url };
  }

  @Get('form-status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Student)
  @ApiOperation({ summary: 'Get student form completion status' })
  @ApiResponse({
    status: 200,
    description: 'Form status retrieved successfully',
  })
  async getFormStatus(@CurrentUser() currentUser: any) {
    return this.studentsService.getFormStatus(currentUser.sub);
  }

  @Get('form-completions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Get all students who completed the registration form (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Form completions retrieved successfully',
  })
  async getFormCompletions() {
    return this.studentsService.getFormCompletions();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get student by ID (Protected)' })
  @ApiResponse({
    status: 200,
    description: 'Student retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Student not found',
  })
  async findOne(@Param('id') id: string) {
    const student = await this.studentsService.findOne(id);
    return { student };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Update student information (Protected)' })
  @ApiBody({ type: UpdateStudentDto })
  @ApiResponse({
    status: 200,
    description: 'Student updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Student not found',
  })
  async updateStudent(
    @Param('id') id: string,
    @Body() updateStudentDto: UpdateStudentDto,
    @CurrentUser() currentUser: any
  ) {
    // Allow students to update their own profile, parents to update their children, or admins/teachers
    if (currentUser.sub !== id && 
        currentUser.role !== Role.Admin && 
        currentUser.role !== Role.Teacher &&
        !(currentUser.role === Role.Parent && await this.isParentOfStudent(currentUser.sub, id))) {
      throw new ForbiddenException('You do not have permission to update this student');
    }
    return this.studentsService.updateStudent(id, updateStudentDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Delete a student (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Student deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin privileges required',
  })
  @ApiResponse({
    status: 404,
    description: 'Student not found',
  })
  async deleteStudent(@Param('id') id: string) {
    return this.studentsService.deleteStudent(id);
  }

  @Post(':id/link-parent')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.Parent)
  @ApiOperation({ summary: 'Link student to parent (Admin/Parent only)' })
  @ApiResponse({
    status: 200,
    description: 'Student linked to parent successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Student already has a parent',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Student not found',
  })
  async linkToParent(
    @Param('id') id: string,
    @Body('parentId') parentId: string,
    @CurrentUser() currentUser: any
  ) {
    // Allow admins or the parent themselves to link
    if (currentUser.role !== Role.Admin && currentUser.sub !== parentId) {
      throw new ForbiddenException('You do not have permission to link this student');
    }
    return this.studentsService.linkToParent(id, parentId);
  }

  @Post(':id/unlink-parent')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.Parent)
  @ApiOperation({ summary: 'Unlink student from parent (Admin/Parent only)' })
  @ApiResponse({
    status: 200,
    description: 'Student unlinked from parent successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Student does not have a parent',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Student not found',
  })
  async unlinkFromParent(
    @Param('id') id: string,
    @CurrentUser() currentUser: any
  ) {
    // Allow admins or the parent of this student to unlink
    if (currentUser.role !== Role.Admin && 
        !(currentUser.role === Role.Parent && await this.isParentOfStudent(currentUser.sub, id))) {
      throw new ForbiddenException('You do not have permission to unlink this student');
    }
    return this.studentsService.unlinkFromParent(id);
  }

  @Get('parent/:parentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get students by parent ID (Protected)' })
  @ApiResponse({
    status: 200,
    description: 'Students retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async findByParentId(
    @Param('parentId') parentId: string,
    @CurrentUser() currentUser: any
  ) {
    // Allow parents to view their own children or admins/teachers
    if (currentUser.sub !== parentId && 
        currentUser.role !== Role.Admin && 
        currentUser.role !== Role.Teacher) {
      throw new ForbiddenException('You do not have permission to view these students');
    }
    const students = await this.studentsService.findByParentId(parentId);
    return { students };
  }

  @Get(':id/classes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get student enrolled classes (Protected)' })
  @ApiResponse({
    status: 200,
    description: 'Student classes retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Student not found',
  })
  async getStudentClasses(
    @Param('id') id: string,
    @CurrentUser() currentUser: any
  ) {
    // Allow students to view their own classes, parents to view their children's classes, or admins/teachers
    if (currentUser.sub !== id && 
        currentUser.role !== Role.Admin && 
        currentUser.role !== Role.Teacher &&
        !(currentUser.role === Role.Parent && await this.isParentOfStudent(currentUser.sub, id))) {
      throw new ForbiddenException('You do not have permission to view this student\'s classes');
    }
    return this.studentsService.getStudentClasses(id);
  }

  @Post('mark-form-completed')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Student)
  @ApiOperation({ summary: 'Mark registration form as completed by student' })
  @ApiResponse({
    status: 200,
    description: 'Form marked as completed successfully',
  })
  async markFormCompleted(@CurrentUser() currentUser: any) {
    return this.studentsService.markFormCompleted(currentUser.sub);
  }

  @Post(':id/reset-form-completion')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Reset student form completion status (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Form completion status reset successfully',
  })
  async resetFormCompletion(@Param('id') studentId: string) {
    return this.studentsService.resetFormCompletion(studentId);
  }

  @Post(':id/enroll-course/:courseId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.Teacher)
  @ApiOperation({ summary: 'Enroll student in individual course (Admin/Teacher only)' })
  @ApiResponse({
    status: 200,
    description: 'Student enrolled in course successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Student or course not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Student already enrolled in this course',
  })
  async enrollStudentInCourse(
    @Param('id') studentId: string,
    @Param('courseId') courseId: string
  ) {
    const student = await this.studentsService.enrollStudentInCourse(studentId, courseId);
    return { student, message: 'Student enrolled in course successfully' };
  }

  @Delete(':id/unenroll-course/:courseId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin, Role.Teacher)
  @ApiOperation({ summary: 'Unenroll student from individual course (Admin/Teacher only)' })
  @ApiResponse({
    status: 200,
    description: 'Student unenrolled from course successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Student not enrolled in this course',
  })
  async unenrollStudentFromCourse(
    @Param('id') studentId: string,
    @Param('courseId') courseId: string
  ) {
    const student = await this.studentsService.unenrollStudentFromCourse(studentId, courseId);
    return { student, message: 'Student unenrolled from course successfully' };
  }

  @Get(':id/course-enrollments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get student individual course enrollments (Protected)' })
  @ApiResponse({
    status: 200,
    description: 'Student course enrollments retrieved successfully',
  })
  async getStudentCourseEnrollments(
    @Param('id') studentId: string,
    @CurrentUser() currentUser: any
  ) {
    // Allow students to view their own enrollments, parents to view their children's enrollments, or admins/teachers
    if (currentUser.sub !== studentId && 
        currentUser.role !== Role.Admin && 
        currentUser.role !== Role.Teacher &&
        !(currentUser.role === Role.Parent && await this.isParentOfStudent(currentUser.sub, studentId))) {
      throw new ForbiddenException('You do not have permission to view this student\'s course enrollments');
    }
    const courses = await this.studentsService.getStudentCourseEnrollments(studentId);
    return { courses };
  }

  private async isParentOfStudent(parentId: string, studentId: string): Promise<boolean> {
    const student = await this.studentsService.findOne(studentId);
    return student.parentId === parentId;
  }
}
