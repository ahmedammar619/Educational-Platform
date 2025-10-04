import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseResponseDto } from './dto/course-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { plainToClass } from 'class-transformer';

@ApiTags('Courses')
@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Create a new course (Admin only)' })
  @ApiResponse({ status: 201, description: 'Course created successfully' })
  async createCourse(@Body() createCourseDto: CreateCourseDto): Promise<CourseResponseDto> {
    const course = await this.coursesService.createCourse(createCourseDto);
    return plainToClass(CourseResponseDto, course, { excludeExtraneousValues: true });
  }

  @Get()
  @Roles(Role.Admin, Role.Teacher)
  @ApiOperation({ summary: 'Get all courses (Admin/Teacher only)' })
  @ApiResponse({ status: 200, description: 'Courses retrieved successfully' })
  async findAllCourses(): Promise<CourseResponseDto[]> {
    const courses = await this.coursesService.findAllCourses();
    return courses.map(course => 
      plainToClass(CourseResponseDto, course, { excludeExtraneousValues: true })
    );
  }

  @Get('class/:classId')
  @Roles(Role.Admin, Role.Teacher)
  @ApiOperation({ summary: 'Get all courses in a class with enrolled students (Admin/Teacher only)' })
  @ApiResponse({ status: 200, description: 'Courses with enrolled students retrieved successfully' })
  async findCoursesByClass(@Param('classId') classId: string): Promise<CourseResponseDto[]> {
    console.log('🎯 Controller: findCoursesByClass called for classId:', classId);
    console.log('🎯 Controller: Request received at:', new Date().toISOString());
    
    const courses = await this.coursesService.findCoursesByClass(classId);
    console.log('📋 Controller: Raw courses from service:', courses.map((c: any) => ({
      name: c.name,
      enrolledStudentsCount: c.enrolledStudents?.length || 0,
      enrolledStudents: c.enrolledStudents
    })));
    
    const mappedCourses = courses.map(course => 
      plainToClass(CourseResponseDto, course, { excludeExtraneousValues: true })
    );
    
    console.log('📋 Controller: Mapped courses for response:', mappedCourses.map(c => ({
      name: c.name,
      enrolledStudentsCount: c.enrolledStudents?.length || 0
    })));
    
    return mappedCourses;
  }

  @Get('teacher/:teacherId')
  @Roles(Role.Admin, Role.Teacher)
  @ApiOperation({ summary: 'Get all courses for a specific teacher (Admin/Teacher only)' })
  @ApiResponse({ status: 200, description: 'Teacher courses retrieved successfully' })
  async findCoursesByTeacher(@Param('teacherId') teacherId: string): Promise<CourseResponseDto[]> {
    console.log('🎯 Controller: findCoursesByTeacher called for teacherId:', teacherId);
    
    const courses = await this.coursesService.findCoursesByTeacher(teacherId);
    console.log('📋 Controller: Teacher courses from service:', courses.map((c: any) => ({
      name: c.name,
      className: c.className,
      sessions: c.sessions
    })));
    
    const mappedCourses = courses.map(course => 
      plainToClass(CourseResponseDto, course, { excludeExtraneousValues: true })
    );
    
    return mappedCourses;
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Teacher, Role.Student, Role.Parent)
  @ApiOperation({ summary: 'Get course by ID with enrolled students (Protected)' })
  @ApiResponse({ status: 200, description: 'Course with enrolled students retrieved successfully' })
  async findCourseById(@Param('id') id: string): Promise<CourseResponseDto> {
    const course = await this.coursesService.findCourseById(id);
    return plainToClass(CourseResponseDto, course, { excludeExtraneousValues: true });
  }

  @Patch(':id')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Update course information (Admin only)' })
  @ApiResponse({ status: 200, description: 'Course updated successfully' })
  async updateCourse(
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
  ): Promise<CourseResponseDto> {
    const course = await this.coursesService.updateCourse(id, updateCourseDto);
    return plainToClass(CourseResponseDto, course, { excludeExtraneousValues: true });
  }

  @Delete(':id')
  @Roles(Role.Admin)
  @ApiOperation({ summary: 'Delete a course (Admin only)' })
  @ApiResponse({ status: 200, description: 'Course deleted successfully' })
  async deleteCourse(@Param('id') id: string): Promise<void> {
    await this.coursesService.deleteCourse(id);
  }

  @Get(':id/students')
  @Roles(Role.Admin, Role.Teacher)
  @ApiOperation({ summary: 'Get students enrolled in a course (Admin/Teacher only)' })
  @ApiResponse({ status: 200, description: 'Course students retrieved successfully' })
  async getCourseStudents(@Param('id') id: string) {
    const students = await this.coursesService.getStudentsInCourse(id);
    return { students };
  }

}
